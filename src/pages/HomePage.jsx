import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import SessionCard from '../components/SessionCard'
import AttendeesList from '../components/AttendeesList'
import GamesList from '../components/GamesList'
import logoImg from '../assets/logo.png'

export default function HomePage({ onLoginClick }) {
  const { token, authHeaders, API } = useAuth()

  const [session,      setSession]      = useState(null)
  const [sessionUsers, setSessionUsers] = useState([])
  const [sessionGames, setSessionGames] = useState([])
  const [loadingSession, setLoadingSession] = useState(false)
  const [loadingUsers,   setLoadingUsers]   = useState(false)
  const [loadingGames,   setLoadingGames]   = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  async function loadNextSession() {
    setLoadingSession(true); setErrorMsg('')
    try {
      const res = await fetch(`${API}/zassessions`, { headers: authHeaders })
      if (!res.ok) throw new Error('No se pudieron cargar las sesiones')
      const data = await res.json()
      const list = Array.isArray(data) ? data : (data.data || [])

      // Find the next upcoming session by date field
      const now = new Date()
      now.setHours(0, 0, 0, 0)
      const upcoming = list
        .filter(s => s.date && new Date(s.date) >= now)
        .sort((a, b) => new Date(a.date) - new Date(b.date))

      const next = upcoming[0] || list[list.length - 1] || null
      setSession(next)

      if (next) {
        loadSessionUsers(next.id)
        loadSessionGames(next.id)
      }
    } catch (e) {
      setErrorMsg(e.message)
      setSession(null)
    }
    setLoadingSession(false)
  }

  async function loadSessionUsers(id) {
    setLoadingUsers(true)
    try {
      const res = await fetch(`${API}/zassessions/${id}/users`, { headers: authHeaders })
      if (!res.ok) throw new Error()
      const data = await res.json()
      const list = Array.isArray(data) ? data : (data.data || [])
      setSessionUsers(list.slice(0, 15))
    } catch {
      setSessionUsers([])
    }
    setLoadingUsers(false)
  }

  async function loadSessionGames(id) {
    setLoadingGames(true)
    try {
      const res = await fetch(`${API}/zassessions/${id}/games`, { headers: authHeaders })
      if (!res.ok) throw new Error()
      const data = await res.json()
      const list = Array.isArray(data) ? data : (data.data || [])
      setSessionGames(list)
    } catch {
      setSessionGames([])
    }
    setLoadingGames(false)
  }

  useEffect(() => {
    if (token) loadNextSession()
  }, [token])

  return (
    <main className="main-layout">

      {/* ── HERO ── */}
      <section className="hero">
        <div className="hero-content">
          <div className="hero-eyebrow">
            <span className="eyebrow-line" />
            Club de Juegos de Mesa
          </div>
          <h1 className="hero-title">
            Donde cada partida<br />
            es una <em>aventura</em>
          </h1>
          <p className="hero-body">
            Somos una comunidad apasionada por los juegos de mesa. Nos reunimos
            periódicamente para jugar, descubrir nuevos títulos y crear partidas
            inolvidables. ¿Te unes?
          </p>
          <div className="hero-cta">
            {token ? (
              <button className="btn btn-primary" onClick={loadNextSession}>
                Actualizar sesión ↻
              </button>
            ) : (
              <>
                <button className="btn btn-primary" onClick={onLoginClick}>
                  Unirse al club →
                </button>
                <button className="btn btn-ghost" onClick={onLoginClick}>
                  Ya tengo cuenta
                </button>
              </>
            )}
          </div>
        </div>

        {/* Logo panel */}
        <div className="hero-logo-panel">
          <div className="hero-logo-wrap">
            <img src={logoImg} alt="Logo del club" />
          </div>
          <p className="hero-club-tagline">Juego · Estrategia · Comunidad</p>
        </div>
      </section>

      {/* ── STATS STRIP ── */}
      <div className="stats-strip">
        {[
          { label: 'Socios activos',      value: '47'   },
          { label: 'Juegos en catálogo',  value: '120+' },
          { label: 'Sesiones celebradas', value: '38'   },
          { label: 'Partidas jugadas',    value: '500+' },
        ].map(s => (
          <div key={s.label} className="stat-item">
            <span className="stat-value">{s.value}</span>
            <span className="stat-label">{s.label}</span>
          </div>
        ))}
      </div>

      {/* ── CONTENT ── */}
      <div className="content-area">
        {!token ? (
          <div className="locked-state">
            <div className="lock-icon">🔒</div>
            <h3>Contenido exclusivo para miembros</h3>
            <p>
              Inicia sesión para ver la próxima sesión, los asistentes confirmados
              y las partidas programadas.
            </p>
            <button className="btn btn-primary" onClick={onLoginClick}>
              Acceder al club
            </button>
          </div>
        ) : (
          <div className="sections-grid">
            <SessionCard
              session={session}
              loading={loadingSession}
              userCount={sessionUsers.length}
              error={errorMsg}
            />
            <AttendeesList
              users={sessionUsers}
              loading={loadingUsers}
              session={session}
            />
            <GamesList
              games={sessionGames}
              loading={loadingGames}
              session={session}
            />
          </div>
        )}
      </div>

    </main>
  )
}
