const DEFAULT_API_BASE_URL = 'http://localhost:3000'
const ANDROID_EMULATOR_API_BASE_URL = 'http://10.0.2.2:3000'

function stripTrailingSlash(value: string): string {
  return value.replace(/\/+$/, '')
}

export const API_BASE_URL = stripTrailingSlash(
  import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL
)

const API_FALLBACK_BASE_URLS = [
  import.meta.env.VITE_API_FALLBACK_BASE_URL,
  ANDROID_EMULATOR_API_BASE_URL,
]
  .filter((value): value is string => Boolean(value))
  .map(stripTrailingSlash)
  .filter((value, index, values) => value !== API_BASE_URL && values.indexOf(value) === index)

export const API_HEADERS: Record<string, string> = {}

export function apiUrl(path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${API_BASE_URL}${normalizedPath}`
}

function apiUrlForBase(baseUrl: string, path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${baseUrl}${normalizedPath}`
}

export async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  const candidates = [API_BASE_URL, ...API_FALLBACK_BASE_URLS]
  let lastError: unknown = null

  for (const baseUrl of candidates) {
    try {
      return await fetch(apiUrlForBase(baseUrl, path), init)
    } catch (err) {
      lastError = err
      console.warn(`[API] Request failed for ${baseUrl}, trying next candidate`, err)
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Network request failed')
}

function hasProtocol(value: string): boolean {
  return /^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(value)
}

export function normalizeHttpUrl(value: string): string | null {
  const trimmed = value.trim()
  if (!trimmed) return null

  const candidate = hasProtocol(trimmed) ? trimmed : `https://${trimmed}`
  try {
    const url = new URL(candidate)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null
    return url.toString()
  } catch {
    return null
  }
}

export function isHttpUrl(value: string): boolean {
  return normalizeHttpUrl(value) !== null
}

function extractErrorText(value: unknown): string | null {
  if (typeof value === 'string' && value.trim()) return value.trim()
  if (!value || typeof value !== 'object') return null

  const record = value as Record<string, unknown>
  return (
    extractErrorText(record.message) ||
    extractErrorText(record.error) ||
    extractErrorText(record.detail) ||
    extractErrorText(record.details)
  )
}

export async function readErrorMessage(response: Response, fallback: string): Promise<string> {
  const data = await response.json().catch(() => null)
  if (!data || typeof data !== 'object') return fallback

  const record = data as Record<string, unknown>
  const primary = extractErrorText(record.error) || extractErrorText(record.message)
  const detail = extractErrorText(record.details)

  if (primary && detail && primary !== detail) return `${primary}: ${detail}`
  if (primary) return primary
  if (detail) return detail
  return fallback
}

export function formatRequestError(err: unknown): string {
  const message = err instanceof Error
    ? err.message
    : typeof err === 'string'
      ? err
      : '网络错误，请重试。'

  if (/failed to fetch|networkerror|load failed/i.test(message)) {
    const candidates = [API_BASE_URL, ...API_FALLBACK_BASE_URLS].join(' 或 ')
    return `无法连接后端 ${candidates}。请确认 reelmind-proxy 已启动，并且模拟器/手机能访问这台电脑。`
  }

  return message
}
