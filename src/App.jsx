import { useState, useEffect } from 'react'
import { AuthContext } from './context/AuthContext'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import Navbar from './components/Navbar'

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem('zas_token') || '')
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('zas_user') || 'null') } catch { return null }
  })
  const [showLogin, setShowLogin] = useState(false)

  const API = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/v1'

  function login(data) {
    const t = data.token || data.access_token || ''
    const u = data.user || null
    setToken(t)
    setUser(u)
    localStorage.setItem('zas_token', t)
    localStorage.setItem('zas_user', JSON.stringify(u))
    setShowLogin(false)
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

  const authHeaders = token
    ? { Authorization: `Bearer ${token}`, Accept: 'application/json', 'Content-Type': 'application/json' }
    : { Accept: 'application/json', 'Content-Type': 'application/json' }

  return (
    <AuthContext.Provider value={{ token, user, login, logout, authHeaders, API, setShowLogin }}>
      <div className="app">
        <Navbar onLoginClick={() => setShowLogin(true)} />
        {showLogin
          ? <LoginPage onClose={() => setShowLogin(false)} />
          : <HomePage />
        }
      </div>
    </AuthContext.Provider>
  )
}
