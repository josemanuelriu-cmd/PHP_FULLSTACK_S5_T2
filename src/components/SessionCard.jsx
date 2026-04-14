function fmtDate(d) {
  if (!d) return '—'
  try {
    return new Date(d).toLocaleDateString('es-ES', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    })
  } catch { return d }
}
function fmtTime(d) {
  if (!d) return ''
  try {
    return new Date(d).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
  } catch { return '' }
}

export default function SessionCard({ session, loading, userCount, error }) {
  if (loading) return (
    <div className="section-card">
      <div className="section-header">
        <span className="section-label">Próxima sesión</span>
      </div>
      <div className="loading-state">
        <div className="spinner" />
        <span>Cargando sesión...</span>
      </div>
    </div>
  )

  if (error) return (
    <div className="section-card">
      <div className="section-header"><span className="section-label">Próxima sesión</span></div>
      <div className="empty-state">
        <span className="empty-icon">⚠</span>
        <p>{error}</p>
      </div>
    </div>
  )

  const dateField = session?.date || session?.starts_at || session?.start_date || session?.scheduled_at
  const place = session?.location || session?.place || session?.venue || 'Por confirmar'
  const capacity = session?.max_users || session?.capacity || session?.max_players

  return (
    <div className="section-card session-card-featured">
      <div className="section-header">
        <span className="section-label">Próxima sesión</span>
        {session && <span className="badge badge-green">● Confirmada</span>}
      </div>

      {session ? (
        <div className="session-detail">
          <div className="session-date-big">
            {fmtDate(dateField)}
            {fmtTime(dateField) && <span className="session-time">{fmtTime(dateField)}h</span>}
          </div>

          <div className="session-meta-grid">
            <div className="session-meta-item">
              <span className="meta-icon">📍</span>
              <div>
                <div className="meta-label">Lugar</div>
                <div className="meta-value">{place}</div>
              </div>
            </div>
            <div className="session-meta-item">
              <span className="meta-icon">👥</span>
              <div>
                <div className="meta-label">Asistentes</div>
                <div className="meta-value">
                  {userCount}
                  {capacity ? <span className="meta-cap"> / {capacity}</span> : ''}
                </div>
              </div>
            </div>
            {session.description && (
              <div className="session-meta-item session-meta-full">
                <span className="meta-icon">📝</span>
                <div>
                  <div className="meta-label">Notas</div>
                  <div className="meta-value meta-desc">{session.description}</div>
                </div>
              </div>
            )}
          </div>

          {capacity && (
            <div className="capacity-bar-wrap">
              <div className="capacity-label">
                <span>Aforo</span>
                <span>{userCount} de {capacity} plazas</span>
              </div>
              <div className="capacity-bar">
                <div
                  className="capacity-fill"
                  style={{ width: `${Math.min(100, (userCount / capacity) * 100)}%` }}
                />
              </div>
            </div>
          )}
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
