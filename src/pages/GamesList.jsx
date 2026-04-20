import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'

// Used on HomePage to show games of the next session, including players per game.

const STATUS_MAP = {
  open:     { label: 'Abierta',   cls: 'status-open' },
  limited:  { label: 'Limitada',  cls: 'status-limited' },
  playing:  { label: 'Jugando',   cls: 'status-playing' },
  finished: { label: 'Terminada', cls: 'status-finished' },
}

const GAME_ICONS = ['♟', '⚔', '🃏', '♜', '🎲', '♞', '🏰', '🗡']
const PALETTE    = ['#800020','#6C63FF','#4aab78','#d4963a','#5a9fd4','#9b59b6']

function gameIcon(name) {
  let h = 0; for (const c of (name||'')) h=(h*17+c.charCodeAt(0))%GAME_ICONS.length; return GAME_ICONS[h]
}
function avatarColor(str) {
  let h = 0; for (const c of (str||'')) h=(h*31+c.charCodeAt(0))%PALETTE.length; return PALETTE[h]
}
function initials(nick, name) {
  const s = nick||name||'?'; return s.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2)
}
function fmtTime(t) { return t ? t.slice(0,5) : '' }

export default function GamesList({ games: gamesFromParent, initialGames, loading, session }) {
  const { authHeaders, API } = useAuth()

  // Support both prop names: 'games' (from HomePage) and 'initialGames'
  const sourceGames = gamesFromParent || initialGames || []

  // Enrich games with boardgame name + users
  const [games, setGames] = useState(sourceGames)

  useEffect(() => {
    if (!sourceGames || sourceGames.length === 0) { setGames([]); return }

    async function enrichGames() {
      // Build a boardgame lookup map: id → boardgame object
      // Only fetch if any game is missing its boardgame name
      const needsBg = sourceGames.some(g => !g.boardgame?.name)
      let bgMap = {}
      if (needsBg) {
        try {
          const res = await fetch(`${API}/boardgames`, { headers: authHeaders })
          if (res.ok) {
            const d    = await res.json()
            const list = Array.isArray(d) ? d : (d.data || [])
            list.forEach(b => { bgMap[b.id] = b })
          }
        } catch {}
      }

      const enriched = await Promise.all(
        sourceGames.map(async g => {
          // Resolve boardgame
          const boardgame = (g.boardgame?.name ? g.boardgame : bgMap[g.boardgame_id]) || g.boardgame || {}

          // Resolve users — fetch if not already present
          let users = g.users || []
          if (users.length === 0) {
            try {
              const res = await fetch(`${API}/games/${g.id}/users`, { headers: authHeaders })
              if (res.ok) {
                const ud = await res.json()
                users = Array.isArray(ud) ? ud : (ud.data || [])
              }
            } catch {}
          }

          return { ...g, boardgame, users, users_count: users.length }
        })
      )
      setGames(enriched)
    }
    enrichGames()
  }, [gamesFromParent, initialGames])

  if (!session) return null

  return (
    <div className="section-card">
      <div className="section-header">
        <span className="section-label">Partidas de la sesión</span>
        <span className="section-count">
          {games.length} partida{games.length !== 1 ? 's' : ''}
        </span>
      </div>

      {loading ? (
        <div className="loading-state">
          <div className="spinner" /><span>Cargando partidas...</span>
        </div>
      ) : games.length > 0 ? (
        <ul className="games-list">
          {games.map((g, i) => {
            const bg       = g.boardgame || {}
            const gameName = bg.name || g.game_name || `Partida ${i + 1}`
            const maxPl    = g.max_players || bg.max_players || '?'
            const joined   = g.users_count ?? g.users?.length ?? 0
            const host     = g.host?.nickname || g.host?.name || null
            const st       = STATUS_MAP[g.status] || STATUS_MAP.open
            const users    = g.users || []
            const needsKnow = g.necesary_know_how === 1 || g.necesary_know_how === true

            return (
              <li key={g.id || i} className="game-item">
                <div className="game-icon-wrap">{gameIcon(gameName)}</div>

                <div className="game-info">
                  <div className="game-name">{gameName}</div>
                  <div className="game-meta">
                    {host       && <span className="game-meta-item">👤 {host}</span>}
                    {g.start_time && <span className="game-meta-item">🕐 {fmtTime(g.start_time)}h</span>}
                    {bg.duration  && <span className="game-meta-item">⏱ {bg.duration} min</span>}
                    {needsKnow    && <span className="knowhow-badge">Requiere experiencia</span>}
                  </div>

                  {/* Player chips */}
                  {users.length > 0 && (
                    <div className="game-players-list" style={{marginTop:'6px'}}>
                      {users.map(u => (
                        <span
                          key={u.id}
                          className="game-player-chip"
                          style={{ background: avatarColor(u.nickname||u.name) }}
                          title={u.nickname || u.name}
                        >
                          {initials(u.nickname, u.name)}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="game-right">
                  <div className="game-players">
                    <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                      <circle cx="6" cy="5" r="3" stroke="currentColor" strokeWidth="1.5"/>
                      <path d="M1 14c0-2.8 2.2-5 5-5h2c2.8 0 5 2.2 5 5"
                        stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                    {joined}/{maxPl}
                  </div>
                  <span className={`badge badge-sm ${st.cls}`}>{st.label}</span>
                </div>
              </li>
            )
          })}
        </ul>
      ) : (
        <div className="empty-state">
          <span className="empty-icon">♟</span>
          <p>No hay partidas creadas para esta sesión todavía</p>
        </div>
      )}
    </div>
  )
}
