import { useAuth } from '../context/AuthContext'

const ROLE_LABELS = { admin: 'Admin', junta: 'Junta', partner: 'Socio', guest: 'Invitado' }
const ROLE_COLORS = { admin: 'badge-red', junta: 'badge-amber', partner: 'badge-green', guest: 'badge-blue' }

export default function Navbar({ onLoginClick }) {
  const { user, logout } = useAuth()

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <div className="navbar-logo">
          <span className="logo-zas">Zas</span>
          <span className="logo-board">Board</span>
          <span className="logo-dice">⬡</span>
        </div>

        <div className="navbar-right">
          {user ? (
            <>
              <div className="user-info">
                <div className="user-avatar-sm" data-initials={initials(user.name || user.email)} />
                <span className="user-display-name">{user.name || user.email}</span>
                {user.role && (
                  <span className={`badge ${ROLE_COLORS[user.role] || 'badge-blue'}`}>
                    {ROLE_LABELS[user.role] || user.role}
                  </span>
                )}
              </div>
              <button className="btn btn-ghost" onClick={logout}>Salir</button>
            </>
          ) : (
            <>
              <button className="btn btn-ghost" onClick={onLoginClick}>Iniciar sesión</button>
              <button className="btn btn-primary" onClick={onLoginClick}>Unirse al club →</button>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}

function initials(name) {
  if (!name) return '?'
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}
