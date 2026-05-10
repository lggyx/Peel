import { useEffect } from 'react'
import { ThemeVariables, normalizeTheme, defaultTheme } from '../types/analysis'

const CSS_VARS: (keyof ThemeVariables)[] = [
  'primary',
  'secondary',
  'accent',
  'surface',
  'text',
  'textMuted',
  'bubbleUser',
  'bubbleAi',
  'tagBg',
  'tagText',
  'mood',
]

function setVars(theme: ThemeVariables) {
  const root = document.documentElement
  CSS_VARS.forEach((k) => {
    root.style.setProperty(`--theme-${k}`, theme[k])
  })
}

function clearVars() {
  const root = document.documentElement
  CSS_VARS.forEach((k) => {
    root.style.removeProperty(`--theme-${k}`)
  })
}

/**
 * 根据视频分析数据注入/重置 CSS 主题变量。
 * @param theme - AI 生成的主题变量；null/undefined 时使用默认主题
 */
export function useVideoTheme(theme: ThemeVariables | undefined | null) {
  useEffect(() => {
    const normalized = theme ? normalizeTheme(theme) : defaultTheme()
    setVars(normalized)
    return () => {
      clearVars()
    }
  }, [theme])
}
