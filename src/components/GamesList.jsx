const ICONS = ['♟', '⬡', '🎲', '♜', '🃏', '♞', '🏰', '⚔']

function gameIcon(name) {
  let h = 0
  for (const c of (name || '')) h = (h * 17 + c.charCodeAt(0)) % ICONS.length
  return ICONS[h]
}

export default function GamesList({ games, loading, session }) {
  if (!session) return null

  return (
    <div className="section-card">
      <div className="section-header">
        <span className="section-label">Partidas de la sesión</span>
        <span className="section-count">{games.length} partida{games.length !== 1 ? 's' : ''}</span>
      </div>

      {loading ? (
        <div className="loading-state">
          <div className="spinner" />
          <span>Cargando partidas...</span>
        </div>
      ) : games.length > 0 ? (
        <ul className="games-list">
          {games.map((g, i) => {
            const name = g.boardgame?.name || g.game_name || g.name || `Partida ${i + 1}`
            const players = g.users_count ?? g.players_count ?? g.users?.length ?? 0
            const max = g.max_players || g.boardgame?.max_players || '?'
            const host = g.host?.name || g.creator?.name || g.user?.name || null
            const isOpen = !g.status || g.status === 'open'

            return (
              <li key={g.id || i} className="game-item">
                <div className="game-icon-wrap">
                  {gameIcon(name)}
                </div>
                <div className="game-info">
                  <div className="game-name">{name}</div>
                  {host && <div className="game-host">Organiza: {host}</div>}
                </div>
                <div className="game-right">
                  <div className="game-players">
                    <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                      <circle cx="6" cy="5" r="3" stroke="currentColor" strokeWidth="1.5" />
                      <path d="M1 14c0-2.8 2.2-5 5-5h2c2.8 0 5 2.2 5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                    {players}/{max}
                  </div>
                  <span className={`badge badge-sm ${isOpen ? 'badge-green' : 'badge-amber'}`}>
                    {isOpen ? 'Abierta' : 'Llena'}
                  </span>
                </div>
              </li>
            )
          })}
        </ul>
      ) : (
        <div className="empty-state">
          <span className="empty-icon">🎲</span>
          <p>No hay partidas creadas para esta sesión</p>
        </div>
      )}
    </div>
  )
}
