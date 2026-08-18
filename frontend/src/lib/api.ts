export const API_URL = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8001/api'

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('pos_token')
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  })
  const text = await response.text()
  const body = text
    ? (() => {
        try {
          return JSON.parse(text)
        } catch {
          return { message: text }
        }
      })()
    : null

  if (!response.ok) {
    const details = body?.errors && typeof body.errors === 'object'
      ? Object.values(body.errors).flat().join(' ')
      : ''
    throw new Error(details || body?.message || 'Error de API')
  }

  return body as T
}
