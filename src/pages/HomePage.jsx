console.log("HomePage renderizando");

import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import SessionCard from '../components/SessionCard'
import AttendeesList from '../components/AttendeesList'
import GamesList from '../components/GamesList'

if (!useAuth) {
  console.log("useAuth no existe");
}

export default function HomePage() {
  const { token, authHeaders, API, setShowLogin } = useAuth()
  const [session, setSession] = useState(null)
  const [sessionUsers, setSessionUsers] = useState([])
  const [sessionGames, setSessionGames] = useState([])
  const [loadingSession, setLoadingSession] = useState(false)
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [loadingGames, setLoadingGames] = useState(false)
  const [error, setError] = useState('')

  async function loadNextSession() {
    setLoadingSession(true); setError('')
    try {
      const res = await fetch(`${API}/zassessions`, { headers: authHeaders })
      if (!res.ok) throw new Error('Error al cargar sesiones')
      const data = await res.json()
      const sessions = Array.isArray(data) ? data : (data.data || [])
      const now = new Date()
      const getDate = s => new Date(s.date || s.starts_at || s.start_date || s.scheduled_at || 0)
      const upcoming = sessions
        .filter(s => getDate(s) >= now)
        .sort((a, b) => getDate(a) - getDate(b))
      const next = upcoming[0] || sessions[sessions.length - 1] || null
      setSession(next)
      if (next) {
        loadSessionUsers(next.id)
        loadSessionGames(next.id)
      }
    } catch (e) {
      setError(e.message)
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
      const users = Array.isArray(data) ? data : (data.data || [])
      setSessionUsers(users.slice(0, 15))
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
      const games = Array.isArray(data) ? data : (data.data || [])
      setSessionGames(games)
    } catch {
      setSessionGames([])
    }
    setLoadingGames(false)
  }

  /*
  useEffect(() => {
    if (token) loadNextSession()
  }, [token])
  */
  useEffect(() => {
    loadNextSession()
  }, [])
  return (
    <main className="main-layout">

      {/* ── HERO ── */}
      <section className="hero">
        <div className="hero-content">
          <div className="hero-eyebrow">
            <span className="eyebrow-dot" />
            Club de juegos de mesa · Barcelona
          </div>
          <h1 className="hero-title">
            Donde las mejores<br />
            <em>partidas</em> te esperan
          </h1>
          <p className="hero-body">
            Somos una comunidad apasionada por los juegos de mesa. Nos reunimos
            periódicamente para jugar, aprender nuevos juegos y crear recuerdos
            inolvidables alrededor de una mesa.
          </p>
          <div className="hero-cta">
            {token ? (
              <button className="btn btn-primary" onClick={loadNextSession}>
                Actualizar sesión ↻
              </button>
            ) : (
              <>
                <button className="btn btn-primary" onClick={() => setShowLogin(true)}>
                  Unirse al club →
                </button>
                <button className="btn btn-ghost" onClick={() => setShowLogin(true)}>
                  Ya tengo cuenta
                </button>
              </>
            )}
          </div>
        </div>
        <div className="hero-visual" aria-hidden="true">
          <div className="hex-grid">
            {['♟','⬡','🎲','♜','⬡','🃏','⬡','♞','⬡'].map((s, i) => (
              <div key={i} className="hex-cell" style={{ '--i': i }}>{s}</div>
            ))}
          </div>
        </div>
      </section>

      {/* ── STATS STRIP ── */}
      <div className="stats-strip">
        {[
          { label: 'Socios activos', value: '47' },
          { label: 'Juegos en catálogo', value: '120+' },
          { label: 'Sesiones celebradas', value: '38' },
          { label: 'Partidas jugadas', value: '500+' },
        ].map(s => (
          <div key={s.label} className="stat-item">
            <span className="stat-value">{s.value}</span>
            <span className="stat-label">{s.label}</span>
          </div>
        ))}
      </div>

      {/* ── CONTENT AREA ── */}
      <div className="content-area">
        {!token ? (
          <div className="locked-state">
            <div className="lock-icon">⬡</div>
            <h3>Contenido exclusivo para miembros</h3>
            <p>Inicia sesión para ver la próxima sesión, los asistentes confirmados y las partidas programadas.</p>
            <button className="btn btn-primary" onClick={() => setShowLogin(true)}>
              Acceder al club
            </button>
          </div>
        ) : (
          <div className="sections-grid">

            <SessionCard
              session={session}
              loading={loadingSession}
              userCount={sessionUsers.length}
              error={error}
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
