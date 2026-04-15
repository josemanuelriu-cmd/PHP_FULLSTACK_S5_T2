// Real game fields: id, zassession_id, boardgame_id, host_user_id, max_players,
//                   start_time, status (open|limited|playing|finished), necesary_know_how
// Relations (via eager loading from API): boardgame { name, min_players, max_players, duration }
//                                          host { nickname, name }
//                                          users_count (or users[])

const STATUS_MAP = {
  open:     { label: 'Abierta',   cls: 'status-open' },
  limited:  { label: 'Limitada',  cls: 'status-limited' },
  playing:  { label: 'Jugando',   cls: 'status-playing' },
  finished: { label: 'Terminada', cls: 'status-finished' },
}

const GAME_ICONS = ['♟', '⚔', '🃏', '♜', '🎲', '♞', '🏰', '🗡']

function gameIcon(name) {
  let h = 0
  for (const c of (name || '')) h = (h * 17 + c.charCodeAt(0)) % GAME_ICONS.length
  return GAME_ICONS[h]
}

function fmtTime(t) {
  if (!t) return ''
  return t.slice(0, 5) // "18:30"
}

export default function GamesList({ games, loading, session }) {
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

            // Boardgame info - API should eager-load 'boardgame' relation
            const bg        = g.boardgame || {}
            const gameName  = bg.name || g.game_name || `Partida ${i + 1}`
            const minPl     = bg.min_players || 2
            const maxPl     = g.max_players || bg.max_players || '?'
            const duration  = bg.duration ? `${bg.duration} min` : null

            // Players joined
            const joined = g.users_count ?? g.players_count ?? g.users?.length ?? 0

            // Host - API should eager-load 'host' relation (host_user_id → users)
            const host = g.host?.nickname || g.host?.name || null

            // Status
            const st = STATUS_MAP[g.status] || STATUS_MAP.open

            // Need to know how to play?
            const needsKnow = g.necesary_know_how === 1 || g.necesary_know_how === true

            return (
              <li key={g.id || i} className="game-item">

                <div className="game-icon-wrap">
                  {gameIcon(gameName)}
                </div>

                <div className="game-info">
                  <div className="game-name">{gameName}</div>
                  <div className="game-meta">
                    {host && (
                      <span className="game-meta-item">
                        👤 {host}
                      </span>
                    )}
                    {g.start_time && (
                      <span className="game-meta-item">
                        🕐 {fmtTime(g.start_time)}h
                      </span>
                    )}
                    {duration && (
                      <span className="game-meta-item">
                        ⏱ {duration}
                      </span>
                    )}
                    {needsKnow && (
                      <span className="knowhow-badge">
                        Requiere experiencia
                      </span>
                    )}
                  </div>
                </div>

                <div className="game-right">
                  <div className="game-players">
                    <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                      <circle cx="6" cy="5" r="3" stroke="currentColor" strokeWidth="1.5" />
                      <path d="M1 14c0-2.8 2.2-5 5-5h2c2.8 0 5 2.2 5 5"
                        stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                    {joined}/{maxPl}
                  </div>
                  <span className={`badge badge-sm ${st.cls}`}>
                    {st.label}
                  </span>
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
