const TOKEN_KEY = 'wuwa-echo-check:auth-token'
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY)
}

/** provider 예: 'google'. 백엔드의 스프링 시큐리티 OAuth2 로그인 시작 지점으로 이동합니다. */
export function loginUrl(provider) {
  return `${API_BASE}/oauth2/authorization/${provider}`
}

async function apiFetch(path, options = {}) {
  const token = getToken()
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  })
  if (!res.ok) {
    if (res.status === 401) clearToken()
    throw new Error(`요청에 실패했어요 (${res.status})`)
  }
  return res.json()
}

export function fetchMe() {
  return apiFetch('/api/me')
}

export function fetchCloudState() {
  return apiFetch('/api/state')
}

export function saveCloudState(dataJson) {
  return apiFetch('/api/state', { method: 'PUT', body: JSON.stringify({ data: dataJson }) })
}
