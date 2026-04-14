const ROLE_LABELS = { admin: 'Admin', junta: 'Junta', partner: 'Socio', guest: 'Invitado' }
const ROLE_BADGE = { admin: 'badge-red', junta: 'badge-amber', partner: 'badge-green', guest: 'badge-blue' }
const PALETTE = ['#c9893a', '#4caf7d', '#5b9fd4', '#b06fdc', '#e05a4a', '#44a4a0']

function initials(name) {
  if (!name) return '?'
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}
function avatarColor(name) {
  let h = 0
  for (const c of (name || '')) h = (h * 31 + c.charCodeAt(0)) % PALETTE.length
  return PALETTE[h]
}

export default function AttendeesList({ users, loading, session }) {
  if (!session) return null

  return (
    <div className="section-card">
      <div className="section-header">
        <span className="section-label">Asistentes confirmados</span>
        <span className="section-count">{users.length} persona{users.length !== 1 ? 's' : ''}</span>
      </div>

      {loading ? (
        <div className="loading-state">
          <div className="spinner" />
          <span>Cargando asistentes...</span>
        </div>
      ) : users.length > 0 ? (
        <ul className="attendees-list">
          {users.map((u, i) => (
            <li key={u.id || i} className="attendee-item">
              <div className="attendee-num">{i + 1}</div>
              <div
                className="attendee-avatar"
                style={{ background: avatarColor(u.name || u.email) }}
              >
                {initials(u.name || u.email)}
              </div>
              <div className="attendee-info">
                <span className="attendee-name">{u.name || u.email}</span>
                {u.role && (
                  <span className={`badge badge-sm ${ROLE_BADGE[u.role] || 'badge-blue'}`}>
                    {ROLE_LABELS[u.role] || u.role}
                  </span>
                )}
              </div>
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
