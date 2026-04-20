import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

// The 'type' field is an ENUM in the DB, so on create we let the user pick from the full list.
// On edit, the enum value is fixed (the DB doesn't allow changing it easily), so we only allow
// editing the description. If your backend does support updating the type enum, it will work too.

const TYPE_ENUM = [
  'abstracto','ameritrash','cartas','clásico','colocación de trabajadores',
  'construcción de mazos','cooperativo','dados','escape room','estrategia',
  'eurogame','familiar','filler','infantil','investigacion','mayorias',
  'narrativo','party','roles ocultos','wargame',
]

export default function TypeForm({ mode }) {
  const { id }     = useParams()
  const navigate   = useNavigate()
  const { authHeaders, API, user } = useAuth()

  const isEdit = mode === 'edit'

  const [typeVal,     setTypeVal]     = useState('')
  const [description, setDescription] = useState('')
  const [loading,     setLoading]     = useState(isEdit)
  const [saving,      setSaving]      = useState(false)
  const [error,       setError]       = useState('')
  const [fieldErrors, setFieldErrors] = useState({})

  const canAccess = user?.type === 'admin' || user?.type === 'junta'

  useEffect(() => {
    if (isEdit && id) {
      async function loadType() {
        setLoading(true)
        try {
          const res  = await fetch(`${API}/types/${id}`, { headers: authHeaders })
          if (!res.ok) throw new Error('No se pudo cargar el tipo')
          const raw  = await res.json()
          const data = raw.data || raw
          setTypeVal(data.type || '')
          setDescription(data.description || '')
        } catch (e) {
          setError(e.message)
        }
        setLoading(false)
      }
      loadType()
    }
  }, [id, isEdit])

  function validate() {
    const errs = {}
    if (!typeVal) errs.type = 'Debes seleccionar un tipo'
    return errs
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(''); setFieldErrors({})

    const errs = validate()
    if (Object.keys(errs).length) { setFieldErrors(errs); return }

    setSaving(true)
    const payload = {
      type:        typeVal,
      description: description.trim() || null,
    }

    try {
      const url    = isEdit ? `${API}/types/${id}` : `${API}/types`
      const method = isEdit ? 'PUT' : 'POST'
      const res    = await fetch(url, { method, headers: authHeaders, body: JSON.stringify(payload) })
      const data   = await res.json()

      if (!res.ok) {
        if (data.errors) {
          const fe = {}
          Object.entries(data.errors).forEach(([k, v]) => { fe[k] = Array.isArray(v) ? v[0] : v })
          setFieldErrors(fe)
        } else {
          setError(data.message || 'Error al guardar')
        }
        setSaving(false)
        return
      }

      const savedId = data.data?.id || data.id || id
      navigate(`/types/${savedId}`)
    } catch {
      setError('No se pudo conectar con el servidor')
    }
    setSaving(false)
  }

  if (!canAccess) return (
    <main className="page-layout">
      <div className="page-container">
        <div className="page-error"><span>🔒</span><p>No tienes permisos para acceder a esta página</p></div>
        <Link to="/types" className="btn btn-ghost" style={{ marginTop: '1.5rem', display: 'inline-flex' }}>← Volver</Link>
      </div>
    </main>
  )

  if (loading) return (
    <main className="page-layout">
      <div className="page-container">
        <div className="loading-state" style={{ padding: '5rem' }}>
          <div className="spinner" /><span>Cargando...</span>
        </div>
      </div>
    </main>
  )

  return (
    <main className="page-layout">
      <div className="page-container page-container-narrow">

        <nav className="breadcrumb">
          <Link to="/types" className="breadcrumb-link">Tipos de juego</Link>
          <span className="breadcrumb-sep">›</span>
          {isEdit && (
            <>
              <Link to={`/types/${id}`} className="breadcrumb-link" style={{ textTransform: 'capitalize' }}>
                {typeVal || 'Tipo'}
              </Link>
              <span className="breadcrumb-sep">›</span>
            </>
          )}
          <span className="breadcrumb-current">{isEdit ? 'Editar' : 'Nuevo tipo'}</span>
        </nav>

        <div className="detail-card">
          <div className="detail-card-header">
            <h1 className="detail-title">
              {isEdit ? `Editar: ${typeVal}` : 'Añadir nuevo tipo'}
            </h1>
          </div>

          <form onSubmit={handleSubmit} className="game-form">

            {/* Type selector — dropdown on create, read-only on edit */}
            <div className="field">
              <label className="field-label">Tipo de juego *</label>
              {isEdit ? (
                <div className="field-readonly">
                  <span className="field-readonly-value">{typeVal}</span>
                  <span className="field-readonly-note">El tipo no se puede cambiar una vez creado</span>
                </div>
              ) : (
                <>
                  <select
                    className={`field-input ${fieldErrors.type ? 'field-error' : ''}`}
                    value={typeVal}
                    onChange={e => { setTypeVal(e.target.value); setFieldErrors(fe => ({ ...fe, type: '' })) }}
                  >
                    <option value="">— Selecciona un tipo —</option>
                    {TYPE_ENUM.map(t => (
                      <option key={t} value={t}>
                        {t.charAt(0).toUpperCase() + t.slice(1)}
                      </option>
                    ))}
                  </select>
                  {fieldErrors.type && <span className="field-error-msg">{fieldErrors.type}</span>}
                </>
              )}
            </div>

            {/* Description */}
            <div className="field">
              <label className="field-label">Descripción</label>
              <textarea
                className="field-input field-textarea"
                placeholder="Describe las características de este tipo de juego..."
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={6}
              />
            </div>

            {error && <p className="msg msg-error">{error}</p>}

            <div className="detail-actions" style={{ padding: 0, marginTop: '0.25rem' }}>
              <Link to={isEdit ? `/types/${id}` : '/types'} className="btn btn-ghost">
                ← Cancelar
              </Link>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving && <span className="spinner-inline" />}
                {saving ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear tipo'}
              </button>
            </div>

          </form>
        </div>
      </div>
    </main>
  )
}
