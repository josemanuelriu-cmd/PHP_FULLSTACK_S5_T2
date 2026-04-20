import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import logoImg from '../assets/logo.png'

function today() {
  return new Date().toISOString().slice(0, 10) // "YYYY-MM-DD"
}

export default function LoginPage({ onClose }) {
  const { login, API } = useAuth()
  const [tab, setTab] = useState('login')
  const [form, setForm] = useState({
    name: '', nickname: '', email: '',
    password: '', password_confirmation: '',
    age: '', telephone: '',
  })
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')
  const [success, setSuccess] = useState('')

  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  function switchTab(t) {
    setTab(t); setError(''); setSuccess('')
    setForm({ name:'', nickname:'', email:'', password:'', password_confirmation:'', age:'', telephone:'' })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(''); setSuccess(''); setLoading(true)

    // ── LOGIN ──
    if (tab === 'login') {
      try {
        const res  = await fetch(`${API}/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ email: form.email, password: form.password }),
        })
        const data = await res.json()
        if (!res.ok) {
          setError(data.errors
            ? Object.values(data.errors).flat().join(' · ')
            : (data.message || 'Error al iniciar sesión'))
          setLoading(false); return
        }
        login(data); onClose()
      } catch { setError('No se pudo conectar con el servidor') }
      setLoading(false)
      return
    }

    // ── REGISTER ──
    if (form.password !== form.password_confirmation) {
      setError('Las contraseñas no coinciden')
      setLoading(false); return
    }
    if (!form.age || isNaN(form.age) || parseInt(form.age) < 1) {
      setError('Introduce una edad válida')
      setLoading(false); return
    }

    const body = {
      name:                  form.name.trim(),
      nickname:              form.nickname.trim(),
      email:                 form.email.trim(),
      password:              form.password,
      password_confirmation: form.password_confirmation,
      age:                   parseInt(form.age),
      telephone:             form.telephone.trim() || null,
      type:                  'guest',
      language:              'es',
      registration_date:     today(),
    }

    try {
      const res  = await fetch(`${API}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.errors
          ? Object.values(data.errors).flat().join(' · ')
          : (data.message || 'Error al registrarse'))
        setLoading(false); return
      }

      setSuccess('¡Cuenta creada! Ahora inicia sesión.')
      switchTab('login')
    } catch {
      setError('No se pudo conectar con el servidor')
    }
    setLoading(false)
  }

  return (
    <div className="login-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="login-card">

        <button className="close-btn" onClick={onClose} aria-label="Cerrar">✕</button>

        <div className="login-brand">
          <img src={logoImg} alt="Logo ZasBoard" />
          <span className="login-brand-text">ZasBoard</span>
        </div>

        <h2 className="login-title">
          {tab === 'login' ? 'Bienvenido de nuevo' : 'Únete al club'}
        </h2>
        <p className="login-subtitle">
          {tab === 'login'
            ? 'Accede para ver sesiones, partidas y mucho más'
            : 'Crea tu cuenta y empieza a jugar'}
        </p>

        <div className="tab-row">
          <button
            className={`tab-btn ${tab === 'login' ? 'tab-active' : 'tab-inactive'}`}
            onClick={() => switchTab('login')}
          >Iniciar sesión</button>
          <button
            className={`tab-btn ${tab === 'register' ? 'tab-active' : 'tab-inactive'}`}
            onClick={() => switchTab('register')}
          >Registrarse</button>
        </div>

        <form onSubmit={handleSubmit} className="login-form">

          {/* ── REGISTER-ONLY FIELDS ── */}
          {tab === 'register' && (
            <>
              <div className="field">
                <label className="field-label">Nombre completo *</label>
                <input className="field-input" type="text" placeholder="María García"
                  value={form.name} onChange={e => set('name', e.target.value)} required />
              </div>

              <div className="field">
                <label className="field-label">Nickname *</label>
                <input className="field-input" type="text" placeholder="meeple_queen"
                  value={form.nickname} onChange={e => set('nickname', e.target.value)} required />
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.75rem' }}>
                <div className="field">
                  <label className="field-label">Edad *</label>
                  <input className="field-input" type="number" min="1" max="120" placeholder="25"
                    value={form.age} onChange={e => set('age', e.target.value)} required />
                </div>
                <div className="field">
                  <label className="field-label">Teléfono</label>
                  <input className="field-input" type="tel" placeholder="+34 600 000 000"
                    value={form.telephone} onChange={e => set('telephone', e.target.value)} />
                </div>
              </div>
            </>
          )}

          {/* ── SHARED FIELDS ── */}
          <div className="field">
            <label className="field-label">Email *</label>
            <input className="field-input" type="email" placeholder="tu@email.com"
              value={form.email} onChange={e => set('email', e.target.value)} required />
          </div>

          <div className="field">
            <label className="field-label">Contraseña *</label>
            <input className="field-input" type="password"
              placeholder={tab === 'register' ? 'Mínimo 8 caracteres' : '••••••••'}
              value={form.password} onChange={e => set('password', e.target.value)}
              required autoComplete={tab === 'login' ? 'current-password' : 'new-password'} />
          </div>

          {tab === 'register' && (
            <>
              <div className="field">
                <label className="field-label">Confirmar contraseña *</label>
                <input className="field-input" type="password" placeholder="Repite la contraseña"
                  value={form.password_confirmation}
                  onChange={e => set('password_confirmation', e.target.value)}
                  required autoComplete="new-password" />
              </div>

              <p style={{ fontSize:'0.72rem', color:'var(--text-dim)', lineHeight:1.5 }}>
                Tu cuenta se creará como <strong style={{color:'var(--text-muted)'}}>invitado</strong>.
                Un administrador podrá asignarte el tipo de socio correspondiente.
              </p>
            </>
          )}

          {error   && <p className="msg msg-error">{error}</p>}
          {success && <p className="msg msg-success">{success}</p>}

          <button type="submit" className="btn btn-primary btn-full"
            disabled={loading} style={{ marginTop:'0.25rem' }}>
            {loading && <span className="spinner-inline" />}
            {loading ? 'Procesando...' : tab === 'login' ? 'Entrar al club' : 'Crear cuenta'}
          </button>

        </form>
      </div>
    </div>
  )
}
