const API_URL = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000/api'

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

  if (!response.ok) {
    const body = await response.json().catch(() => ({ message: 'Error inesperado' }))
    throw new Error(body.message ?? 'Error de API')
  }

  return response.json()
}
