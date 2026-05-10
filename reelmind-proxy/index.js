require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();

// 确保下载目录存在
const DOWNLOAD_DIR = path.join(__dirname, 'downloads');
if (!fs.existsSync(DOWNLOAD_DIR)) {
  fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });
}

// 流式视频播放接口（绕过 ngrok 浏览器警告）
app.get('/stream/:fileName', (req, res) => {
  const fileName = req.params.fileName;
  const filePath = path.join(DOWNLOAD_DIR, fileName);

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

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'ngrok-skip-browser-warning'],
  credentials: false,
}));

app.options('*', cors());
app.use(express.json({ limit: '10mb' }));

const STEPFUN_API_KEY = process.env.STEPFUN_API_KEY;
const STEPFUN_URL = 'https://api.stepfun.com/v1/chat/completions';

// ---------- JSON 提取与校验工具 ----------
const HEX_RE = /^#[0-9A-Fa-f]{6}$/;

function extractJSON(content) {
  if (!content || typeof content !== 'string') return null;
  // 1. 直接解析
  try { return JSON.parse(content); } catch {}
  // 2. Markdown 代码块
  const codeBlock = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (codeBlock) {
    try { return JSON.parse(codeBlock[1]); } catch {}
  }
  // 3. 正则提取最大 { ... } 块
  const braceMatch = content.match(/\{[\s\S]*\}/);
  if (braceMatch) {
    try { return JSON.parse(braceMatch[0]); } catch {}
  }
  return null;
}

const DEFAULT_THEME = {
  primary: '#2563EB', secondary: '#1F2937', accent: '#3B82F6',
  surface: '#111827', text: '#F3F4F6', textMuted: '#9CA3AF',
  bubbleUser: '#2563EB', bubbleAi: '#374151',
  tagBg: '#374151', tagText: '#D1D5DB', mood: '默认'
};

function normalizeAnalysis(raw) {
  const analysis = {
    characters: Array.isArray(raw?.characters) ? raw.characters : [],
    plotSummary: typeof raw?.plotSummary === 'string' ? raw.plotSummary : '',
    timeline: Array.isArray(raw?.timeline) ? raw.timeline : [],
    relationships: Array.isArray(raw?.relationships) ? raw.relationships : [],
    storyline: undefined,
    theme: undefined,
  };

  if (Array.isArray(raw?.storyline)) {
    analysis.storyline = raw.storyline.filter(s =>
      s && typeof s.phase === 'string' && typeof s.summary === 'string' &&
      Array.isArray(s.highlights) && typeof s.mood === 'string'
    );
  }

  if (raw?.theme && typeof raw.theme === 'object') {
    const t = raw.theme;
    const theme = {};
    for (const k of Object.keys(DEFAULT_THEME)) {
      const v = t[k];
      if (k === 'mood') {
        theme[k] = typeof v === 'string' && v.trim() ? v.trim() : DEFAULT_THEME[k];
      } else {
        theme[k] = typeof v === 'string' && HEX_RE.test(v.trim()) ? v.trim() : DEFAULT_THEME[k];
      }
    }
    analysis.theme = theme;
  }

  return analysis;
}
// ----------------------------------------

if (!STEPFUN_API_KEY) {
  console.error('Error: STEPFUN_API_KEY not set in .env');
  process.exit(1);
}

app.post('/analyze', async (req, res) => {
  const { videoUrl } = req.body;
  if (!videoUrl) {
    return res.status(400).json({ error: 'videoUrl is required' });
  }
  try {
    new URL(videoUrl);
  } catch {
    return res.status(400).json({ error: 'invalid videoUrl format' });
  }
  console.log(`[Analyze] URL: ${videoUrl.substring(0, 60)}...`);
  try {
    const response = await fetch(STEPFUN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${STEPFUN_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'step-3.6',
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
    console.error('[Analyze Error]', err.message);
    res.status(500).json({ error: err.message });
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
        model: 'step-3.6',
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
  const { videoUrl } = req.body;
  if (!videoUrl) {
    return res.status(400).json({ error: 'videoUrl is required' });
  }
  try {
    new URL(videoUrl);
  } catch {
    return res.status(400).json({ error: 'invalid videoUrl format' });
  }

  console.log(`[Download] Proxying: ${videoUrl.substring(0, 60)}...`);

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

    res.setHeader('Content-Type', contentType);
    if (contentLength) res.setHeader('Content-Length', contentLength);

    // 直接流式传输给客户端
    const reader = response.body.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(Buffer.from(value));
    }
    res.end();

    console.log(`[Download] Stream finished`);
  } catch (err) {
    console.error('[Download Error]', err.message);
    if (!res.headersSent) {
      res.status(500).json({ error: err.message });
    }
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use((err, req, res, next) => {
  console.error('[Server Error]', err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`=================================`);
  console.log(`ReelMind Proxy running`);
  console.log(`Port: ${PORT}`);
  console.log(`Bind: 0.0.0.0 (all interfaces)`);
  console.log(`Health:   GET  http://localhost:${PORT}/health`);
  console.log(`Analyze:  POST http://localhost:${PORT}/analyze`);
  console.log(`Chat:     POST http://localhost:${PORT}/chat`);
  console.log(`Download: POST http://localhost:${PORT}/download`);
  console.log(`Stream:   GET  http://localhost:${PORT}/stream/<file>`);
  console.log(`=================================`);
});
