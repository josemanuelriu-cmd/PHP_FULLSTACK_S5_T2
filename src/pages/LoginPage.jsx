import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

export default function LoginPage({ onClose }) {
  const { login, API } = useAuth()
  const [tab, setTab] = useState('login')
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(''); setSuccess(''); setLoading(true)
    const endpoint = tab === 'login' ? `${API}/login` : `${API}/register`
    const body = tab === 'login'
      ? { email: form.email, password: form.password }
      : { name: form.name, email: form.email, password: form.password }

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(body)
      })
      const data = await res.json()
      if (!res.ok) { setError(data.message || 'Error al procesar la solicitud'); setLoading(false); return }
      if (tab === 'register') {
        setSuccess('¡Cuenta creada! Ahora inicia sesión.')
        setTab('login')
        setForm(f => ({ ...f, password: '' }))
        setLoading(false)
        return
      }
      login(data)
    } catch {
      setError('No se pudo conectar con el servidor')
    }
    setLoading(false)
  }

  return (
    <div className="login-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="login-card">

        <button className="close-btn" onClick={onClose} aria-label="Cerrar">✕</button>

        <div className="login-brand">⬡</div>
        <h2 className="login-title">
          {tab === 'login' ? 'Bienvenido de nuevo' : 'Únete al club'}
        </h2>
        <p className="login-subtitle">
          {tab === 'login'
            ? 'Accede para ver sesiones, partidas y más'
            : 'Crea tu cuenta y empieza a jugar'}
        </p>

        <div className="tab-row">
          <button
            className={`tab-btn ${tab === 'login' ? 'tab-active' : 'tab-inactive'}`}
            onClick={() => setTab('login')}
          >Iniciar sesión</button>
          <button
            className={`tab-btn ${tab === 'register' ? 'tab-active' : 'tab-inactive'}`}
            onClick={() => setTab('register')}
          >Registrarse</button>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {tab === 'register' && (
            <div className="field">
              <label className="field-label">Nombre completo</label>
              <input
                className="field-input"
                type="text"
                placeholder="María García"
                value={form.name}
                onChange={e => set('name', e.target.value)}
                required
              />
            </div>
          )}
          <div className="field">
            <label className="field-label">Email</label>
            <input
              className="field-input"
              type="email"
              placeholder="tu@email.com"
              value={form.email}
              onChange={e => set('email', e.target.value)}
              required
            />
          </div>
          <div className="field">
            <label className="field-label">Contraseña</label>
            <input
              className="field-input"
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={e => set('password', e.target.value)}
              required
            />
          </div>

          {error && <p className="msg msg-error">{error}</p>}
          {success && <p className="msg msg-success">{success}</p>}

          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading ? <span className="spinner-inline" /> : null}
            {loading ? 'Procesando...' : tab === 'login' ? 'Entrar al club' : 'Crear cuenta'}
          </button>
        </form>

      </div>
    </div>
  )
}
