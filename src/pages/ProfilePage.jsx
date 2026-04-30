import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { createApi } from '../services/api'

// Users table fields:
// id, num_partner, nickname, name, password, type (admin|junta|partner|guest),
// registration_date, withdrawal_date, email, telephone, age, language

const USER_TYPES = ['admin', 'junta', 'partner', 'guest']
const TYPE_LABELS = { admin: 'Admin', junta: 'Junta', partner: 'Socio', guest: 'Invitado' }

const EMPTY_FORM = {
  name: '', nickname: '', email: '', telephone: '',
  age: '', type: '', num_partner: '',
  password: '', password_confirmation: '',
}

export default function ProfilePage() {
  const { authHeaders, API, user: authUser, login } = useAuth()
  const api = createApi(API, authHeaders)

  const isAdmin = authUser?.type === 'admin'

  // List of all users (admin only)
  const [allUsers,       setAllUsers]       = useState([])
  const [selectedUserId, setSelectedUserId] = useState(authUser?.id || '')

  // Form state
  const [form,        setForm]        = useState(EMPTY_FORM)
  const [loading,     setLoading]     = useState(true)
  const [saving,      setSaving]      = useState(false)
  const [error,       setError]       = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [success,     setSuccess]     = useState('')

  // Load all users for admin selector
  useEffect(() => {
    if (!isAdmin) return
    async function loadUsers() {
      try {
        setAllUsers(await api.users.list())
      } catch {}
    }
    loadUsers()
  }, [isAdmin])

  // Load selected user data into form
  useEffect(() => {
    async function loadUser() {
      if (!selectedUserId) return
      setLoading(true); setError(''); setSuccess(''); setFieldErrors({})
      try {
        const raw = await api.users.get(selectedUserId)
        const u   = raw.data || raw
        setForm({
          name:                  u.name        || '',
          nickname:              u.nickname    || '',
          email:                 u.email       || '',
          telephone:             u.telephone   || '',
          age:                   u.age         ?? '',
          type:                  u.type        || '',
          num_partner:           u.num_partner ?? '',
          password:              '',
          password_confirmation: '',
        })
      } catch (e) {
        setError(e.message)
      }
      setLoading(false)
    }
    loadUser()
  }, [selectedUserId])

  // On mount, load own profile
  useEffect(() => {
    if (authUser?.id) setSelectedUserId(authUser.id)
  }, [authUser?.id])

  function set(k, v) {
    setForm(f => ({ ...f, [k]: v }))
    setFieldErrors(fe => ({ ...fe, [k]: '' }))
    setSuccess('')
  }

  function validate() {
    const errs = {}
    if (!form.name.trim())     errs.name     = 'El nombre es obligatorio'
    if (!form.nickname.trim()) errs.nickname = 'El nickname es obligatorio'
    if (!form.email.trim())    errs.email    = 'El email es obligatorio'
    if (form.age && (isNaN(form.age) || form.age < 0 || form.age > 120))
      errs.age = 'Edad no válida'
    if (form.password && form.password !== form.password_confirmation)
      errs.password_confirmation = 'Las contraseñas no coinciden'
    if (form.password && form.password.length < 8)
      errs.password = 'La contraseña debe tener al menos 8 caracteres'
    return errs
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(''); setSuccess(''); setFieldErrors({})

    const errs = validate()
    if (Object.keys(errs).length) { setFieldErrors(errs); return }

    setSaving(true)

    const payload = {
      name:      form.name.trim(),
      nickname:  form.nickname.trim(),
      email:     form.email.trim(),
      telephone: form.telephone.trim() || null,
      age:       form.age !== '' ? parseInt(form.age) : null,
    }
    // Only admin can change type and num_partner
    if (isAdmin) {
      // Ensure type is a clean string matching the DB enum exactly
      const cleanType = (form.type || '').trim()
      if (cleanType) payload.type = cleanType
      payload.num_partner = form.num_partner !== '' ? parseInt(form.num_partner) : null
    }
    // Only send password if filled in
    if (form.password) {
      payload.password              = form.password
      payload.password_confirmation = form.password_confirmation
    }

    try {
      const data = await api.users.update(selectedUserId, payload)

      setSuccess('Perfil actualizado correctamente')
      if (String(selectedUserId) === String(authUser?.id)) {
        const updated = data.data || data.user || data
        if (updated?.id) {
          const stored = JSON.parse(localStorage.getItem('zas_user') || '{}')
          const merged = { ...stored, ...updated }
          localStorage.setItem('zas_user', JSON.stringify(merged))
          login({ token: localStorage.getItem('zas_token'), user: merged })
        }
      }
      setForm(f => ({ ...f, password: '', password_confirmation: '' }))
    } catch (e) {
      if (e.data?.errors) {
        const fe = {}
        Object.entries(e.data.errors).forEach(([k, v]) => { fe[k] = Array.isArray(v) ? v[0] : v })
        setFieldErrors(fe)
      } else {
        setError(e.message)
      }
    }
    setSaving(false)
  }

  const displayUser = selectedUserId
    ? (allUsers.find(u => String(u.id) === String(selectedUserId)) || authUser)
    : authUser

  const isOwnProfile = String(selectedUserId) === String(authUser?.id)

  return (
    <main className="page-layout">
      <div className="page-container page-container-narrow">

        <div className="page-header" style={{ marginBottom: '1.5rem' }}>
          <div>
            <p className="page-eyebrow">Cuenta</p>
            <h1 className="page-title">Perfil</h1>
          </div>
        </div>

        {/* ── ADMIN: user selector ── */}
        {isAdmin && (
          <div className="profile-admin-panel">
            <div className="profile-admin-header">
              <span className="profile-admin-label">Panel de administrador</span>
              <span className="badge badge-red">Admin</span>
            </div>
            <div className="profile-admin-body">
              <div className="field">
                <label className="field-label">Editar usuario</label>
                <select
                  className="field-input"
                  value={selectedUserId}
                  onChange={e => setSelectedUserId(e.target.value)}
                >
                  {allUsers.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.nickname ? `${u.nickname} — ${u.name}` : u.name}
                      {String(u.id) === String(authUser?.id) ? ' (tú)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* ── PROFILE CARD ── */}
        <div className="detail-card">

          {/* Avatar header */}
          <div className="profile-card-header">
            <div className="profile-header-info">
              <div className="profile-header-name">{form.name || '—'}</div>
              <div className="profile-header-nick">@{form.nickname || '—'}</div>
              {form.type && (
                <span className={`badge badge-sm ${
                  form.type === 'admin'   ? 'badge-red'   :
                  form.type === 'junta'   ? 'badge-amber' :
                  form.type === 'partner' ? 'badge-green' : 'badge-blue'
                }`}>
                  {TYPE_LABELS[form.type] || form.type}
                </span>
              )}
            </div>
            {!isOwnProfile && (
              <div className="profile-editing-badge">
                Editando perfil ajeno
              </div>
            )}
          </div>

          {loading ? (
            <div className="loading-state" style={{ padding: '3rem' }}>
              <div className="spinner" /><span>Cargando perfil...</span>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="game-form">

              {/* ── Datos personales ── */}
              <div className="form-section-title">Datos personales</div>

              <div className="form-row">
                <div className="field">
                  <label className="field-label">Nombre completo *</label>
                  <input
                    className={`field-input ${fieldErrors.name ? 'field-error' : ''}`}
                    type="text" placeholder="María García"
                    value={form.name} onChange={e => set('name', e.target.value)}
                  />
                  {fieldErrors.name && <span className="field-error-msg">{fieldErrors.name}</span>}
                </div>
                <div className="field">
                  <label className="field-label">Nickname *</label>
                  <input
                    className={`field-input ${fieldErrors.nickname ? 'field-error' : ''}`}
                    type="text" placeholder="meeple_queen"
                    value={form.nickname} onChange={e => set('nickname', e.target.value)}
                  />
                  {fieldErrors.nickname && <span className="field-error-msg">{fieldErrors.nickname}</span>}
                </div>
              </div>

              <div className="form-row">
                <div className="field">
                  <label className="field-label">Email *</label>
                  <input
                    className={`field-input ${fieldErrors.email ? 'field-error' : ''}`}
                    type="email" placeholder="tu@email.com"
                    value={form.email} onChange={e => set('email', e.target.value)}
                  />
                  {fieldErrors.email && <span className="field-error-msg">{fieldErrors.email}</span>}
                </div>
                <div className="field">
                  <label className="field-label">Teléfono</label>
                  <input
                    className={`field-input ${fieldErrors.telephone ? 'field-error' : ''}`}
                    type="tel" placeholder="+34 600 000 000"
                    value={form.telephone} onChange={e => set('telephone', e.target.value)}
                  />
                  {fieldErrors.telephone && <span className="field-error-msg">{fieldErrors.telephone}</span>}
                </div>
              </div>

              <div className="form-row">
                <div className="field">
                  <label className="field-label">Edad</label>
                  <input
                    className={`field-input ${fieldErrors.age ? 'field-error' : ''}`}
                    type="number" min="0" max="120" placeholder="30"
                    value={form.age} onChange={e => set('age', e.target.value)}
                  />
                  {fieldErrors.age && <span className="field-error-msg">{fieldErrors.age}</span>}
                </div>
                <div className="field">
                  <label className="field-label">Nº de socio</label>
                  {isAdmin ? (
                    <input
                      className="field-input"
                      type="number" min="0" placeholder="001"
                      value={form.num_partner} onChange={e => set('num_partner', e.target.value)}
                    />
                  ) : (
                    <div className="field-readonly">
                      <span className="field-readonly-value">
                        {form.num_partner !== '' ? `#${form.num_partner}` : '—'}
                      </span>
                      <span className="field-readonly-note">Solo el administrador puede modificar este campo</span>
                    </div>
                  )}
                </div>
              </div>

              {/* ── Tipo de usuario (admin only) ── */}
              {isAdmin && (
                <>
                  <div className="form-section-title">Permisos</div>
                  <div className="field" style={{ maxWidth: '260px' }}>
                    <label className="field-label">Tipo de usuario</label>
                    <select
                      className="field-input"
                      value={form.type}
                      onChange={e => set('type', e.target.value)}
                    >
                      {USER_TYPES.map(t => (
                        <option key={t} value={t}>{TYPE_LABELS[t]}</option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              {/* ── Cambio de contraseña ── */}
              <div className="form-section-title">Cambiar contraseña</div>
              <p className="form-section-hint">Déjalo vacío si no quieres cambiarla</p>

              <div className="form-row">
                <div className="field">
                  <label className="field-label">Nueva contraseña</label>
                  <input
                    className={`field-input ${fieldErrors.password ? 'field-error' : ''}`}
                    type="password" placeholder="Mínimo 8 caracteres"
                    value={form.password} onChange={e => set('password', e.target.value)}
                    autoComplete="new-password"
                  />
                  {fieldErrors.password && <span className="field-error-msg">{fieldErrors.password}</span>}
                </div>
                <div className="field">
                  <label className="field-label">Confirmar contraseña</label>
                  <input
                    className={`field-input ${fieldErrors.password_confirmation ? 'field-error' : ''}`}
                    type="password" placeholder="Repite la contraseña"
                    value={form.password_confirmation} onChange={e => set('password_confirmation', e.target.value)}
                    autoComplete="new-password"
                  />
                  {fieldErrors.password_confirmation && <span className="field-error-msg">{fieldErrors.password_confirmation}</span>}
                </div>
              </div>

              {error   && <p className="msg msg-error">{error}</p>}
              {success && <p className="msg msg-success">{success}</p>}

              <div className="detail-actions" style={{ padding: 0, marginTop: '0.5rem' }}>
                <span className="form-required-note">* Campos obligatorios</span>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving && <span className="spinner-inline" />}
                  {saving ? 'Guardando...' : 'Guardar cambios'}
                </button>
              </div>

            </form>
          )}
        </div>
      </div>
    </main>
  )
}
