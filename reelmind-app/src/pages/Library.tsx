import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { getDB, initDB } from '../db/init'
import { generateUUID } from '../utils/uuid'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000'

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

    try {
      const res = await fetch(`${API_BASE}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoUrl: urlInput.trim() }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || '分析失败')
      }

      const data = await res.json()
      const analysis = data.analysis
      if (!analysis || typeof analysis !== 'object') throw new Error('分析结果为空')

      // 使用兼容的 UUID 生成
      const id = generateUUID()
      const title = analysis.characters?.[0]?.name
        ? `${analysis.characters[0].name}的视频`
        : '未命名视频'

      const db = await getDB()
      await db.run(
        'INSERT INTO videos (id, title, url, status, analysis_json) VALUES (?, ?, ?, ?, ?)',
        [id, title, urlInput.trim(), 'completed', JSON.stringify(analysis)]
      )

      setShowAdd(false)
      setUrlInput('')
      loadVideos()

    } catch (err: any) {
      alert('分析失败: ' + err.message)
    } finally {
      setAnalyzing(false)
    }
  }

  async function handleDelete(id: string) {
    try {
      const db = await getDB()
      await db.run('DELETE FROM videos WHERE id = ?', [id])
      await db.run('DELETE FROM chat_messages WHERE video_id = ?', [id])
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
                  onClick={e => { e.stopPropagation(); handleDelete(v.id) }}
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
