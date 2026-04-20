import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import logoImg from '../assets/logo.png'

const ROLE_LABELS = { admin: 'Admin', junta: 'Junta', partner: 'Socio', guest: 'Invitado' }
const ROLE_BADGE  = { admin: 'badge-red', junta: 'badge-amber', partner: 'badge-green', guest: 'badge-blue' }

function initials(str) {
  if (!str) return '?'
  return str.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

const AUTH_LINKS = [
  { label: 'Inicio',         to: '/' },
  { label: 'Juegos de mesa', to: '/boardgames' },
  { label: 'Tipos',          to: '/types' },
  { label: 'Sesiones',       to: '/sessions' },
  { label: 'Perfil',         to: '/profile' },
]

export default function Navbar({ onLoginClick }) {
  const { user, logout } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)

  const linkClass = ({ isActive }) =>
    isActive ? 'nav-link active' : 'nav-link'

  return (
    <nav className="navbar">
      <div className="navbar-inner">

        {/* ── LEFT: logo + title ── */}
        <Link to="/" className="navbar-logo" onClick={() => setMenuOpen(false)}>
          <img src={logoImg} alt="ZAS! logo" />
          <div className="logo-text">
            <span className="logo-name">ZAS!</span>
            <span className="logo-sub">Juegos de mesa y rol</span>
          </div>
        </Link>

        {/* ── CENTER: nav links (only when logged in) ── */}
        {user && (
          <ul className="nav-links">
            {AUTH_LINKS.map(({ label, to }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  className={linkClass}
                  end={to === '/'}
                  onClick={() => setMenuOpen(false)}
                >
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>
        )}

        {/* ── RIGHT: user info / login ── */}
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
            <button className="btn btn-primary" onClick={onLoginClick}>
              Iniciar sesión
            </button>
          )}

          {/* Hamburger — mobile only, only when logged in */}
          {user && (
            <button
              className="hamburger"
              onClick={() => setMenuOpen(o => !o)}
              aria-label="Abrir menú"
            >
              <span className="ham-bar" />
              <span className="ham-bar" />
              <span className="ham-bar" />
            </button>
          )}
        </div>
      </div>

      {/* ── MOBILE DROPDOWN ── */}
      {user && menuOpen && (
        <div className="nav-mobile-menu">
          {AUTH_LINKS.map(({ label, to }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                isActive ? 'nav-mobile-link active' : 'nav-mobile-link'
              }
              onClick={() => setMenuOpen(false)}
            >
              {label}
            </NavLink>
          ))}
          <div className="nav-mobile-divider" />
          <button
            className="nav-mobile-link nav-mobile-logout"
            onClick={() => { logout(); setMenuOpen(false) }}
          >
            Salir
          </button>
        </div>
      )}
    </nav>
  )
}
