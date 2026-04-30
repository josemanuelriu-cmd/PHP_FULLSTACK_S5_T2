import { createContext, useContext, useState } from 'react'

const AuthContext = createContext(null)

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }) {
  const API = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'

  const [token, setToken] = useState(() => localStorage.getItem('zas_token') || '')
  const [user, setUser]   = useState(() => {
    try { return JSON.parse(localStorage.getItem('zas_user') || 'null') } catch { return null }
  })

  const authHeaders = token
    ? { Authorization: `Bearer ${token}`, Accept: 'application/json', 'Content-Type': 'application/json' }
    : { Accept: 'application/json', 'Content-Type': 'application/json' }

  function login(data) {
    const t = data.token || data.access_token || ''
    const u = data.user || null
    setToken(t)
    setUser(u)
    localStorage.setItem('zas_token', t)
    localStorage.setItem('zas_user', JSON.stringify(u))
  }

  async function logout() {
    if (token) {
      await fetch(`${API}/logout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' }
      }).catch(() => {})
    }
    setToken('')
    setUser(null)
    localStorage.removeItem('zas_token')
    localStorage.removeItem('zas_user')
  }

  return (
    <AuthContext.Provider value={{ token, user, login, logout, authHeaders, API }}>
      {children}
    </AuthContext.Provider>
  )
}
