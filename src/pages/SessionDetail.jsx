import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../hooks/useToast'

// Reglas de negocio:
// - Unirse a una partida sin estar en la sesión → join automático a la sesión primero
// - No borrarse de sesión si estás en partida activa (open/limited)
// - No borrarse de partida en estado playing o finished

import { avatarColor, initials, fmtDate, fmtTime, ROLE_LABELS, ROLE_BADGE } from '../utils/helpers'

const STATUS_MAP = {
  open:     { label: 'Abierta',   cls: 'status-open' },
  limited:  { label: 'Limitada',  cls: 'status-limited' },
  playing:  { label: 'Jugando',   cls: 'status-playing' },
  finished: { label: 'Terminada', cls: 'status-finished' },
}

// ── Toast display ─────────────────────────────────────────────────────────────
function Toast({ msg }) {
  if (!msg.text) return null
  return (
    <p className={`msg ${msg.isError ? 'msg-error' : 'msg-success'} toast-fade`}>
      {msg.text}
    </p>
  )
}

// ── GameRow ───────────────────────────────────────────────────────────────────
function GameRow({ game, authUser, authHeaders, API, sessionId, isSessionAttendee, sessionFull, onRefresh, onSessionMsg }) {
  const bg       = game.boardgame || {}
  const name     = bg.name || `Partida #${game.id}`
  const host     = game.host?.nickname || game.host?.name || '—'
  const users    = game.users || []
  const joined   = game.users_count ?? users.length ?? 0
  const maxPl    = game.max_players || bg.max_players || '?'
  const st       = STATUS_MAP[game.status] || STATUS_MAP.open
  const isHost   = String(game.host_user_id) === String(authUser?.id)
  const canManage = authUser?.type==='admin' || authUser?.type==='junta'
  const isLocked  = game.status === 'playing' || game.status === 'finished'
  const isMember  = users.some(u => String(u.id) === String(authUser?.id)) || game.is_member === true

  const [busy, setBusy]       = useState(false)
  const [gameMsg, setGameMsg] = useToast(5000)

  async function joinGame() {
    setBusy(true)

    // Auto-join session first if not already attendee
    if (!isSessionAttendee) {
      if (sessionFull) {
        setGameMsg('La sesión está completa, no puedes apuntarte a esta partida', true)
        setBusy(false); return
      }
      const sRes = await fetch(`${API}/zassessions/${sessionId}/join`, {
        method: 'POST', headers: authHeaders
      })
      if (!sRes.ok) {
        const d = await sRes.json()
        setGameMsg(d.message || 'No se pudo apuntarte a la sesión', true)
        setBusy(false); return
      }
      // Notify parent that session attendance changed
      onSessionMsg('Te hemos apuntado a la sesión automáticamente', false)
    }

    const res = await fetch(`${API}/games/${game.id}/join`, { method:'POST', headers: authHeaders })
    if (res.ok) {
      setGameMsg('¡Te has apuntado a la partida!', false)
    } else {
      const d = await res.json()
      setGameMsg(d.message || 'Error al unirse a la partida', true)
    }
    onRefresh(); setBusy(false)
  }

  async function leaveGame() {
    setBusy(true)
    const res = await fetch(`${API}/games/${game.id}/leave`, { method:'DELETE', headers: authHeaders })
    if (res.ok) {
      setGameMsg('Te has dado de baja de la partida', false)
    } else {
      const d = await res.json()
      setGameMsg(d.message || 'Error al salir de la partida', true)
    }
    onRefresh(); setBusy(false)
  }

  return (
    <div className="session-game-row">
      <div className="session-game-main">
        <div className="game-icon-wrap">{bg.name ? bg.name[0] : '♟'}</div>
        <div className="game-info">
          <div className="game-name">{name}</div>
          <div className="game-meta">
            {game.start_time && <span className="game-meta-item">🕐 {fmtTime(game.start_time)}h</span>}
            <span className="game-meta-item">👤 {host}</span>
            {bg.duration    && <span className="game-meta-item">⏱ {bg.duration} min</span>}
            {game.necesary_know_how && <span className="knowhow-badge">Requiere experiencia</span>}
          </div>
          {users.length > 0 && (
            <div className="game-players-list">
              {users.map(u => (
                <span key={u.id} className="game-player-chip"
                  style={{ background: avatarColor(u.nickname||u.name) }}
                  title={`${u.nickname||u.name}${String(u.id)===String(game.host_user_id)?' (anfitrión)':''}`}>
                  {initials(u.nickname, u.name)}
                </span>
              ))}
            </div>
          )}
          {/* Per-game toast */}
          <Toast msg={gameMsg} />
        </div>

        <div className="game-right">
          <div className="game-players">
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
              <circle cx="6" cy="5" r="3" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M1 14c0-2.8 2.2-5 5-5h2c2.8 0 5 2.2 5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            {joined}/{maxPl}
          </div>
          <span className={`badge badge-sm ${st.cls}`}>{st.label}</span>

          <div className="game-row-actions">
            {isLocked ? (
              <span style={{fontSize:'0.7rem', color:'var(--text-dim)'}}>
                {game.status === 'playing' ? 'En juego' : 'Finalizada'}
              </span>
            ) : isMember ? (
              <button className="btn-inline-ghost btn-inline-danger" onClick={leaveGame} disabled={busy}>
                {busy ? '...' : '— Salir'}
              </button>
            ) : (
              <button className="btn-inline-ghost btn-inline-join" onClick={joinGame} disabled={busy}>
                {busy ? '...' : '+ Unirse'}
              </button>
            )}
            {(canManage || isHost) && (
              <Link to={`/games/${game.id}/edit`} className="btn-inline-ghost">✏ Editar</Link>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── SessionDetail ─────────────────────────────────────────────────────────────
export default function SessionDetail() {
  const { id }     = useParams()
  const navigate   = useNavigate()
  const { authHeaders, API, user: authUser } = useAuth()

  const [session,    setSession]    = useState(null)
  const [attendees,  setAttendees]  = useState([])
  const [games,      setGames]      = useState([])
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState('')
  const [confirmDel, setConfirmDel] = useState(false)
  const [deleting,   setDeleting]   = useState(false)
  const [joinBusy,   setJoinBusy]   = useState(false)

  // Auto-dismissing toast for session-level messages
  const [sessionMsg, setSessionMsg] = useToast(5000)

  const canManage = authUser?.type==='admin' || authUser?.type==='junta'
  const canCreate = authUser?.type !== 'guest'

  const isAttendee  = attendees.some(u => String(u.id)===String(authUser?.id))
  const sessionFull = session ? attendees.length >= session.max_users : false

  // Block leaving session if in any active game
  const inActiveGame = games.some(g =>
    (g.status === 'open' || g.status === 'limited') &&
    (g.users||[]).some(u => String(u.id)===String(authUser?.id))
  )

  const loadAll = useCallback(async () => {
    try {
      const [sRes, uRes, gRes] = await Promise.all([
        fetch(`${API}/zassessions/${id}`,       { headers: authHeaders }),
        fetch(`${API}/zassessions/${id}/users`,  { headers: authHeaders }),
        fetch(`${API}/zassessions/${id}/games`,  { headers: authHeaders }),
      ])
      if (!sRes.ok) throw new Error('Sesión no encontrada')
      const [sData, uData, gData] = await Promise.all([sRes.json(), uRes.json(), gRes.json()])
      setSession(sData.data || sData)
      setAttendees(Array.isArray(uData) ? uData : (uData.data||[]))

      const rawGames = Array.isArray(gData) ? gData : (gData.data||[])

      // Build boardgame lookup
      let bgMap = {}
      if (rawGames.some(g => !g.boardgame?.name)) {
        try {
          const bgRes = await fetch(`${API}/boardgames`, { headers: authHeaders })
          if (bgRes.ok) {
            const bd = await bgRes.json()
            const bl = Array.isArray(bd) ? bd : (bd.data||[])
            bl.forEach(b => { bgMap[b.id] = b })
          }
        } catch {}
      }

      // Build user lookup to resolve host nicknames
      let userMap = {}
      if (rawGames.some(g => g.host_user_id && !g.host?.nickname && !g.host?.name)) {
        try {
          const usRes = await fetch(`${API}/users`, { headers: authHeaders })
          if (usRes.ok) {
            const ud = await usRes.json()
            const ul = Array.isArray(ud) ? ud : (ud.data||[])
            ul.forEach(u => { userMap[u.id] = u })
          }
        } catch {}
      }

      // Fetch users per game and resolve host
      const gamesWithUsers = await Promise.all(
        rawGames.map(async g => {
          const boardgame = (g.boardgame?.name ? g.boardgame : bgMap[g.boardgame_id]) || g.boardgame || {}
          const host = (g.host?.nickname || g.host?.name)
            ? g.host
            : (userMap[g.host_user_id] || null)
          let users = g.users || []
          if (users.length === 0) {
            try {
              const r = await fetch(`${API}/games/${g.id}/users`, { headers: authHeaders })
              if (r.ok) {
                const ud = await r.json()
                users = Array.isArray(ud) ? ud : (ud.data||[])
              }
            } catch {}
          }
          return { ...g, boardgame, host, users, users_count: users.length }
        })
      )
      setGames(gamesWithUsers)
    } catch(e) { setError(e.message) }
    setLoading(false)
  }, [id])

  useEffect(() => { loadAll() }, [loadAll])

  async function joinSession() {
    setJoinBusy(true)
    const res = await fetch(`${API}/zassessions/${id}/join`, { method:'POST', headers: authHeaders })
    if (res.ok) {
      setSessionMsg('¡Te has apuntado a la sesión!', false)
      loadAll()
    } else {
      const d = await res.json()
      setSessionMsg(d.message || 'Error al apuntarse', true)
    }
    setJoinBusy(false)
  }

  async function leaveSession() {
    if (inActiveGame) {
      setSessionMsg('Estás apuntado a una o más partidas activas. Sal primero de las partidas para poder abandonar la sesión.', true)
      return
    }
    setJoinBusy(true)
    const res = await fetch(`${API}/zassessions/${id}/leave`, { method:'DELETE', headers: authHeaders })
    if (res.ok) {
      setSessionMsg('Te has dado de baja de la sesión', false)
      loadAll()
    } else {
      const d = await res.json()
      setSessionMsg(d.message || 'Error al darse de baja', true)
    }
    setJoinBusy(false)
  }

  async function handleDelete() {
    setDeleting(true)
    const res = await fetch(`${API}/zassessions/${id}`, { method:'DELETE', headers: authHeaders })
    if (res.ok) navigate('/sessions')
    else {
      const d = await res.json()
      setError(d.message || 'Error al eliminar')
      setDeleting(false); setConfirmDel(false)
    }
  }

  const pct     = session ? Math.min(100, Math.round((attendees.length/session.max_users)*100)) : 0
  const fillCls = pct>=100?'full':pct>=80?'almost':''

  if (loading) return (
    <main className="page-layout"><div className="page-container">
      <div className="loading-state" style={{padding:'5rem'}}><div className="spinner"/><span>Cargando sesión...</span></div>
    </div></main>
  )
  if (error && !session) return (
    <main className="page-layout"><div className="page-container">
      <div className="page-error"><span>⚠️</span><p>{error}</p></div>
      <Link to="/sessions" className="btn btn-ghost" style={{marginTop:'1.5rem',display:'inline-flex'}}>← Volver</Link>
    </div></main>
  )

  return (
    <main className="page-layout">
      <div className="page-container page-container-narrow">

        <nav className="breadcrumb">
          <Link to="/sessions" className="breadcrumb-link">Sesiones</Link>
          <span className="breadcrumb-sep">›</span>
          <span className="breadcrumb-current">{session?.name}</span>
        </nav>

        {/* ── SESSION INFO ── */}
        <div className="detail-card" style={{marginBottom:'1.5rem'}}>
          <div className="detail-card-header">
            <div className="detail-title-wrap">
              <h1 className="detail-title">{session?.name}</h1>
              {session?.event_name && <p className="session-list-event" style={{marginTop:'4px'}}>{session.event_name}</p>}
            </div>
          </div>

          <div className="detail-stats-row">
            <div className="detail-stat">
              <div className="detail-stat-icon">📅</div>
              <div className="detail-stat-label">Fecha</div>
              <div className="detail-stat-value" style={{fontSize:'0.82rem',textTransform:'capitalize'}}>{fmtDate(session?.date)}</div>
            </div>
            <div className="detail-stat">
              <div className="detail-stat-icon">🕐</div>
              <div className="detail-stat-label">Horario</div>
              <div className="detail-stat-value">
                {fmtTime(session?.start_time)}{session?.end_time ? ` – ${fmtTime(session.end_time)}` : ''}h
              </div>
            </div>
            <div className="detail-stat">
              <div className="detail-stat-icon">📍</div>
              <div className="detail-stat-label">Lugar</div>
              <div className="detail-stat-value" style={{fontSize:'0.82rem'}}>{session?.direction||'—'}</div>
            </div>
            <div className="detail-stat">
              <div className="detail-stat-icon">👥</div>
              <div className="detail-stat-label">Asistentes</div>
              <div className="detail-stat-value">{attendees.length} / {session?.max_users}</div>
            </div>
          </div>

          {session?.latitude && session?.longitude && (
            <div style={{padding:'0.75rem 1.5rem', borderBottom:'0.5px solid var(--border)'}}>
              <a href={`https://www.google.com/maps?q=${session.latitude},${session.longitude}`}
                target="_blank" rel="noreferrer"
                style={{fontSize:'0.82rem',color:'var(--borgona)',textDecoration:'none',fontWeight:500}}>
                🗺️ Ver en Google Maps →
              </a>
            </div>
          )}

          <div style={{padding:'1rem 1.5rem', borderBottom:'0.5px solid var(--border)'}}>
            <div className="capacity-label">
              <span>Aforo</span><span>{attendees.length} de {session?.max_users} plazas ({pct}%)</span>
            </div>
            <div className="capacity-bar">
              <div className={`capacity-fill ${fillCls}`} style={{width:`${pct}%`}}/>
            </div>
          </div>

          {/* Session-level toast */}
          {sessionMsg.text && (
            <div style={{padding:'0.5rem 1.5rem'}}>
              <Toast msg={sessionMsg} />
            </div>
          )}

          <div className="detail-actions">
            <Link to="/sessions" className="btn btn-ghost">← Volver</Link>
            <div className="detail-actions-right">
              {isAttendee ? (
                <button
                  className="btn btn-ghost"
                  onClick={leaveSession}
                  disabled={joinBusy}
                  title={inActiveGame ? 'Sal primero de tus partidas activas' : undefined}
                >
                  {joinBusy ? '...' : '— Darme de baja'}
                </button>
              ) : (
                <button className="btn btn-primary" onClick={joinSession} disabled={joinBusy || sessionFull}>
                  {joinBusy ? '...' : sessionFull ? 'Sesión completa' : '+ Apuntarme'}
                </button>
              )}
              {canCreate && (
                <Link to={`/sessions/${id}/games/new`} className="btn btn-primary">
                  🎲 Crear partida
                </Link>
              )}
              {canManage && (
                <Link to={`/sessions/${id}/edit`} className="btn btn-ghost">✏ Editar</Link>
              )}
              {canManage && !confirmDel && (
                <button className="btn btn-delete" onClick={()=>setConfirmDel(true)}>🗑 Borrar</button>
              )}
              {confirmDel && (
                <div className="confirm-delete-wrap">
                  <span className="confirm-delete-text">¿Borrar la sesión <strong>{session?.name}</strong>?</span>
                  <button className="btn btn-delete" onClick={handleDelete} disabled={deleting}>
                    {deleting ? 'Borrando...' : 'Sí, borrar'}
                  </button>
                  <button className="btn btn-ghost" onClick={()=>setConfirmDel(false)} disabled={deleting}>Cancelar</button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── ATTENDEES ── */}
        <div className="detail-card" style={{marginBottom:'1.5rem'}}>
          <div className="section-header">
            <span className="section-label">Asistentes confirmados</span>
            <span className="section-count">{attendees.length} persona{attendees.length!==1?'s':''}</span>
          </div>
          {attendees.length===0 ? (
            <div className="empty-state" style={{padding:'2rem'}}>
              <span className="empty-icon">👥</span>
              <p>Nadie apuntado todavía. ¡Sé el primero!</p>
            </div>
          ) : (
            <ul className="attendees-list">
              {attendees.map((u,i) => (
                <li key={u.id} className="attendee-item">
                  <span className="attendee-num">{i+1}</span>
                  <div className="attendee-avatar" style={{background:avatarColor(u.nickname||u.name)}}>
                    {initials(u.nickname,u.name)}
                  </div>
                  <div className="attendee-info">
                    <span className="attendee-name">{u.nickname||u.name}</span>
                    {u.nickname&&u.name&&u.name!==u.nickname&&<span className="attendee-nick">{u.name}</span>}
                  </div>
                  {u.type&&<span className={`badge badge-sm ${ROLE_BADGE[u.type]||'badge-blue'}`}>{ROLE_LABELS[u.type]||u.type}</span>}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* ── GAMES ── */}
        <div className="detail-card">
          <div className="section-header">
            <span className="section-label">Partidas de la sesión</span>
            <span className="section-count">{games.length} partida{games.length!==1?'s':''}</span>
          </div>
          {games.length===0 ? (
            <div className="empty-state" style={{padding:'2rem'}}>
              <span className="empty-icon">🎲</span>
              <p>No hay partidas creadas para esta sesión todavía</p>
              {canCreate && (
                <Link to={`/sessions/${id}/games/new`} className="btn btn-primary" style={{marginTop:'1rem'}}>
                  Crear la primera partida
                </Link>
              )}
            </div>
          ) : (
            <div style={{padding:'0.75rem', display:'grid', gap:'0.5rem'}}>
              {games.map(g => (
                <GameRow
                  key={g.id}
                  game={g}
                  authUser={authUser}
                  authHeaders={authHeaders}
                  API={API}
                  sessionId={id}
                  isSessionAttendee={isAttendee}
                  sessionFull={sessionFull}
                  onRefresh={loadAll}
                  onSessionMsg={setSessionMsg}
                />
              ))}
            </div>
          )}
        </div>

      </div>
    </main>
  )
}
