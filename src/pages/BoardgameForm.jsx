import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { createApi } from '../services/api'

function toSlug(name) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

const EMPTY_FORM = {
  name: '', min_players: '', max_players: '', min_age: '',
  duration: '', description: '', owner_user_id: '', // will be set to user.id on mount
}

export default function BoardgameForm({ mode }) {
  const { id }     = useParams()
  const navigate   = useNavigate()
  const { authHeaders, API, user } = useAuth()

  const api    = createApi(API, authHeaders)
  const isEdit = mode === 'edit'

  const [form,        setForm]        = useState({ ...EMPTY_FORM, owner_user_id: user?.id ?? '' })
  const [allTypes,    setAllTypes]    = useState([])
  const [gameTypeIds, setGameTypeIds] = useState([])
  const [loading,     setLoading]     = useState(isEdit)
  const [saving,      setSaving]      = useState(false)
  const [error,       setError]       = useState('')
  const [fieldErrors, setFieldErrors] = useState({})

  const canAccess = user?.type === 'admin' || user?.type === 'junta'

  const assignedTypes  = allTypes.filter(t =>  gameTypeIds.includes(t.id))
  const availableTypes = allTypes.filter(t => !gameTypeIds.includes(t.id))

  function addType(typeId)    { setGameTypeIds(prev => [...prev, typeId]) }
  function removeType(typeId) { setGameTypeIds(prev => prev.filter(i => i !== typeId)) }

  useEffect(() => {
    async function init() {
      setLoading(true)
      try {
        const types = await api.types.list()
        setAllTypes(types)

        if (isEdit && id) {
          const raw  = await api.boardgames.get(id)
          const data = raw.data || raw

          setForm({
            name:          data.name          || '',
            min_players:   data.min_players   ?? '',
            max_players:   data.max_players   ?? '',
            min_age:       data.min_age       ?? '',
            duration:      data.duration      ?? '',
            description:   data.description   || '',
            owner_user_id: data.owner_user_id ?? '',
          })

          // Types can come as:
          // - data.types  → array of type objects [{ id, type, ... }]
          // - data.type_ids → array of ids [1, 2, 3]
          // - data.boardgame_types → pivot table objects [{ type_id, ... }]
          let typeIds = []
          if (Array.isArray(data.types) && data.types.length > 0) {
            typeIds = data.types.map(t => t.id ?? t.type_id ?? t)
          } else if (Array.isArray(data.type_ids) && data.type_ids.length > 0) {
            typeIds = data.type_ids
          } else if (Array.isArray(data.boardgame_types) && data.boardgame_types.length > 0) {
            typeIds = data.boardgame_types.map(bt => bt.type_id ?? bt.id)
          }
          setGameTypeIds(typeIds.map(Number).filter(Boolean))
        }
      } catch (e) {
        setError(e.message)
      }
      setLoading(false)
    }
    init()
  }, [id, isEdit])

  function set(k, v) {
    setForm(f => ({ ...f, [k]: v }))
    setFieldErrors(fe => ({ ...fe, [k]: '' }))
  }

  function validate() {
    const errs = {}
    if (!form.name.trim())       errs.name        = 'El nombre es obligatorio'
    if (!form.min_players)       errs.min_players  = 'Campo requerido'
    if (!form.max_players)       errs.max_players  = 'Campo requerido'
    if (parseInt(form.min_players) > parseInt(form.max_players))
      errs.max_players = 'El máximo debe ser ≥ al mínimo'
    if (!form.min_age)           errs.min_age     = 'Campo requerido'
    if (!form.duration)          errs.duration    = 'Campo requerido'
    return errs
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(''); setFieldErrors({})
    const errs = validate()
    if (Object.keys(errs).length) { setFieldErrors(errs); return }

    setSaving(true)
    const payload = {
      name:          form.name.trim(),
      slug:          toSlug(form.name.trim()),
      min_players:   parseInt(form.min_players),
      max_players:   parseInt(form.max_players),
      min_age:       parseInt(form.min_age),
      duration:      parseInt(form.duration),
      description:   form.description.trim() || null,
      owner_user_id: form.owner_user_id !== '' ? parseInt(form.owner_user_id) : null,
      // Send type IDs in multiple formats — the backend uses whichever it expects
      types:         gameTypeIds,   // most common: $boardgame->types()->sync($request->types)
      type_ids:      gameTypeIds,   // alternative key name
    }

    try {
      const data = isEdit
        ? await api.boardgames.update(id, payload)
        : await api.boardgames.create(payload)
      const savedId = data.data?.id || data.id || id
      navigate(`/boardgames/${savedId}`)
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

  if (!canAccess) return (
    <main className="page-layout">
      <div className="page-container">
        <div className="page-error"><span>🔒</span><p>No tienes permisos para acceder a esta página</p></div>
        <Link to="/boardgames" className="btn btn-ghost" style={{ marginTop: '1.5rem', display: 'inline-flex' }}>← Volver</Link>
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
          <Link to="/boardgames" className="breadcrumb-link">Ludoteca</Link>
          <span className="breadcrumb-sep">›</span>
          {isEdit && (
            <>
              <Link to={`/boardgames/${id}`} className="breadcrumb-link">{form.name || 'Juego'}</Link>
              <span className="breadcrumb-sep">›</span>
            </>
          )}
          <span className="breadcrumb-current">{isEdit ? 'Editar' : 'Nuevo juego'}</span>
        </nav>

        <div className="detail-card">
          <div className="detail-card-header">
            <h1 className="detail-title">
              {isEdit ? `Editar: ${form.name}` : 'Añadir nuevo juego'}
            </h1>
            {form.name && (
              <p className="slug-preview">
                Slug: <code>{toSlug(form.name)}</code>
              </p>
            )}
          </div>

          <form onSubmit={handleSubmit} className="game-form">

            <div className="field">
              <label className="field-label">Nombre del juego *</label>
              <input
                className={`field-input ${fieldErrors.name ? 'field-error' : ''}`}
                type="text" placeholder="Ej: Catan"
                value={form.name} onChange={e => set('name', e.target.value)}
              />
              {fieldErrors.name && <span className="field-error-msg">{fieldErrors.name}</span>}
            </div>

            <div className="form-row">
              <div className="field">
                <label className="field-label">Mínimo jugadores *</label>
                <input
                  className={`field-input ${fieldErrors.min_players ? 'field-error' : ''}`}
                  type="number" min="1" max="99" placeholder="2"
                  value={form.min_players} onChange={e => set('min_players', e.target.value)}
                />
                {fieldErrors.min_players && <span className="field-error-msg">{fieldErrors.min_players}</span>}
              </div>
              <div className="field">
                <label className="field-label">Máximo jugadores *</label>
                <input
                  className={`field-input ${fieldErrors.max_players ? 'field-error' : ''}`}
                  type="number" min="1" max="99" placeholder="6"
                  value={form.max_players} onChange={e => set('max_players', e.target.value)}
                />
                {fieldErrors.max_players && <span className="field-error-msg">{fieldErrors.max_players}</span>}
              </div>
            </div>

            <div className="form-row">
              <div className="field">
                <label className="field-label">Edad mínima *</label>
                <input
                  className={`field-input ${fieldErrors.min_age ? 'field-error' : ''}`}
                  type="number" min="3" max="99" placeholder="12"
                  value={form.min_age} onChange={e => set('min_age', e.target.value)}
                />
                {fieldErrors.min_age && <span className="field-error-msg">{fieldErrors.min_age}</span>}
              </div>
              <div className="field">
                <label className="field-label">Duración (minutos) *</label>
                <input
                  className={`field-input ${fieldErrors.duration ? 'field-error' : ''}`}
                  type="number" min="5" max="600" placeholder="60"
                  value={form.duration} onChange={e => set('duration', e.target.value)}
                />
                {fieldErrors.duration && <span className="field-error-msg">{fieldErrors.duration}</span>}
              </div>
            </div>

            {/* Two-column type selector */}
            <div className="field">
              <label className="field-label">Tipos de juego</label>
              <div className="types-dual">
                <div className="types-col">
                  <div className="types-col-header">
                    <span className="types-col-title">Tipos disponibles</span>
                    <span className="types-col-count">{availableTypes.length}</span>
                  </div>
                  <div className="types-col-list">
                    {availableTypes.length === 0
                      ? <p className="types-col-empty">Todos asignados</p>
                      : availableTypes.map(t => (
                          <button key={t.id} type="button" className="types-col-item types-col-item-add" onClick={() => addType(t.id)}>
                            <span className="types-item-label">{t.type}</span>
                            <span className="types-item-action">+</span>
                          </button>
                        ))
                    }
                  </div>
                </div>

                <div className="types-arrow">⇄</div>

                <div className="types-col">
                  <div className="types-col-header">
                    <span className="types-col-title">Tipos del juego</span>
                    <span className="types-col-count types-col-count-active">{assignedTypes.length}</span>
                  </div>
                  <div className="types-col-list">
                    {assignedTypes.length === 0
                      ? <p className="types-col-empty">Sin tipos asignados</p>
                      : assignedTypes.map(t => (
                          <button key={t.id} type="button" className="types-col-item types-col-item-remove" onClick={() => removeType(t.id)}>
                            <span className="types-item-label">{t.type}</span>
                            <span className="types-item-action">✕</span>
                          </button>
                        ))
                    }
                  </div>
                </div>
              </div>
            </div>

            <div className="field" style={{ maxWidth: '280px' }}>
              <label className="field-label">Propietario</label>
              <select
                className="field-input"
                value={form.owner_user_id ?? ''}
                onChange={e => set('owner_user_id', e.target.value)}
              >
                <option value="">ZAS</option>
                <option value={user?.id}>Usuario actual ({user?.nickname || user?.name})</option>
              </select>
            </div>

            <div className="field">
              <label className="field-label">Descripción</label>
              <textarea
                className="field-input field-textarea"
                placeholder="Descripción del juego, mecánicas, temática..."
                value={form.description}
                onChange={e => set('description', e.target.value)}
                rows={5}
              />
            </div>

            {error && <p className="msg msg-error">{error}</p>}

            <div className="detail-actions" style={{ padding: 0, marginTop: '0.25rem' }}>
              <Link to={isEdit ? `/boardgames/${id}` : '/boardgames'} className="btn btn-ghost">
                ← Cancelar
              </Link>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving && <span className="spinner-inline" />}
                {saving ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear juego'}
              </button>
            </div>

          </form>
        </div>
      </div>
    </main>
  )
}
