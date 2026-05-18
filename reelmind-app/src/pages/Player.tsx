import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Capacitor } from '@capacitor/core'
import { ScreenOrientation } from '@capacitor/screen-orientation'
import { StatusBar } from '@capacitor/status-bar'
import { getDB } from '../db/init'
import { parseAnalysis, type VideoAnalysis } from '../types/analysis'
import { useVideoTheme } from '../hooks/useVideoTheme'
import StorylinePanel from '../components/StorylinePanel'
import { API_HEADERS, apiUrl, readErrorMessage } from '../config/api'

function resolveVideoUrl(raw: string): string {
  if (!raw) return ''
  const trimmed = raw.trim()
  if (trimmed.startsWith('file://')) {
    return Capacitor.convertFileSrc(trimmed)
  }
  return trimmed
}

function releaseVideoElement(video: HTMLVideoElement | null) {
  if (!video) return
  video.pause()
  video.removeAttribute('src')
  video.querySelector('source')?.removeAttribute('src')
  video.load()
}

type TabKey = 'chat' | 'storyline'

export default function Player() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const videoRef = useRef<HTMLVideoElement>(null)

  const [video, setVideo] = useState<any>(null)
  const [analysis, setAnalysis] = useState<VideoAnalysis | null>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [input, setInput] = useState('')
  const [showPanel, setShowPanel] = useState(false)
  const [activeTab, setActiveTab] = useState<TabKey>('chat')
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [videoError, setVideoError] = useState<string>('')
  const [videoReady, setVideoReady] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const controlsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // 点击视频区域：切换播放/暂停，并显示控制按钮
  function handleVideoTap() {
    const v = videoRef.current
    if (!v || !videoReady) return
    if (v.paused) {
      v.play().catch(() => {})
    } else {
      v.pause()
    }
    showControlsTemporarily()
  }

  // 显示控制按钮，3 秒后自动隐藏
  function showControlsTemporarily() {
    setShowControls(true)
    if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current)
    controlsTimerRef.current = setTimeout(() => {
      setShowControls(false)
    }, 3000)
  }

  // 监听播放/暂停事件
  useEffect(() => {
    const v = videoRef.current
    if (!v) return
    const onPlay = () => setIsPlaying(true)
    const onPause = () => setIsPlaying(false)
    v.addEventListener('play', onPlay)
    v.addEventListener('pause', onPause)
    return () => {
      v.removeEventListener('play', onPlay)
      v.removeEventListener('pause', onPause)
    }
  }, [video?.url])

  // 注入/重置视频主题 CSS 变量
  useVideoTheme(analysis?.theme ?? null)

  const loadData = useCallback(async () => {
    if (!id) return
    try {
      const db = await getDB()
      const res = await db.query('SELECT * FROM videos WHERE id = ?', [id])
      if (res.values?.[0]) {
        const v = res.values[0]
        setVideo(v)
        setAnalysis(parseAnalysis(v.analysis_json))
        const msgRes = await db.query('SELECT * FROM chat_messages WHERE video_id = ? ORDER BY created_at', [id])
        setMessages(msgRes.values || [])
        setLoadError('')
      } else {
        setLoadError('视频不存在或已被删除')
      }
    } catch (err: any) {
      console.error('[Player] Load error:', err)
      setLoadError('视频加载失败: ' + err.message)
    }
  }, [id])

  useEffect(() => {
    loadData()
    lockLandscape()
    hideStatusBar()
    return () => {
      if (controlsTimerRef.current) {
        clearTimeout(controlsTimerRef.current)
        controlsTimerRef.current = null
      }
      ScreenOrientation.unlock().catch(() => {})
      showStatusBar()
      releaseVideoElement(videoRef.current)
    }
  }, [loadData])

  async function hideStatusBar() {
    try {
      await StatusBar.hide()
    } catch (err) {
      console.log('Hide status bar failed:', err)
    }
  }

  async function showStatusBar() {
    try {
      await StatusBar.show()
    } catch (err) {
      console.log('Show status bar failed:', err)
    }
  }

  // 当 video.url 变化时，加载视频但不自动播放
  useEffect(() => {
    if (!video?.url || !videoRef.current) return
    setVideoError('')
    setVideoReady(false)
    setShowControls(true)
    videoRef.current.load()
  }, [video?.url])

  async function lockLandscape() {
    try {
      await ScreenOrientation.lock({ orientation: 'landscape' })
    } catch (err) {
      console.log('Landscape lock failed:', err)
    }
  }

  function buildContext(): string {
    if (!analysis) return ''
    const chars = analysis.characters?.map(c => `${c.name}(${c.description})`).join('、') || ''
    let ctx = `视频分析：${analysis.plotSummary || ''}。角色：${chars}。`

    if (analysis.storyline && analysis.storyline.length > 0) {
      const sl = analysis.storyline
        .map(s => `【${s.phase}】${s.summary}（情绪：${s.mood}；关键节点：${s.highlights.join('、')}）`)
        .join('\n')
      ctx += `\n故事发展线：\n${sl}`
    }

    return ctx
  }

  async function sendMessage() {
    if (!input.trim() || !analysis || !id) return

    const userContent = input.trim()
    setInput('')
    setLoading(true)

    const userMsg = { role: 'user', content: userContent }
    setMessages(prev => [...prev, userMsg])

    try {
      const db = await getDB()
      await db.run('INSERT INTO chat_messages (video_id, role, content) VALUES (?, ?, ?)',
        [id, 'user', userContent])
    } catch (err) {
      console.error('Save user msg failed:', err)
    }

    try {
      const context = buildContext()

      const res = await fetch(apiUrl('/chat'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...API_HEADERS,
        },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: `你是一位资深影视解读助手。用户正在观看一个视频，以下是该视频的分析信息，请基于这些信息准确、简洁地回答用户的问题：\n\n${context}` },
            { role: 'user', content: userContent },
          ],
          temperature: 0.7,
          max_tokens: 2048,
        }),
      })

      if (!res.ok) {
        throw new Error(await readErrorMessage(res, `问答失败 (${res.status})`))
      }

      const data = await res.json()
      const aiContent = data.choices?.[0]?.message?.content
      if (typeof aiContent !== 'string' || !aiContent.trim()) {
        throw new Error('AI 返回内容为空')
      }

      const aiMsg = { role: 'assistant', content: aiContent.trim() }
      setMessages(prev => [...prev, aiMsg])

      try {
        const db = await getDB()
        await db.run('INSERT INTO chat_messages (video_id, role, content) VALUES (?, ?, ?)',
          [id, 'assistant', aiContent.trim()])
      } catch (err) {
        console.error('Save AI msg failed:', err)
      }

    } catch (err: any) {
      const errMsg = { role: 'assistant', content: err?.message || '网络错误，请重试。' }
      setMessages(prev => [...prev, errMsg])
    } finally {
      setLoading(false)
    }
  }

  if (!video) {
    return (
      <div className="bg-black h-screen flex items-center justify-center">
        {loadError ? (
          <div className="text-center px-6">
            <p className="text-sm text-red-400">{loadError}</p>
            <button
              className="mt-4 px-4 py-2 rounded-lg bg-gray-800 text-sm text-white active:bg-gray-700"
              onClick={() => navigate('/')}
            >
              返回视频库
            </button>
          </div>
        ) : (
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        )}
      </div>
    )
  }

  return (
    <div className="relative w-screen h-screen bg-black overflow-hidden">
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-contain"
        playsInline
        preload="metadata"
        onClick={handleVideoTap}
        onError={(e) => {
          const mediaError = (e.target as HTMLVideoElement).error
          let msg = '未知错误'
          if (mediaError) {
            switch (mediaError.code) {
              case 1: msg = '视频加载被中断'; break
              case 2: msg = '网络错误，无法下载视频'; break
              case 3: msg = '视频解码失败，格式不支持'; break
              case 4: msg = '视频地址无效或无法访问'; break
            }
          }
          console.error('[Video] Playback error code:', mediaError?.code, 'message:', msg)
          setVideoError(msg)
          setVideoReady(false)
        }}
        onCanPlay={() => {
          console.log('[Video] Can play, ready')
          setVideoReady(true)
          setVideoError('')
          // 首次进入自动播放，返回后不恢复播放
          if (videoRef.current) {
            videoRef.current.play().catch(() => {})
          }
        }}
      >
        <source src={resolveVideoUrl(video.url)} type="video/mp4" />
        <p className="text-white text-center mt-20 text-sm">
          您的浏览器不支持视频播放
        </p>
      </video>

      {!!video.url && !videoReady && !videoError && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/80">
          <div className="w-10 h-10 border-4 border-white/20 border-t-white rounded-full animate-spin" />
          <p className="mt-3 text-sm text-white/70">视频加载中...</p>
        </div>
      )}

      {videoError && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/80">
          <p className="text-4xl mb-3">⚠️</p>
          <p className="text-sm text-red-400 px-6 text-center">{videoError}</p>
          <p className="text-xs text-gray-500 mt-2 px-6 text-center max-w-[80%] break-all">
            {video.url}
          </p>
          <button
            className="mt-4 px-4 py-2 rounded-lg text-sm text-white active:opacity-80"
            style={{ backgroundColor: 'var(--theme-primary, #2563EB)' }}
            onClick={() => {
              setVideoError('')
              if (videoRef.current) {
                videoRef.current.load()
              }
            }}
          >
            重试
          </button>
        </div>
      )}

      {/* 自定义播放控制层（永不触发系统全屏） */}
      {videoReady && showControls && !videoError && (
        <div
          className="absolute inset-0 z-20 flex items-center justify-center"
          onClick={handleVideoTap}
        >
          {/* 播放/暂停大按钮 */}
          <button
            className="w-20 h-20 rounded-full flex items-center justify-center text-4xl text-white/90 bg-black/40 backdrop-blur active:scale-90 transition-transform"
            onClick={(e) => {
              e.stopPropagation()
              handleVideoTap()
            }}
          >
            {isPlaying ? '⏸' : '▶'}
          </button>
        </div>
      )}

      <button
        className="absolute top-4 left-4 z-30 text-white bg-black/50 backdrop-blur px-3 py-2 rounded-lg text-sm flex items-center gap-1 active:bg-black/70"
        onClick={() => navigate('/')}
      >
        ← 返回
      </button>

      {analysis && (
        <div className="absolute top-4 right-4 z-30 rounded-lg px-3 py-2 text-xs text-white max-w-[180px]"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)' }}>
          <p className="font-medium truncate">{video.title}</p>
          <p className="mt-0.5" style={{ color: 'var(--theme-textMuted, #9CA3AF)' }}>
            {analysis.characters?.length || 0} 角色
            {analysis.theme?.mood ? ` · ${analysis.theme.mood}` : ''}
          </p>
        </div>
      )}

      <button
        className="absolute bottom-8 right-4 z-30 w-12 h-12 rounded-full flex items-center justify-center text-xl shadow-lg active:scale-95 transition-transform"
        style={{
          backgroundColor: 'var(--theme-primary, #2563EB)',
          boxShadow: `0 10px 25px -5px ${analysis?.theme?.primary || '#2563EB'}4D`,
        }}
        onClick={() => setShowPanel(true)}
      >
        🤖
      </button>

      {showPanel && (
        <>
          <div
            className="absolute inset-0 bg-black/40 z-20"
            onClick={() => setShowPanel(false)}
          />

          <div
            className="absolute inset-y-0 right-0 w-[340px] max-w-[80vw] flex flex-col z-30 shadow-2xl"
            style={{
              backgroundColor: 'var(--theme-surface, #111827)',
              backdropFilter: 'blur(16px)',
            }}
          >
            {/* 头部 */}
            <div className="px-4 py-3 border-b flex items-center justify-between"
              style={{ borderColor: 'var(--theme-secondary, #1F2937)' }}>
              <div>
                <h3 className="font-medium text-sm" style={{ color: 'var(--theme-text, #F3F4F6)' }}>
                  AI 助手
                </h3>
                <p className="text-xs" style={{ color: 'var(--theme-textMuted, #9CA3AF)' }}>
                  {analysis?.characters?.length || 0} 个角色已识别
                  {analysis?.theme?.mood ? ` · ${analysis.theme.mood}` : ''}
                </p>
              </div>
              <button
                className="p-1 active:opacity-70"
                style={{ color: 'var(--theme-textMuted, #9CA3AF)' }}
                onClick={() => setShowPanel(false)}
              >
                ✕
              </button>
            </div>

            {/* Tab 切换 */}
            <div className="flex border-b"
              style={{ borderColor: 'var(--theme-secondary, #1F2937)' }}>
              <button
                className="flex-1 py-2.5 text-xs font-medium text-center transition-colors"
                style={{
                  color: activeTab === 'chat' ? 'var(--theme-text, #F3F4F6)' : 'var(--theme-textMuted, #9CA3AF)',
                  borderBottom: activeTab === 'chat' ? `2px solid var(--theme-primary, #2563EB)` : '2px solid transparent',
                }}
                onClick={() => setActiveTab('chat')}
              >
                AI 问答
              </button>
              <button
                className="flex-1 py-2.5 text-xs font-medium text-center transition-colors"
                style={{
                  color: activeTab === 'storyline' ? 'var(--theme-text, #F3F4F6)' : 'var(--theme-textMuted, #9CA3AF)',
                  borderBottom: activeTab === 'storyline' ? `2px solid var(--theme-primary, #2563EB)` : '2px solid transparent',
                }}
                onClick={() => setActiveTab('storyline')}
              >
                故事线
              </button>
            </div>

            {/* 内容区 */}
            {activeTab === 'storyline' ? (
              <StorylinePanel storyline={analysis?.storyline} />
            ) : (
              <>
                {/* 快速提问标签 */}
                {analysis?.characters && analysis.characters.length > 0 && (
                  <div className="px-4 py-2 border-b"
                    style={{ borderColor: 'var(--theme-secondary, #1F2937)' }}>
                    <p className="text-xs mb-2" style={{ color: 'var(--theme-textMuted, #9CA3AF)' }}>
                      快速提问：
                    </p>
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {analysis.characters.map(c => (
                        <button
                          key={c.name}
                          className="px-3 py-1.5 rounded-full text-xs whitespace-nowrap active:opacity-80 transition-opacity"
                          style={{
                            backgroundColor: 'var(--theme-tagBg, #374151)',
                            color: 'var(--theme-tagText, #D1D5DB)',
                          }}
                          onClick={() => setInput(`介绍一下${c.name}`)}
                        >
                          {c.name}
                        </button>
                      ))}
                      <button
                        className="px-3 py-1.5 rounded-full text-xs whitespace-nowrap active:opacity-80 transition-opacity"
                        style={{
                          backgroundColor: 'var(--theme-tagBg, #374151)',
                          color: 'var(--theme-tagText, #D1D5DB)',
                        }}
                        onClick={() => setInput('剧情是什么？')}
                      >
                        剧情
                      </button>
                    </div>
                  </div>
                )}

                {/* 消息列表 */}
                <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
                  {messages.length === 0 && (
                    <div className="text-center mt-8">
                      <p className="text-3xl mb-2">🤖</p>
                      <p className="text-sm" style={{ color: 'var(--theme-text, #F3F4F6)' }}>
                        问我关于视频的问题
                      </p>
                      <p className="text-xs mt-1" style={{ color: 'var(--theme-textMuted, #9CA3AF)' }}>
                        例如：剧情是什么？谁是谁？
                      </p>
                    </div>
                  )}

                  {messages.map((m, i) => (
                    <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className="max-w-[90%] rounded-2xl px-3 py-2 text-sm leading-relaxed"
                        style={{
                          backgroundColor: m.role === 'user'
                            ? 'var(--theme-bubbleUser, #2563EB)'
                            : 'var(--theme-bubbleAi, #374151)',
                          color: 'var(--theme-text, #F3F4F6)',
                          borderRadius: m.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                        }}
                      >
                        {m.content}
                      </div>
                    </div>
                  ))}

                  {loading && (
                    <div className="flex justify-start">
                      <div
                        className="rounded-2xl px-3 py-2"
                        style={{
                          backgroundColor: 'var(--theme-bubbleAi, #374151)',
                          borderRadius: '16px 16px 16px 4px',
                        }}
                      >
                        <div className="flex gap-1">
                          <span className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: 'var(--theme-textMuted, #9CA3AF)', animationDelay: '0ms' }} />
                          <span className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: 'var(--theme-textMuted, #9CA3AF)', animationDelay: '150ms' }} />
                          <span className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: 'var(--theme-textMuted, #9CA3AF)', animationDelay: '300ms' }} />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 输入区 */}
                <div className="px-4 py-3 border-t flex gap-2"
                  style={{ borderColor: 'var(--theme-secondary, #1F2937)' }}>
                  <input
                    className="flex-1 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2"
                    style={{
                      backgroundColor: 'var(--theme-secondary, #1F2937)',
                      color: 'var(--theme-text, #F3F4F6)',
                      caretColor: 'var(--theme-primary, #2563EB)',
                    }}
                    placeholder="问剧情..."
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && sendMessage()}
                  />
                  <button
                    className="px-4 rounded-xl text-sm font-medium active:opacity-80 disabled:opacity-40 transition-opacity"
                    style={{ backgroundColor: 'var(--theme-primary, #2563EB)', color: '#fff' }}
                    onClick={sendMessage}
                    disabled={loading || !input.trim()}
                  >
                    发送
                  </button>
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  )
}
