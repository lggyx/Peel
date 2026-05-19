import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Filesystem, Directory } from '@capacitor/filesystem'
import { getDB, initDB } from '../db/init'
import { generateUUID } from '../utils/uuid'
import { API_HEADERS, apiUrl, formatRequestError, normalizeHttpUrl, readErrorMessage } from '../config/api'

/** 请求后端下载视频，保存到本地文件系统，返回本地 file:// 路径 */
async function downloadVideoViaProxy(url: string, id: string): Promise<string | null> {
  const res = await fetch(apiUrl('/download'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...API_HEADERS,
    },
    body: JSON.stringify({ videoUrl: url }),
  })
  if (!res.ok) {
    const message = await readErrorMessage(res, `下载失败 (${res.status})`)
    console.error('[Download] Proxy failed:', message)
    return null
  }

  // 读取二进制并转为 base64
  const blob = await res.blob()
  const arrayBuffer = await blob.arrayBuffer()
  const bytes = new Uint8Array(arrayBuffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  const base64 = btoa(binary)

  // 写入本地文件系统
  const fileName = `video_${id}.mp4`
  await Filesystem.writeFile({
    path: fileName,
    data: base64,
    directory: Directory.Data,
    recursive: true,
  })

  // 获取 file:// URI
  const uriResult = await Filesystem.getUri({
    path: fileName,
    directory: Directory.Data,
  })

  console.log('[Download] Saved locally:', uriResult.uri)
  return uriResult.uri
}

async function deleteDownloadedVideo(id: string) {
  try {
    await Filesystem.deleteFile({
      path: `video_${id}.mp4`,
      directory: Directory.Data,
    })
    console.log('[Download] Deleted local file:', id)
  } catch (err) {
    console.warn('[Download] Cleanup skipped:', err)
  }
}

function isDownloadedVideo(url: string): boolean {
  return url.startsWith('file://')
}

interface Video {
  id: string
  title: string
  url: string
  status: string
  analysis_json: string
  created_at: number
}

export default function Library() {
  const [videos, setVideos] = useState<Video[]>([])
  const [showAdd, setShowAdd] = useState(false)
  const [urlInput, setUrlInput] = useState('')
  const [analyzing, setAnalyzing] = useState(false)
  const [dbError, setDbError] = useState('')
  const navigate = useNavigate()

  const loadVideos = useCallback(async () => {
    try {
      const db = await getDB()
      const res = await db.query('SELECT * FROM videos ORDER BY created_at DESC')
      setVideos(res.values || [])
      setDbError('')
    } catch (err: any) {
      console.error('[Library] Load error:', err)
      setDbError('数据库加载失败: ' + err.message)
    }
  }, [])

  useEffect(() => {
    initDB().then(loadVideos).catch(err => {
      setDbError('数据库初始化失败: ' + err.message)
    })
  }, [loadVideos])

  async function addVideo() {
    if (!urlInput.trim() || analyzing) return

    setAnalyzing(true)
    const sourceUrl = normalizeHttpUrl(urlInput)
    if (!sourceUrl) {
      alert('请输入有效的 http 或 https 视频 URL')
      setAnalyzing(false)
      return
    }

    const id = generateUUID()
    let downloadedUrl: string | null = null

    try {
      // 并发执行：AI 分析 + 视频下载到本地文件系统
      const analyzePromise = fetch(apiUrl('/analyze'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...API_HEADERS,
        },
        body: JSON.stringify({ videoUrl: sourceUrl }),
      })

      const downloadPromise = downloadVideoViaProxy(sourceUrl, id)
        .then((url) => {
          downloadedUrl = url
          return url
        })
        .catch(err => {
          console.error('[Download] Failed:', err)
          return null
        })

      const [res, proxyUrl] = await Promise.all([analyzePromise, downloadPromise])

      if (!res.ok) {
        throw new Error(await readErrorMessage(res, `分析失败 (${res.status})`))
      }

      const data = await res.json()
      const analysis = data.analysis
      if (!analysis || typeof analysis !== 'object') throw new Error('分析结果为空')

      const title = analysis.characters?.[0]?.name
        ? `${analysis.characters[0].name}的视频`
        : '未命名视频'

      // 优先使用本地下载后的 file:// URL，失败则回退到原始 URL
      const finalUrl = proxyUrl || sourceUrl

      const db = await getDB()
      await db.run(
        'INSERT INTO videos (id, title, url, status, analysis_json) VALUES (?, ?, ?, ?, ?)',
        [id, title, finalUrl, 'completed', JSON.stringify(analysis)]
      )

      setShowAdd(false)
      setUrlInput('')
      loadVideos()

    } catch (err: any) {
      if (downloadedUrl) {
        await deleteDownloadedVideo(id)
      }
      alert('分析失败: ' + formatRequestError(err))
    } finally {
      setAnalyzing(false)
    }
  }

  async function handleDelete(video: Video) {
    try {
      const db = await getDB()
      await db.run('DELETE FROM videos WHERE id = ?', [video.id])
      await db.run('DELETE FROM chat_messages WHERE video_id = ?', [video.id])
      if (isDownloadedVideo(video.url)) {
        await deleteDownloadedVideo(video.id)
      }
      loadVideos()
    } catch (err: any) {
      alert('删除失败: ' + err.message)
    }
  }

  return (
    <div className="h-screen bg-black text-white flex flex-col safe-top safe-bottom">
      <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between">
        <h1 className="text-lg font-bold">ReelMind</h1>
        <span className="text-xs text-gray-500">{videos.length} 个视频</span>
      </div>

      {dbError && (
        <div className="mx-4 mt-2 p-3 bg-red-900/50 border border-red-700 rounded-lg">
          <p className="text-sm text-red-400">{dbError}</p>
          <button
            className="text-xs text-red-300 mt-1 underline"
            onClick={() => { setDbError(''); initDB().then(loadVideos); }}
          >
            重试
          </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {videos.length === 0 && !dbError && (
          <div className="text-center text-gray-500 mt-32">
            <p className="text-5xl mb-4">🎬</p>
            <p className="text-base">还没有视频</p>
            <p className="text-sm mt-2">点击右下角添加视频 URL</p>
          </div>
        )}

        {videos.map(v => {
          let analysis: any = {}
          try { analysis = JSON.parse(v.analysis_json) } catch {}

          return (
            <div
              key={v.id}
              className="bg-gray-900 rounded-xl p-4 active:bg-gray-800 transition-colors"
              onClick={() => navigate(`/play/${v.id}`)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-base truncate">{v.title}</h3>
                  <p className="text-sm text-gray-500 truncate mt-1">{v.url}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs text-green-500">✅ 已分析</span>
                    <span className="text-xs text-gray-600">
                      {analysis.characters?.length || 0} 角色
                    </span>
                    {analysis.storyline?.length > 0 && (
                      <span className="text-xs text-blue-500">
                        📖 {analysis.storyline.length} 阶段
                      </span>
                    )}
                    {analysis.theme?.mood && (
                      <span className="text-xs text-purple-500">
                        🎨 {analysis.theme.mood}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  className="text-gray-500 p-2 active:text-red-500"
                  onClick={e => { e.stopPropagation(); handleDelete(v) }}
                >
                  🗑️
                </button>
              </div>
            </div>
          )
        })}
      </div>

      <button
        className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 rounded-full flex items-center justify-center text-2xl shadow-lg active:scale-95 active:bg-blue-700 transition-transform"
        onClick={() => setShowAdd(true)}
      >
        +
      </button>

      {showAdd && (
        <div
          className="fixed inset-0 bg-black/80 flex items-end z-50"
          onClick={() => !analyzing && setShowAdd(false)}
        >
          <div className="bg-gray-900 w-full rounded-t-2xl p-4 space-y-4" onClick={e => e.stopPropagation()}>
            <h2 className="font-bold text-lg">添加视频</h2>

            <div>
              <label className="text-sm text-gray-500 block mb-2">
                视频 URL（MP4，≤128MB，≤5分钟）
              </label>
              <input
                className="w-full bg-gray-800 rounded-lg px-3 py-3 text-sm text-white placeholder-gray-600 outline-none focus:ring-2 focus:ring-blue-600"
                placeholder="https://example.com/video.mp4"
                value={urlInput}
                onChange={e => setUrlInput(e.target.value)}
                autoFocus
              />
            </div>

            <div className="flex gap-3">
              <button
                className="flex-1 py-3 bg-gray-800 rounded-lg font-medium active:bg-gray-700"
                onClick={() => setShowAdd(false)}
                disabled={analyzing}
              >
                取消
              </button>
              <button
                className="flex-1 py-3 bg-blue-600 rounded-lg font-medium active:bg-blue-700 disabled:opacity-50"
                onClick={addVideo}
                disabled={analyzing || !urlInput.trim()}
              >
                {analyzing ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    分析中...
                  </span>
                ) : '开始分析'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
