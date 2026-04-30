import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { createApi } from '../services/api'

// zassessions fields: id, name, event_name, date, start_time, end_time, max_users, direction, latitude, longitude

const EMPTY = {
  name: '', event_name: '', date: '', start_time: '', end_time: '',
  max_users: '', direction: '', latitude: '', longitude: '',
}

export default function SessionForm({ mode }) {
  const { id }     = useParams()
  const navigate   = useNavigate()
  const { authHeaders, API, user } = useAuth()

  const api    = createApi(API, authHeaders)
  const isEdit = mode === 'edit'

  const [form,        setForm]        = useState(EMPTY)
  const [loading,     setLoading]     = useState(isEdit)
  const [saving,      setSaving]      = useState(false)
  const [error,       setError]       = useState('')
  const [fieldErrors, setFieldErrors] = useState({})

  const canAccess = user?.type==='admin'||user?.type==='junta'

  useEffect(() => {
    if (!isEdit || !id) return
    async function load() {
      setLoading(true)
      try {
        const raw = await api.sessions.get(id)
        const d   = raw.data || raw
        setForm({
          name:       d.name       || '',
          event_name: d.event_name || '',
          date:       d.date       || '',
          start_time: d.start_time ? d.start_time.slice(0,5) : '',
          end_time:   d.end_time   ? d.end_time.slice(0,5)   : '',
          max_users:  d.max_users  ?? '',
          direction:  d.direction  || '',
          latitude:   d.latitude   ?? '',
          longitude:  d.longitude  ?? '',
        })
      } catch(e) { setError(e.message) }
      setLoading(false)
    }
    load()
  }, [id, isEdit])

  function set(k, v) {
    setForm(f => ({...f, [k]: v}))
    setFieldErrors(fe => ({...fe, [k]: ''}))
  }

  function validate() {
    const e = {}
    if (!form.name.trim())   e.name       = 'El nombre es obligatorio'
    if (!form.date)          e.date       = 'La fecha es obligatoria'
    if (!form.start_time)    e.start_time = 'La hora de inicio es obligatoria'
    if (!form.end_time)      e.end_time   = 'La hora de fin es obligatoria'
    if (!form.max_users)     e.max_users  = 'El aforo es obligatorio'
    if (!form.direction.trim()) e.direction = 'La dirección es obligatoria'
    return e
  }

  async function handleSubmit(ev) {
    ev.preventDefault()
    setError(''); setFieldErrors({})
    const errs = validate()
    if (Object.keys(errs).length) { setFieldErrors(errs); return }

    setSaving(true)
    const payload = {
      name:       form.name.trim(),
      event_name: form.event_name.trim() || null,
      date:       form.date,
      start_time: form.start_time ? `${form.start_time}:00` : null,
      end_time:   form.end_time   ? `${form.end_time}:00`   : null,
      max_users:  parseInt(form.max_users),
      direction:  form.direction.trim(),
      latitude:   form.latitude  !== '' ? parseFloat(form.latitude)  : null,
      longitude:  form.longitude !== '' ? parseFloat(form.longitude) : null,
    }

    try {
      const data = isEdit
        ? await api.sessions.update(id, payload)
        : await api.sessions.create(payload)
      const savedId = data.data?.id || data.id || id
      navigate(`/sessions/${savedId}`)
    } catch (e) {
      if (e.data?.errors) {
        const fe = {}
        Object.entries(e.data.errors).forEach(([k, v]) => { fe[k] = Array.isArray(v) ? v[0] : v })
        setFieldErrors(fe)
      } else { setError(e.message) }
    }
    setSaving(false)
  }

  if (!canAccess) return (
    <main className="page-layout"><div className="page-container">
      <div className="page-error"><span>🔒</span><p>No tienes permisos para acceder a esta página</p></div>
      <Link to="/sessions" className="btn btn-ghost" style={{marginTop:'1.5rem',display:'inline-flex'}}>← Volver</Link>
    </div></main>
  )

  if (loading) return (
    <main className="page-layout"><div className="page-container">
      <div className="loading-state" style={{padding:'5rem'}}><div className="spinner"/><span>Cargando...</span></div>
    </div></main>
  )

  return (
    <main className="page-layout">
      <div className="page-container page-container-narrow">

        <nav className="breadcrumb">
          <Link to="/sessions" className="breadcrumb-link">Sesiones</Link>
          <span className="breadcrumb-sep">›</span>
          {isEdit && (
            <><Link to={`/sessions/${id}`} className="breadcrumb-link">{form.name||'Sesión'}</Link>
            <span className="breadcrumb-sep">›</span></>
          )}
          <span className="breadcrumb-current">{isEdit?'Editar':'Nueva sesión'}</span>
        </nav>

        <div className="detail-card">
          <div className="detail-card-header">
            <h1 className="detail-title">{isEdit?`Editar: ${form.name}`:'Nueva sesión'}</h1>
          </div>

          <form onSubmit={handleSubmit} className="game-form">

            {/* Name + Event */}
            <div className="form-row">
              <div className="field">
                <label className="field-label">Nombre de la sesión *</label>
                <input className={`field-input ${fieldErrors.name?'field-error':''}`}
                  type="text" placeholder="Sesión mensual de junio"
                  value={form.name} onChange={e=>set('name',e.target.value)}/>
                {fieldErrors.name&&<span className="field-error-msg">{fieldErrors.name}</span>}
              </div>
              <div className="field">
                <label className="field-label">Nombre del evento</label>
                <input className="field-input" type="text" placeholder="Torneo de verano (opcional)"
                  value={form.event_name} onChange={e=>set('event_name',e.target.value)}/>
              </div>
            </div>

            {/* Date + max_users */}
            <div className="form-row">
              <div className="field">
                <label className="field-label">Fecha *</label>
                <input className={`field-input ${fieldErrors.date?'field-error':''}`}
                  type="date" value={form.date} onChange={e=>set('date',e.target.value)}/>
                {fieldErrors.date&&<span className="field-error-msg">{fieldErrors.date}</span>}
              </div>
              <div className="field">
                <label className="field-label">Aforo máximo *</label>
                <input className={`field-input ${fieldErrors.max_users?'field-error':''}`}
                  type="number" min="1" max="500" placeholder="30"
                  value={form.max_users} onChange={e=>set('max_users',e.target.value)}/>
                {fieldErrors.max_users&&<span className="field-error-msg">{fieldErrors.max_users}</span>}
              </div>
            </div>

            {/* Times */}
            <div className="form-row">
              <div className="field">
                <label className="field-label">Hora de inicio *</label>
                <input className={`field-input ${fieldErrors.start_time?'field-error':''}`}
                  type="time" value={form.start_time} onChange={e=>set('start_time',e.target.value)}/>
                {fieldErrors.start_time&&<span className="field-error-msg">{fieldErrors.start_time}</span>}
              </div>
              <div className="field">
                <label className="field-label">Hora de fin *</label>
                <input className={`field-input ${fieldErrors.end_time?'field-error':''}`}
                  type="time" value={form.end_time} onChange={e=>set('end_time',e.target.value)}/>
                {fieldErrors.end_time&&<span className="field-error-msg">{fieldErrors.end_time}</span>}
              </div>
            </div>

            {/* Direction */}
            <div className="field">
              <label className="field-label">Dirección *</label>
              <input className={`field-input ${fieldErrors.direction?'field-error':''}`}
                type="text" placeholder="Calle Ejemplo 12, Barcelona"
                value={form.direction} onChange={e=>set('direction',e.target.value)}/>
              {fieldErrors.direction&&<span className="field-error-msg">{fieldErrors.direction}</span>}
            </div>

            {/* Coordinates */}
            <div className="form-section-title" style={{marginTop:'0.25rem'}}>Coordenadas (opcional)</div>
            <div className="form-row">
              <div className="field">
                <label className="field-label">Latitud</label>
                <input className="field-input" type="number" step="any" placeholder="41.3851"
                  value={form.latitude} onChange={e=>set('latitude',e.target.value)}/>
              </div>
              <div className="field">
                <label className="field-label">Longitud</label>
                <input className="field-input" type="number" step="any" placeholder="2.1734"
                  value={form.longitude} onChange={e=>set('longitude',e.target.value)}/>
              </div>
            </div>

            {error&&<p className="msg msg-error">{error}</p>}

            <div className="detail-actions" style={{padding:0,marginTop:'0.25rem'}}>
              <Link to={isEdit?`/sessions/${id}`:'/sessions'} className="btn btn-ghost">← Cancelar</Link>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving&&<span className="spinner-inline"/>}
                {saving?'Guardando...':isEdit?'Guardar cambios':'Crear sesión'}
              </button>
            </div>

          </form>
        </div>
      </div>
    </main>
  )
}
