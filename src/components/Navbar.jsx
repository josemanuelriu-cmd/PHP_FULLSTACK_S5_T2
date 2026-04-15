import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import logoImg from '../assets/logo.png'

const ROLE_LABELS = { admin: 'Admin', junta: 'Junta', partner: 'Socio', guest: 'Invitado' }
const ROLE_BADGE  = { admin: 'badge-red', junta: 'badge-amber', partner: 'badge-green', guest: 'badge-blue' }

function initials(str) {
  if (!str) return '?'
  return str.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

// Placeholder click handler until pages are built
function navLink(label, href = '#') {
  return { label, href }
}

const AUTH_LINKS = [
  navLink('Inicio',             '/'),
  navLink('Juegos de mesa',     '/boardgames'),
  navLink('Tipos',              '/types'),
  navLink('Sesiones',           '/sessions'),
  navLink('Perfil',             '/profile'),
  navLink('Cambiar contraseña', '/change-password'),
]

export default function Navbar({ onLoginClick }) {
  const { user, logout } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)

  function handleNavClick(e, href) {
    // Pages not built yet — prevent navigation, will be wired later
    if (href !== '/') {
      e.preventDefault()
    }
    setMenuOpen(false)
  }

  return (
    <nav className="navbar">
      <div className="navbar-inner">

        {/* ── LEFT: logo + title ── */}
        <a href="/" className="navbar-logo" onClick={e => handleNavClick(e, '/')}>
          <img src={logoImg} alt="ZAS! logo" />
          <div className="logo-text">
            <span className="logo-name">ZAS!</span>
            <span className="logo-sub">Juegos de mesa y rol</span>
          </div>
        </a>

        {/* ── CENTER: nav links (logged in) ── */}
        {user && (
          <ul className="nav-links">
            {AUTH_LINKS.map(({ label, href }) => (
              <li key={label}>
                <a
                  href={href}
                  className="nav-link"
                  onClick={e => handleNavClick(e, href)}
                >
                  {label}
                </a>
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

          {/* Hamburger (mobile, only when logged in) */}
          {user && (
            <button
              className="hamburger"
              onClick={() => setMenuOpen(o => !o)}
              aria-label="Menú"
            >
              <span className={`ham-bar ${menuOpen ? 'open' : ''}`} />
              <span className={`ham-bar ${menuOpen ? 'open' : ''}`} />
              <span className={`ham-bar ${menuOpen ? 'open' : ''}`} />
            </button>
          )}
        </div>
      </div>

      {/* ── MOBILE DROPDOWN ── */}
      {user && menuOpen && (
        <div className="nav-mobile-menu">
          {AUTH_LINKS.map(({ label, href }) => (
            <a
              key={label}
              href={href}
              className="nav-mobile-link"
              onClick={e => handleNavClick(e, href)}
            >
              {label}
            </a>
          ))}
          <div className="nav-mobile-divider" />
          <button className="nav-mobile-link nav-mobile-logout" onClick={() => { logout(); setMenuOpen(false) }}>
            Salir
          </button>
        </div>
      )}
    </nav>
  )
}
