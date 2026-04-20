import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

// owner_user_id: NULL or 0 → club ZAS, otherwise → user nickname from owner relation

function ownerLabel(game) {
  if (!game.owner_user_id || game.owner_user_id === 0) return 'ZAS!'
  return game.owner?.nickname || game.owner?.name || `Usuario #${game.owner_user_id}`
}

function GameCard({ game }) {
  const types = game.types?.map(t => t.type) || []
  const owner = ownerLabel(game)

  return (
    <div className="game-card">
      <div className="game-card-header">
        <h3 className="game-card-title">{game.name}</h3>
        {types.length > 0 && (
          <div className="game-card-types">
            {types.slice(0, 2).map(t => (
              <span key={t} className="type-pill">{t}</span>
            ))}
            {types.length > 2 && (
              <span className="type-pill type-pill-more">+{types.length - 2}</span>
            )}
          </div>
        )}
      </div>

      <div className="game-card-stats">
        <div className="game-stat">
          <span className="game-stat-icon">👥</span>
          <div>
            <div className="game-stat-label">Jugadores</div>
            <div className="game-stat-value">{game.min_players}–{game.max_players}</div>
          </div>
        </div>
        <div className="game-stat">
          <span className="game-stat-icon">🎂</span>
          <div>
            <div className="game-stat-label">Edad mín.</div>
            <div className="game-stat-value">{game.min_age}+</div>
          </div>
        </div>
        <div className="game-stat">
          <span className="game-stat-icon">⏱</span>
          <div>
            <div className="game-stat-label">Duración</div>
            <div className="game-stat-value">{game.duration} min</div>
          </div>
        </div>
      </div>

      <div className="game-card-owner">
        <span className="owner-dot" />
        Propietario: <strong>{owner}</strong>
      </div>

      <Link to={`/boardgames/${game.id}`} className="game-card-link">
        Ver ficha completa →
      </Link>
    </div>
  )
}

export default function BoardgamesPage() {
  const { authHeaders, API, user } = useAuth()

  const [games,   setGames]   = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState('')

  // Filters
  const [search,      setSearch]      = useState('')
  const [filterType,  setFilterType]  = useState('')
  const [filterMinPl, setFilterMinPl] = useState('')
  const [filterAge,   setFilterAge]   = useState('')
  const [filterDur,   setFilterDur]   = useState('')

  // Available types from API (for filter dropdown)
  const [allTypes, setAllTypes] = useState([])

  const canCreate = user?.type === 'admin' || user?.type === 'junta'

  useEffect(() => {
    async function load() {
      setLoading(true); setError('')
      try {
        const [gamesRes, typesRes, usersRes] = await Promise.all([
          fetch(`${API}/boardgames`, { headers: authHeaders }),
          fetch(`${API}/types`,      { headers: authHeaders }),
          fetch(`${API}/users`,      { headers: authHeaders }),
        ])
        if (!gamesRes.ok) throw new Error('No se pudieron cargar los juegos')

        // Build user lookup map id → user
        let userMap = {}
        if (usersRes.ok) {
          const uData = await usersRes.json()
          const uList = Array.isArray(uData) ? uData : (uData.data || [])
          uList.forEach(u => { userMap[u.id] = u })
        }

        const gData = await gamesRes.json()
        const rawGames = Array.isArray(gData) ? gData : (gData.data || [])
        // Enrich each game with owner from map if not already present
        const enriched = rawGames.map(g => {
          if (g.owner?.nickname || g.owner?.name) return g
          if (!g.owner_user_id || g.owner_user_id === 0) return g
          const owner = userMap[g.owner_user_id] || null
          return owner ? { ...g, owner } : g
        })
        setGames(enriched)

        if (typesRes.ok) {
          const tData = await typesRes.json()
          setAllTypes(Array.isArray(tData) ? tData : (tData.data || []))
        }
      } catch (e) {
        setError(e.message)
      }
      setLoading(false)
    }
    load()
  }, [])

  const filtered = useMemo(() => {
    return games.filter(g => {
      if (search && !g.name.toLowerCase().includes(search.toLowerCase())) return false
      if (filterType) {
        const types = g.types?.map(t => t.type) || []
        if (!types.includes(filterType)) return false
      }
      if (filterMinPl && g.max_players < parseInt(filterMinPl)) return false
      if (filterAge   && g.min_age > parseInt(filterAge))        return false
      if (filterDur   && g.duration > parseInt(filterDur))       return false
      return true
    })
  }, [games, search, filterType, filterMinPl, filterAge, filterDur])

  function clearFilters() {
    setSearch(''); setFilterType(''); setFilterMinPl(''); setFilterAge(''); setFilterDur('')
  }

  const hasFilters = search || filterType || filterMinPl || filterAge || filterDur

  return (
    <main className="page-layout">
      <div className="page-container">

        {/* ── PAGE HEADER ── */}
        <div className="page-header">
          <div>
            <p className="page-eyebrow">Catálogo</p>
            <h1 className="page-title">Ludoteca</h1>
            <p className="page-subtitle">
              {games.length} juego{games.length !== 1 ? 's' : ''} disponibles en el club
            </p>
          </div>
          {canCreate && (
            <Link to="/boardgames/new" className="btn btn-primary">
              + Añadir juego
            </Link>
          )}
        </div>

        {/* ── SEARCH & FILTERS ── */}
        <div className="filter-panel">
          <div className="filter-row">
            <div className="filter-field filter-field-wide">
              <label className="filter-label">Nombre</label>
              <div className="search-wrap">
                <span className="search-icon">🔍</span>
                <input
                  className="field-input search-input"
                  type="text"
                  placeholder="Buscar por nombre..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="filter-field">
              <label className="filter-label">Tipo</label>
              <select
                className="field-input"
                value={filterType}
                onChange={e => setFilterType(e.target.value)}
              >
                <option value="">Todos los tipos</option>
                {allTypes.map(t => (
                  <option key={t.id} value={t.type}>
                    {t.type.charAt(0).toUpperCase() + t.type.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-field filter-field-sm">
              <label className="filter-label">Nº jugadores</label>
              <input
                className="field-input" type="number" min="1" max="20" placeholder="Ej: 4"
                value={filterMinPl} onChange={e => setFilterMinPl(e.target.value)}
              />
            </div>

            <div className="filter-field filter-field-sm">
              <label className="filter-label">Edad máx.</label>
              <input
                className="field-input" type="number" min="3" max="99" placeholder="Ej: 12"
                value={filterAge} onChange={e => setFilterAge(e.target.value)}
              />
            </div>

            <div className="filter-field filter-field-sm">
              <label className="filter-label">Duración máx.</label>
              <input
                className="field-input" type="number" min="5" max="600" placeholder="Min"
                value={filterDur} onChange={e => setFilterDur(e.target.value)}
              />
            </div>
          </div>

          {hasFilters && (
            <div className="filter-active-row">
              <span className="filter-result-count">
                {filtered.length} resultado{filtered.length !== 1 ? 's' : ''}
              </span>
              <button className="btn-clear-filters" onClick={clearFilters}>
                Limpiar filtros ✕
              </button>
            </div>
          )}
        </div>

        {/* ── CONTENT ── */}
        {loading ? (
          <div className="loading-state" style={{ padding: '4rem' }}>
            <div className="spinner" /><span>Cargando ludoteca...</span>
          </div>
        ) : error ? (
          <div className="page-error"><span>⚠️</span><p>{error}</p></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state" style={{ padding: '4rem' }}>
            <span className="empty-icon">🎲</span>
            <p>{hasFilters ? 'No hay juegos con esos filtros' : 'No hay juegos en la ludoteca todavía'}</p>
            {hasFilters && (
              <button className="btn btn-ghost" onClick={clearFilters} style={{ marginTop: '0.75rem' }}>
                Limpiar filtros
              </button>
            )}
          </div>
        ) : (
          <div className="games-grid">
            {filtered.map(g => <GameCard key={g.id} game={g} />)}
          </div>
        )}

      </div>
    </main>
  )
}
