const DEFAULT_API_BASE_URL = 'http://localhost:3000'

function stripTrailingSlash(value: string): string {
  return value.replace(/\/+$/, '')
}

export const API_BASE_URL = stripTrailingSlash(
  import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL
)

export const API_HEADERS = {
  'ngrok-skip-browser-warning': '1',
}

export function apiUrl(path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${API_BASE_URL}${normalizedPath}`
}

export function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

export async function readErrorMessage(response: Response, fallback: string): Promise<string> {
  const data = await response.json().catch(() => null)
  if (data && typeof data.error === 'string') return data.error
  if (data && typeof data.message === 'string') return data.message
  return fallback
}
