require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const {
  CORS_ORIGIN,
  DOWNLOAD_DIR,
  MAX_DOWNLOAD_BYTES,
  PORT,
  PUBLIC_BASE_URL,
  STEPFUN_API_KEY,
  STEPFUN_MODEL,
  STEPFUN_URL,
} = require('./config');
const { extractJSON, normalizeAnalysis } = require('./analysis');

const app = express();

// Serve built frontend static files
app.use(express.static(path.join(__dirname, 'public')))
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'))
})

if (!STEPFUN_API_KEY) {
  console.error('Error: STEPFUN_API_KEY not set in .env')
  process.exit(1)
}

// 确保下载目录存在
if (!fs.existsSync(DOWNLOAD_DIR)) {
  fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });
}

function getSafeDownloadPath(fileName) {
  if (!fileName || fileName.includes('/') || fileName.includes('\\') || fileName.includes('..')) {
    return null;
  }

  const filePath = path.resolve(DOWNLOAD_DIR, fileName);
  const root = `${DOWNLOAD_DIR}${path.sep}`;
  if (!filePath.startsWith(root)) return null;
  return filePath;
}

function parseHttpUrl(raw) {
  if (!raw || typeof raw !== 'string') return null;

  try {
    const url = new URL(raw);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
    return url.toString();
  } catch {
    return null;
  }
}

function formatUrlForLog(raw) {
  try {
    const url = new URL(raw);
    return `${url.origin}${url.pathname}`.substring(0, 80);
  } catch {
    return 'invalid-url';
  }
}

function isAllowedDownloadType(contentType) {
  const normalized = (contentType || '').toLowerCase();
  return (
    normalized.startsWith('video/') ||
    normalized.includes('application/octet-stream') ||
    normalized.includes('binary/octet-stream')
  );
}

function formatErrorMessage(err) {
  const parts = [err?.message || 'request failed'];
  const cause = err?.cause;
  if (cause?.code) parts.push(cause.code);
  if (cause?.message && cause.message !== err?.message) parts.push(cause.message);
  return parts.join(': ');
}

const corsOptions = {
  origin: CORS_ORIGIN ? CORS_ORIGIN.split(',').map(s => s.trim()) : [],
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false,
};

// 流式视频播放接口（绕过 ngrok 浏览器警告）
app.get('/stream/:fileName', cors(corsOptions), (req, res) => {
  const fileName = req.params.fileName;
  const filePath = getSafeDownloadPath(fileName);

  if (!filePath) {
    return res.status(400).json({ error: 'invalid fileName' });
  }

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Video not found' });
  }

  const stat = fs.statSync(filePath);
  const fileSize = stat.size;
  const range = req.headers.range;

  if (range) {
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    if (Number.isNaN(start) || Number.isNaN(end) || start < 0 || end >= fileSize || start > end) {
      return res.status(416).json({ error: 'invalid range' });
    }
    const chunksize = end - start + 1;
    const file = fs.createReadStream(filePath, { start, end });
    const head = {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Content-Type': 'video/mp4',
    };
    res.writeHead(206, head);
    file.pipe(res);
  } else {
    const head = {
      'Content-Length': fileSize,
      'Content-Type': 'video/mp4',
    };
    res.writeHead(200, head);
    fs.createReadStream(filePath).pipe(res);
  }
});

app.use(cors(corsOptions));

app.options('*', cors(corsOptions));
app.use(express.json({ limit: '10mb' }));

app.post('/analyze', async (req, res) => {
  const videoUrl = parseHttpUrl(req.body?.videoUrl);
  if (!videoUrl) {
    return res.status(400).json({ error: 'valid http/https videoUrl is required' });
  }
  console.log(`[Analyze] URL: ${formatUrlForLog(videoUrl)}...`);
  try {
    const response = await fetch(STEPFUN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${STEPFUN_API_KEY}`,
      },
      body: JSON.stringify({
        model: STEPFUN_MODEL,
        messages: [
          {
            role: 'system',
            content: `你是一个专业的视频分析助手。请分析视频内容并输出严格JSON格式，不要输出任何其他文字：

{
  "characters": [{"name": "角色名", "description": "角色描述"}],
  "plotSummary": "剧情摘要，200字以内",
  "timeline": [{"time": "00:05:30", "event": "事件描述"}],
  "relationships": [{"from": "角色A", "to": "角色B", "relation": "关系类型"}],
  "storyline": [
    {
      "phase": "阶段名称，如：第一幕：开篇",
      "summary": "该阶段100字以内剧情摘要",
      "highlights": ["关键情节点1", "关键情节点2"],
      "mood": "情绪标签，如：紧张、温馨、悬疑"
    }
  ],
  "theme": {
    "primary": "#RRGGBB",
    "secondary": "#RRGGBB",
    "accent": "#RRGGBB",
    "surface": "#RRGGBB",
    "text": "#RRGGBB",
    "textMuted": "#RRGGBB",
    "bubbleUser": "#RRGGBB",
    "bubbleAi": "#RRGGBB",
    "tagBg": "#RRGGBB",
    "tagText": "#RRGGBB",
    "mood": "主题氛围词，如：赛博朋克、复古胶片、清新治愈"
  }
}

要求：
1. storyline 分3-5个阶段，必须覆盖故事的起承转合。
2. theme 的颜色必须基于视频内容的视觉风格选取（如科幻片用冷色调，爱情片用暖色调），所有颜色必须是合法的6位hex格式。
3. 只输出纯JSON，不要markdown代码块，不要解释文字。`
          },
          {
            role: 'user',
            content: [
              { type: 'text', text: '请详细分析这个视频的内容、人物关系和剧情发展' },
              { type: 'video_url', video_url: { url: videoUrl } }
            ]
          }
        ],
        temperature: 0.3,
        max_tokens: 4096,
        stream: false,
      }),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[StepFun Error]', errorData);
      return res.status(response.status).json({
        error: 'StepFun API error',
        details: errorData
      });
    }
    const data = await response.json();
    console.log(`[Analyze] Raw done, tokens: ${data.usage?.total_tokens || '?'}`);

    // 提取并校验 AI 返回的分析结果
    const content = data.choices?.[0]?.message?.content;
    const rawJson = extractJSON(content);
    if (!rawJson) {
      console.error('[Analyze] Failed to parse AI JSON response');
      return res.status(500).json({ error: 'Failed to parse AI analysis response' });
    }

    const analysis = normalizeAnalysis(rawJson);
    console.log(`[Analyze] Parsed ok, chars: ${analysis.characters?.length || 0}, storyline: ${analysis.storyline?.length || 0}, mood: ${analysis.theme?.mood || 'none'}`);
    res.json({ analysis });
  } catch (err) {
    const message = formatErrorMessage(err);
    console.error('[Analyze Error]', message);
    res.status(500).json({ error: message });
  }
});

app.post('/chat', async (req, res) => {
  const { messages, temperature = 0.7, max_tokens = 2048 } = req.body;
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'messages array is required' });
  }
  try {
    const response = await fetch(STEPFUN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${STEPFUN_API_KEY}`,
      },
      body: JSON.stringify({
        model: STEPFUN_MODEL,
        messages,
        temperature,
        max_tokens,
        stream: false,
      }),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return res.status(response.status).json({
        error: 'StepFun API error',
        details: errorData
      });
    }
    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error('[Chat Error]', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.post('/download', async (req, res) => {
  const videoUrl = parseHttpUrl(req.body?.videoUrl);
  if (!videoUrl) {
    return res.status(400).json({ error: 'valid http/https videoUrl is required' });
  }

  console.log(`[Download] Proxying: ${formatUrlForLog(videoUrl)}...`);

  try {
    const response = await fetch(videoUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    if (!response.ok) {
      return res.status(502).json({ error: `Source returned ${response.status}` });
    }

    const contentType = response.headers.get('content-type') || 'video/mp4';
    const contentLength = response.headers.get('content-length');
    const contentLengthBytes = contentLength ? Number(contentLength) : 0;

    if (!isAllowedDownloadType(contentType)) {
      return res.status(415).json({ error: `Unsupported source content type: ${contentType}` });
    }

    if (contentLengthBytes > MAX_DOWNLOAD_BYTES) {
      return res.status(413).json({ error: `Video exceeds max download size (${MAX_DOWNLOAD_BYTES} bytes)` });
    }

    res.setHeader('Content-Type', contentType);
    if (contentLength) res.setHeader('Content-Length', contentLength);

    // 直接流式传输给客户端
    const reader = response.body.getReader();
    let receivedBytes = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      receivedBytes += value.byteLength;
      if (receivedBytes > MAX_DOWNLOAD_BYTES) {
        console.error(`[Download Error] Source exceeded max size while streaming: ${receivedBytes}`);
        res.destroy(new Error('Video exceeds max download size'));
        return;
      }
      res.write(Buffer.from(value));
    }
    res.end();

    console.log(`[Download] Stream finished`);
  } catch (err) {
    const message = formatErrorMessage(err);
    console.error('[Download Error]', message);
    if (!res.headersSent) {
      res.status(500).json({ error: message });
    }
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// SPA fallback: serve index.html for all non-API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'))
});

app.use((err, req, res, next) => {
  console.error('[Server Error]', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`=================================`);
  console.log(`Peel Proxy running`);
  console.log(`Port: ${PORT}`);
  console.log(`Public Base URL: ${PUBLIC_BASE_URL}`);
  console.log(`Bind: 0.0.0.0 (all interfaces)`);
  console.log(`Health:   GET  http://localhost:${PORT}/health`);
  console.log(`Analyze:  POST http://localhost:${PORT}/analyze`);
  console.log(`Chat:     POST http://localhost:${PORT}/chat`);
  console.log(`Download: POST http://localhost:${PORT}/download`);
  console.log(`Stream:   GET  http://localhost:${PORT}/stream/<file>`);
  console.log(`=================================`);
});
