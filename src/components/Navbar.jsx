import { useAuth } from '../context/AuthContext'
import logoImg from '../assets/logo.png'

const ROLE_LABELS = { admin: 'Admin', junta: 'Junta', partner: 'Socio', guest: 'Invitado' }
const ROLE_BADGE  = { admin: 'badge-red', junta: 'badge-amber', partner: 'badge-green', guest: 'badge-blue' }

function initials(str) {
  if (!str) return '?'
  return str.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

export default function Navbar({ onLoginClick }) {
  const { user, logout } = useAuth()

  return (
    <nav className="navbar">
      <div className="navbar-inner">

        <div className="navbar-logo">
          <img src={logoImg} alt="ZasBoard logo" />
          <div className="logo-text">
            <span className="logo-name">ZasBoard</span>
            <span className="logo-sub">Club de Juegos de Mesa</span>
          </div>
        </div>

        <div className="navbar-right">
          {user ? (
            <>
              <div className="user-info">
                <div
                  className="user-avatar-sm"
                  data-initials={initials(user.nickname || user.name || user.email)}
                />
                <span className="user-display-name">
                  {user.nickname || user.name || user.email}
                </span>
                {user.type && (
                  <span className={`badge ${ROLE_BADGE[user.type] || 'badge-blue'}`}>
                    {ROLE_LABELS[user.type] || user.type}
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
