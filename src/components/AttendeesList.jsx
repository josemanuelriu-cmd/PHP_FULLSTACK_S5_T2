import { avatarColor, initials, ROLE_LABELS, ROLE_BADGE } from '../utils/helpers'

export default function AttendeesList({ users, loading, session }) {
  if (!session) return null

  return (
    <div className="section-card">
      <div className="section-header">
        <span className="section-label">Asistentes confirmados</span>
        <span className="section-count">
          {users.length} persona{users.length !== 1 ? 's' : ''}
          {session.max_users ? ` de ${session.max_users}` : ''}
        </span>
      </div>

      {loading ? (
        <div className="loading-state">
          <div className="spinner" /><span>Cargando asistentes...</span>
        </div>
      ) : users.length > 0 ? (
        <ul className="attendees-list">
          {users.map((u, i) => (
            <li key={u.id || i} className="attendee-item">
              <span className="attendee-num">{i + 1}</span>

              <div
                className="attendee-avatar"
                style={{ background: avatarColor(u.nickname || u.name) }}
                title={u.name}
              >
                {initials(u.nickname, u.name)}
              </div>

              <div className="attendee-info">
                <span className="attendee-name">
                  {u.nickname || u.name}
                </span>
                {u.nickname && u.name && u.name !== u.nickname && (
                  <span className="attendee-nick">{u.name}</span>
                )}
              </div>

              {u.type && (
                <span className={`badge badge-sm ${ROLE_BADGE[u.type] || 'badge-blue'}`}>
                  {ROLE_LABELS[u.type] || u.type}
                </span>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <div className="empty-state">
          <span className="empty-icon">👥</span>
          <p>Nadie apuntado todavía. ¡Sé el primero!</p>
        </div>
      )}
    </div>
  )
}
