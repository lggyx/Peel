export interface Character {
  name: string
  description: string
}

export interface TimelineEntry {
  time: string
  event: string
}

export interface Relationship {
  from: string
  to: string
  relation: string
}

export interface StorylineEntry {
  phase: string
  summary: string
  highlights: string[]
  mood: string
}

export interface ThemeVariables {
  /** 主色调 */
  primary: string
  /** 辅色调 */
  secondary: string
  /** 强调色 */
  accent: string
  /** 面板背景色 */
  surface: string
  /** 主文字色 */
  text: string
  /** 次要文字色 */
  textMuted: string
  /** 用户聊天气泡背景 */
  bubbleUser: string
  /** AI 聊天气泡背景 */
  bubbleAi: string
  /** 标签背景色 */
  tagBg: string
  /** 标签文字色 */
  tagText: string
  /** 主题氛围词 */
  mood: string
}

export interface VideoAnalysis {
  characters: Character[]
  plotSummary: string
  timeline: TimelineEntry[]
  relationships: Relationship[]
  /** 故事发展线 */
  storyline?: StorylineEntry[]
  /** AI 生成的主题变量 */
  theme?: ThemeVariables
}

/** 合法 6 位 hex 颜色正则 */
const HEX_RE = /^#[0-9A-Fa-f]{6}$/

/** 默认主题（蓝灰色调，与现有 UI 保持一致） */
export function defaultTheme(): ThemeVariables {
  return {
    primary: '#2563EB',
    secondary: '#1F2937',
    accent: '#3B82F6',
    surface: '#111827',
    text: '#F3F4F6',
    textMuted: '#9CA3AF',
    bubbleUser: '#2563EB',
    bubbleAi: '#374151',
    tagBg: '#374151',
    tagText: '#D1D5DB',
    mood: '默认',
  }
}

/** 校验并修复 theme，缺失或非法的值用默认值补齐 */
export function normalizeTheme(raw: Partial<ThemeVariables> | undefined): ThemeVariables {
  const d = defaultTheme()
  if (!raw || typeof raw !== 'object') return d

  const pick = <K extends keyof ThemeVariables>(k: K): ThemeVariables[K] => {
    const v = raw[k]
    if (k === 'mood') {
      return typeof v === 'string' && v.trim() ? v.trim() : d[k]
    }
    return typeof v === 'string' && HEX_RE.test(v.trim()) ? v.trim() : d[k]
  }

  return {
    primary: pick('primary'),
    secondary: pick('secondary'),
    accent: pick('accent'),
    surface: pick('surface'),
    text: pick('text'),
    textMuted: pick('textMuted'),
    bubbleUser: pick('bubbleUser'),
    bubbleAi: pick('bubbleAi'),
    tagBg: pick('tagBg'),
    tagText: pick('tagText'),
    mood: pick('mood'),
  }
}

/** 安全解析后端返回的 analysis JSON */
export function parseAnalysis(raw: string | null | undefined): VideoAnalysis | null {
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return null

    const analysis: VideoAnalysis = {
      characters: Array.isArray(parsed.characters) ? parsed.characters : [],
      plotSummary: typeof parsed.plotSummary === 'string' ? parsed.plotSummary : '',
      timeline: Array.isArray(parsed.timeline) ? parsed.timeline : [],
      relationships: Array.isArray(parsed.relationships) ? parsed.relationships : [],
      storyline: Array.isArray(parsed.storyline)
        ? parsed.storyline.filter(
            (s: any) =>
              s &&
              typeof s.phase === 'string' &&
              typeof s.summary === 'string' &&
              Array.isArray(s.highlights) &&
              typeof s.mood === 'string'
          )
        : undefined,
      theme: parsed.theme ? normalizeTheme(parsed.theme) : undefined,
    }

    return analysis
  } catch {
    return null
  }
}
