import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const STATUS_OPTIONS = [
  { value: 'open',     label: 'Abierta' },
  { value: 'limited',  label: 'Limitada' },
  { value: 'playing',  label: 'Jugando' },
  { value: 'finished', label: 'Terminada' },
]

const EMPTY = {
  boardgame_id: '', max_players: '', start_time: '',
  status: 'open', necesary_know_how: false,
}

const PALETTE = ['#800020','#6C63FF','#4aab78','#d4963a','#5a9fd4','#9b59b6']
function avatarColor(str) {
  let h = 0; for (const c of (str||'')) h=(h*31+c.charCodeAt(0))%PALETTE.length; return PALETTE[h]
}
function initials(nick, name) {
  const s = nick||name||'?'; return s.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2)
}

export default function GameForm({ mode }) {
  const { sessionId, id: gameId } = useParams()
  const navigate   = useNavigate()
  const { authHeaders, API, user } = useAuth()

  const isEdit    = mode === 'edit'
  const canAccess = user?.type !== 'guest'

  const [form,        setForm]        = useState(EMPTY)
  const [boardgames,  setBoardgames]  = useState([])
  const [sessionData, setSessionData] = useState(null)
  const [gameData,    setGameData]    = useState(null)   // full game object (edit mode)
  const [gameUsers,   setGameUsers]   = useState([])     // players in the game (edit mode)
  const [loading,     setLoading]     = useState(true)
  const [saving,      setSaving]      = useState(false)
  const [error,       setError]       = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [kickingId,   setKickingId]   = useState(null)  // id of user being kicked
  const [kickMsg,     setKickMsg]     = useState('')

  // Can kick players: host or admin/junta, and only when game is not locked
  const isHost    = gameData && String(gameData.host_user_id) === String(user?.id)
  const canManage = user?.type === 'admin' || user?.type === 'junta'
  const isLocked  = form.status === 'playing' || form.status === 'finished'
  const canKick   = isEdit && (isHost || canManage) && !isLocked

  async function loadGameUsers() {
    if (!gameId) return
    try {
      const res = await fetch(`${API}/games/${gameId}/users`, { headers: authHeaders })
      if (res.ok) {
        const d = await res.json()
        setGameUsers(Array.isArray(d) ? d : (d.data || []))
      }
    } catch {}
  }

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const bgRes = await fetch(`${API}/boardgames`, { headers: authHeaders })
        if (bgRes.ok) {
          const d = await bgRes.json()
          setBoardgames(Array.isArray(d) ? d : (d.data||[]))
        }

        if (isEdit && gameId) {
          const [gRes, uRes] = await Promise.all([
            fetch(`${API}/games/${gameId}`,       { headers: authHeaders }),
            fetch(`${API}/games/${gameId}/users`, { headers: authHeaders }),
          ])
          if (!gRes.ok) throw new Error('No se pudo cargar la partida')
          const raw = await gRes.json()
          const g   = raw.data || raw
          setGameData(g)
          setForm({
            boardgame_id:      g.boardgame_id       ?? '',
            max_players:       g.max_players        ?? '',
            start_time:        g.start_time ? g.start_time.slice(0,5) : '',
            status:            g.status             || 'open',
            necesary_know_how: g.necesary_know_how ? true : false,
          })
          if (uRes.ok) {
            const ud = await uRes.json()
            setGameUsers(Array.isArray(ud) ? ud : (ud.data || []))
          }
          if (g.zassession_id) {
            const sRes = await fetch(`${API}/zassessions/${g.zassession_id}`, { headers: authHeaders })
            if (sRes.ok) { const sd=await sRes.json(); setSessionData(sd.data||sd) }
          }
        } else if (sessionId) {
          const sRes = await fetch(`${API}/zassessions/${sessionId}`, { headers: authHeaders })
          if (sRes.ok) {
            const sd = await sRes.json()
            const s  = sd.data || sd
            setSessionData(s)
            setForm(f => ({ ...f, start_time: s.start_time ? s.start_time.slice(0,5) : '' }))
          }
        }
      } catch(e) { setError(e.message) }
      setLoading(false)
    }
    load()
  }, [gameId, sessionId, isEdit])

  function set(k,v) { setForm(f=>({...f,[k]:v})); setFieldErrors(fe=>({...fe,[k]:''})) }

  function validate() {
    const e = {}
    if (!form.boardgame_id) e.boardgame_id = 'Debes seleccionar un juego'
    if (!form.start_time)   e.start_time   = 'La hora de inicio es obligatoria'
    if (form.max_players && parseInt(form.max_players) < 1)
      e.max_players = 'El mínimo es 1'
    return e
  }

  async function handleKick(userId) {
    setKickingId(userId); setKickMsg('')
    try {
      const res = await fetch(`${API}/games/${gameId}/leave`, {
        method: 'DELETE',
        headers: { ...authHeaders, 'X-User-Id': userId },
        body: JSON.stringify({ user_id: userId }),
      })
      if (res.ok) {
        setKickMsg('Jugador dado de baja correctamente')
        await loadGameUsers()
      } else {
        const d = await res.json()
        setKickMsg(d.message || 'No se pudo dar de baja al jugador')
      }
    } catch {
      setKickMsg('Error de conexión')
    }
    setKickingId(null)
  }

  async function handleSubmit(ev) {
    ev.preventDefault()
    setError(''); setFieldErrors({})
    const errs = validate()
    if (Object.keys(errs).length) { setFieldErrors(errs); return }

    setSaving(true)
    const payload = {
      boardgame_id:      parseInt(form.boardgame_id),
      max_players:       form.max_players !== '' ? parseInt(form.max_players) : null,
      start_time:        form.start_time + ':00',
      status:            form.status,
      necesary_know_how: form.necesary_know_how ? 1 : 0,
    }
    if (!isEdit) {
      payload.zassession_id = parseInt(sessionId)
      payload.host_user_id  = user?.id
    }

    try {
      const url    = isEdit ? `${API}/games/${gameId}` : `${API}/games`
      const method = isEdit ? 'PUT' : 'POST'
      const res    = await fetch(url, { method, headers: authHeaders, body: JSON.stringify(payload) })
      const data   = await res.json()

      if (!res.ok) {
        if (data.errors) {
          const fe={}; Object.entries(data.errors).forEach(([k,v])=>{fe[k]=Array.isArray(v)?v[0]:v})
          setFieldErrors(fe)
        } else { setError(data.message||'Error al guardar') }
        setSaving(false); return
      }

      const sid = sessionId || sessionData?.id || data.data?.zassession_id || data.zassession_id
      navigate(`/sessions/${sid}`)
    } catch { setError('No se pudo conectar con el servidor') }
    setSaving(false)
  }

  const backSessionId = sessionId || sessionData?.id
  const selectedBg    = boardgames.find(b => String(b.id)===String(form.boardgame_id))

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
          {backSessionId && (
            <><Link to={`/sessions/${backSessionId}`} className="breadcrumb-link">
              {sessionData?.name || `Sesión #${backSessionId}`}
            </Link>
            <span className="breadcrumb-sep">›</span></>
          )}
          <span className="breadcrumb-current">{isEdit?'Editar partida':'Nueva partida'}</span>
        </nav>

        {/* ── PLAYERS LIST (edit mode only) ── */}
        {isEdit && (
          <div className="detail-card" style={{marginBottom:'1.5rem'}}>
            <div className="section-header">
              <span className="section-label">Jugadores apuntados</span>
              <span className="section-count">
                {gameUsers.length}
                {form.max_players ? ` / ${form.max_players}` : ''}
              </span>
            </div>

            {gameUsers.length === 0 ? (
              <div className="empty-state" style={{padding:'1.5rem'}}>
                <span className="empty-icon">👥</span>
                <p>No hay jugadores apuntados todavía</p>
              </div>
            ) : (
              <ul className="attendees-list" style={{padding:'0.75rem'}}>
                {gameUsers.map(u => {
                  const isGameHost = String(u.id) === String(gameData?.host_user_id)
                  return (
                    <li key={u.id} className="attendee-item">
                      <div
                        className="attendee-avatar"
                        style={{background: avatarColor(u.nickname||u.name)}}
                      >
                        {initials(u.nickname, u.name)}
                      </div>
                      <div className="attendee-info">
                        <span className="attendee-name">{u.nickname || u.name}</span>
                        {u.nickname && u.name && u.name !== u.nickname && (
                          <span className="attendee-nick">{u.name}</span>
                        )}
                      </div>
                      {isGameHost && (
                        <span className="badge badge-sm badge-amber">Anfitrión</span>
                      )}
                      {/* Kick button — only if allowed */}
                      {canKick && (
                        <button
                          type="button"
                          className="btn-inline-ghost btn-inline-danger"
                          style={{marginLeft:'auto', flexShrink:0}}
                          onClick={() => handleKick(u.id)}
                          disabled={kickingId === u.id}
                        >
                          {kickingId === u.id ? '...' : '— Dar de baja'}
                        </button>
                      )}
                    </li>
                  )
                })}
              </ul>
            )}

            {kickMsg && (
              <p className={`msg ${kickMsg.includes('correctamente') ? 'msg-success' : 'msg-error'}`}
                style={{margin:'0 0.75rem 0.75rem'}}>
                {kickMsg}
              </p>
            )}

            {isLocked && (
              <p style={{fontSize:'0.75rem', color:'var(--text-dim)', padding:'0 1rem 1rem', fontStyle:'italic'}}>
                La partida está en curso o terminada — no se pueden gestionar jugadores
              </p>
            )}
          </div>
        )}

        {/* ── FORM ── */}
        <div className="detail-card">
          <div className="detail-card-header">
            <h1 className="detail-title">{isEdit?'Editar partida':'Crear nueva partida'}</h1>
            {sessionData && (
              <p className="session-list-event" style={{marginTop:'4px'}}>
                {sessionData.name} · {sessionData.date}
              </p>
            )}
          </div>

          <form onSubmit={handleSubmit} className="game-form">

            <div className="field">
              <label className="field-label">Juego de mesa *</label>
              <select className={`field-input ${fieldErrors.boardgame_id?'field-error':''}`}
                value={form.boardgame_id} onChange={e=>set('boardgame_id',e.target.value)}>
                <option value="">— Selecciona un juego —</option>
                {boardgames.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.min_players}–{b.max_players} jugadores)
                  </option>
                ))}
              </select>
              {fieldErrors.boardgame_id&&<span className="field-error-msg">{fieldErrors.boardgame_id}</span>}
              {selectedBg && (
                <p style={{fontSize:'0.75rem',color:'var(--text-muted)',marginTop:'4px'}}>
                  Duración aprox.: {selectedBg.duration} min · Edad mín.: {selectedBg.min_age}+
                </p>
              )}
            </div>

            <div className="form-row">
              <div className="field">
                <label className="field-label">Hora de inicio *</label>
                <input className={`field-input ${fieldErrors.start_time?'field-error':''}`}
                  type="time"
                  min={sessionData?.start_time ? sessionData.start_time.slice(0,5) : undefined}
                  max={sessionData?.end_time   ? sessionData.end_time.slice(0,5)   : undefined}
                  value={form.start_time} onChange={e=>set('start_time',e.target.value)}/>
                {fieldErrors.start_time&&<span className="field-error-msg">{fieldErrors.start_time}</span>}
                {sessionData?.start_time && (
                  <span style={{fontSize:'0.7rem',color:'var(--text-dim)'}}>
                    Sesión: {sessionData.start_time.slice(0,5)} – {sessionData.end_time?.slice(0,5)}h
                  </span>
                )}
              </div>
              <div className="field">
                <label className="field-label">Máximo de jugadores</label>
                <input className={`field-input ${fieldErrors.max_players?'field-error':''}`}
                  type="number" min="1" max="99"
                  placeholder={selectedBg ? String(selectedBg.max_players) : 'Del juego'}
                  value={form.max_players} onChange={e=>set('max_players',e.target.value)}/>
                {fieldErrors.max_players&&<span className="field-error-msg">{fieldErrors.max_players}</span>}
                <span style={{fontSize:'0.7rem',color:'var(--text-dim)'}}>Déjalo vacío para usar el máximo del juego</span>
              </div>
            </div>

            {isEdit && (
              <div className="field" style={{maxWidth:'240px'}}>
                <label className="field-label">Estado de la partida</label>
                <select className="field-input" value={form.status} onChange={e=>set('status',e.target.value)}>
                  {STATUS_OPTIONS.map(s=>(
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>
            )}

            <label className="toggle-label" style={{marginTop:'0.25rem'}}>
              <input type="checkbox" className="toggle-checkbox"
                checked={form.necesary_know_how}
                onChange={e=>set('necesary_know_how',e.target.checked)}/>
              <span className="toggle-custom"/>
              <span className="toggle-text">Requiere conocer el juego previamente</span>
            </label>

            {error&&<p className="msg msg-error">{error}</p>}

            <div className="detail-actions" style={{padding:0,marginTop:'0.25rem'}}>
              <Link to={backSessionId?`/sessions/${backSessionId}`:'/sessions'} className="btn btn-ghost">
                ← Cancelar
              </Link>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving&&<span className="spinner-inline"/>}
                {saving?'Guardando...':isEdit?'Guardar cambios':'Crear partida'}
              </button>
            </div>

          </form>
        </div>
      </div>
    </main>
  )
}
