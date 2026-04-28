import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { fmtDate, fmtTime, isToday, isPast } from '../utils/helpers'

function SessionCard({ session }) {
  const past = isPast(session.date)
  const today = isToday(session.date)

  return (
    <div className={`session-list-card ${past ? 'session-list-card-past' : ''}`}>
      <div className="session-list-card-top">
        <div className="session-list-date">
          <span className="session-list-day">
            {session.date ? session.date.split('-')[2] : '—'}
          </span>
          <span className="session-list-month">
            {session.date
              ? new Date(session.date + 'T00:00:00').toLocaleDateString('es-ES', { month: 'short' }).replace('.', '')
              : ''}
          </span>
        </div>
        <div className="session-list-info">
          <h3 className="session-list-name">{session.name}</h3>
          {session.event_name && (
            <p className="session-list-event">{session.event_name}</p>
          )}
          <div className="session-list-meta">
            {session.start_time && (
              <span className="session-meta-chip">
                🕐 {fmtTime(session.start_time)}{session.end_time ? ` – ${fmtTime(session.end_time)}` : ''}h
              </span>
            )}
            {session.direction && (
              <span className="session-meta-chip">📍 {session.direction}</span>
            )}
            <span className="session-meta-chip">👥 Máx. {session.max_users}</span>
          </div>
        </div>
        <div className="session-list-badges">
          {today && <span className="badge badge-green">Hoy</span>}
          {past  && <span className="badge badge-amber" style={{opacity:0.7}}>Pasada</span>}
        </div>
      </div>
      <div className="session-list-card-footer">
        <Link to={`/sessions/${session.id}`} className="game-card-link">
          Ver sesión →
        </Link>
      </div>
    </div>
  )
}

export default function SessionsPage() {
  const { authHeaders, API, user } = useAuth()

  const [sessions,   setSessions]   = useState([])
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState('')
  const [showPast,   setShowPast]   = useState(false)

  const canManage = user?.type === 'admin' || user?.type === 'junta'

  useEffect(() => {
    async function load() {
      setLoading(true); setError('')
      try {
        const res  = await fetch(`${API}/zassessions`, { headers: authHeaders })
        if (!res.ok) throw new Error('No se pudieron cargar las sesiones')
        const data = await res.json()
        setSessions(Array.isArray(data) ? data : (data.data || []))
      } catch (e) { setError(e.message) }
      setLoading(false)
    }
    load()
  }, [])

  const filtered = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return sessions
      .filter(s => {
        if (!s.date) return true
        const [y, m, d] = s.date.split('-').map(Number)
        const sd = new Date(y, m - 1, d)
        return showPast ? true : sd >= today
      })
      .sort((a, b) => {
        if (!a.date) return 1
        if (!b.date) return -1
        return showPast
          ? new Date(b.date) - new Date(a.date)   // past: descending
          : new Date(a.date) - new Date(b.date)    // future: ascending
      })
  }, [sessions, showPast])

  const futureCount = useMemo(() => {
    const today = new Date(); today.setHours(0,0,0,0)
    return sessions.filter(s => {
      if (!s.date) return false
      const [y,m,d] = s.date.split('-').map(Number)
      return new Date(y, m-1, d) >= today
    }).length
  }, [sessions])

  return (
    <main className="page-layout">
      <div className="page-container">

        <div className="page-header">
          <div>
            <p className="page-eyebrow">Club</p>
            <h1 className="page-title">Sesiones</h1>
            <p className="page-subtitle">
              {futureCount} sesión{futureCount !== 1 ? 'es' : ''} próxima{futureCount !== 1 ? 's' : ''}
              {' '}· {sessions.length} en total
            </p>
          </div>
          {canManage && (
            <Link to="/sessions/new" className="btn btn-primary">
              + Nueva sesión
            </Link>
          )}
        </div>

        {/* Toggle past sessions */}
        <div className="sessions-toggle-row">
          <label className="toggle-label">
            <input
              type="checkbox"
              className="toggle-checkbox"
              checked={showPast}
              onChange={e => setShowPast(e.target.checked)}
            />
            <span className="toggle-custom" />
            <span className="toggle-text">Mostrar sesiones pasadas</span>
          </label>
        </div>

        {loading ? (
          <div className="loading-state" style={{ padding: '4rem' }}>
            <div className="spinner" /><span>Cargando sesiones...</span>
          </div>
        ) : error ? (
          <div className="page-error"><span>⚠️</span><p>{error}</p></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state" style={{ padding: '4rem' }}>
            <span className="empty-icon">📅</span>
            <p>{showPast ? 'No hay sesiones registradas' : 'No hay sesiones próximas programadas'}</p>
          </div>
        ) : (
          <div className="sessions-list">
            {filtered.map(s => <SessionCard key={s.id} session={s} />)}
          </div>
        )}

      </div>
    </main>
  )
}
