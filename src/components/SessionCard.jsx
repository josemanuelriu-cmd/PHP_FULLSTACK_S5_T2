// Real DB fields: id, name, event_name, date, start_time, end_time, max_users, direction, latitude, longitude

function fmtDate(dateStr) {
  if (!dateStr) return '—'
  try {
    // date is stored as DATE (e.g. "2025-06-14")
    const [y, m, d] = dateStr.split('-').map(Number)
    const dt = new Date(y, m - 1, d)
    return dt.toLocaleDateString('es-ES', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    })
  } catch { return dateStr }
}

function fmtTime(timeStr) {
  // time stored as TIME (e.g. "18:30:00")
  if (!timeStr) return ''
  return timeStr.slice(0, 5) // "18:30"
}

export default function SessionCard({ session, loading, userCount, error }) {

  if (loading) return (
    <div className="section-card accent-border">
      <div className="section-header"><span className="section-label">Próxima sesión</span></div>
      <div className="loading-state"><div className="spinner" /><span>Cargando sesión...</span></div>
    </div>
  )

  if (error) return (
    <div className="section-card accent-border">
      <div className="section-header"><span className="section-label">Próxima sesión</span></div>
      <div className="empty-state">
        <span className="empty-icon">⚠️</span>
        <p>{error}</p>
      </div>
    </div>
  )

  const pct    = session ? Math.min(100, Math.round((userCount / session.max_users) * 100)) : 0
  const fillCls = pct >= 100 ? 'full' : pct >= 80 ? 'almost' : ''

  return (
    <div className="section-card accent-border">
      <div className="section-header">
        <span className="section-label">Próxima sesión</span>
        {session && (
          <span className="badge badge-green">● Confirmada</span>
        )}
      </div>

      {session ? (
        <div className="session-detail">

          {/* Name */}
          <div className="session-name">{session.name}</div>
          {session.event_name && (
            <div className="session-event">{session.event_name}</div>
          )}

          {/* Date + time */}
          <div className="session-date-row">
            <span className="session-date-icon">📅</span>
            <span className="session-date-text">{fmtDate(session.date)}</span>
            {session.start_time && (
              <span className="session-time-badge">
                {fmtTime(session.start_time)}
                {session.end_time ? ` – ${fmtTime(session.end_time)}` : ''}
                h
              </span>
            )}
          </div>

          {/* Meta grid */}
          <div className="session-meta-grid">
            <div className="session-meta-item">
              <span className="meta-icon">📍</span>
              <div>
                <div className="meta-label">Dirección</div>
                <div className="meta-value">{session.direction || '—'}</div>
              </div>
            </div>

            <div className="session-meta-item">
              <span className="meta-icon">👥</span>
              <div>
                <div className="meta-label">Asistentes</div>
                <div className="meta-value">
                  {userCount}
                  <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>
                    {' '}/ {session.max_users}
                  </span>
                </div>
              </div>
            </div>

            {/* Google Maps link if coords available */}
            {session.latitude && session.longitude && (
              <div className="session-meta-item session-meta-full">
                <span className="meta-icon">🗺️</span>
                <div>
                  <div className="meta-label">Ubicación</div>
                  <a
                    href={`https://www.google.com/maps?q=${session.latitude},${session.longitude}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{ fontSize: '0.82rem', color: 'var(--borgona)', textDecoration: 'none', fontWeight: 500 }}
                  >
                    Ver en Google Maps →
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Capacity bar */}
          <div className="capacity-bar-wrap">
            <div className="capacity-label">
              <span>Aforo</span>
              <span>{userCount} de {session.max_users} plazas ({pct}%)</span>
            </div>
            <div className="capacity-bar">
              <div className={`capacity-fill ${fillCls}`} style={{ width: `${pct}%` }} />
            </div>
          </div>

        </div>
      ) : (
        <div className="empty-state">
          <span className="empty-icon">📅</span>
          <p>No hay sesiones próximas programadas</p>
        </div>
      )}
    </div>
  )
}
