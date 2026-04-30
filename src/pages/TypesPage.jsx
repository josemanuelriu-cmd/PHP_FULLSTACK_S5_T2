import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { createApi } from '../services/api'

function TypeCard({ t }) {
  return (
    <div className="type-card">
      <div className="type-card-header">
        <h3 className="type-card-name">{t.type}</h3>
      </div>
      {t.description ? (
        <p className="type-card-desc">{t.description}</p>
      ) : (
        <p className="type-card-desc type-card-desc-empty">Sin descripción</p>
      )}
      <Link to={`/types/${t.id}`} className="game-card-link">
        Ver detalle →
      </Link>
    </div>
  )
}

export default function TypesPage() {
  const { authHeaders, API, user } = useAuth()
  const api = createApi(API, authHeaders)

  const [types,   setTypes]   = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState('')
  const [search,  setSearch]  = useState('')

  const canCreate = user?.type === 'admin' || user?.type === 'junta'

  useEffect(() => {
    async function load() {
      setLoading(true); setError('')
      try {
        setTypes(await api.types.list())
      } catch (e) {
        setError(e.message)
      }
      setLoading(false)
    }
    load()
  }, [])

  const filtered = useMemo(() =>
    search
      ? types.filter(t =>
          t.type.toLowerCase().includes(search.toLowerCase()) ||
          (t.description || '').toLowerCase().includes(search.toLowerCase())
        )
      : types
  , [types, search])

  return (
    <main className="page-layout">
      <div className="page-container">

        <div className="page-header">
          <div>
            <p className="page-eyebrow">Catálogo</p>
            <h1 className="page-title">Tipos de juego</h1>
            <p className="page-subtitle">
              {types.length} tipo{types.length !== 1 ? 's' : ''} registrados
            </p>
          </div>
          {canCreate && (
            <Link to="/types/new" className="btn btn-primary">
              + Añadir tipo
            </Link>
          )}
        </div>

        {/* Search */}
        <div className="filter-panel" style={{ marginBottom: '2rem' }}>
          <div className="filter-field" style={{ maxWidth: '420px' }}>
            <label className="filter-label">Buscar</label>
            <div className="search-wrap">
              <span className="search-icon">🔍</span>
              <input
                className="field-input search-input"
                type="text"
                placeholder="Buscar por nombre o descripción..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>
          {search && (
            <div className="filter-active-row" style={{ marginTop: '0.75rem' }}>
              <span className="filter-result-count">
                {filtered.length} resultado{filtered.length !== 1 ? 's' : ''}
              </span>
              <button className="btn-clear-filters" onClick={() => setSearch('')}>
                Limpiar ✕
              </button>
            </div>
          )}
        </div>

        {loading ? (
          <div className="loading-state" style={{ padding: '4rem' }}>
            <div className="spinner" /><span>Cargando tipos...</span>
          </div>
        ) : error ? (
          <div className="page-error"><span>⚠️</span><p>{error}</p></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state" style={{ padding: '4rem' }}>
            <span className="empty-icon">🎴</span>
            <p>{search ? 'No hay tipos que coincidan con la búsqueda' : 'No hay tipos registrados todavía'}</p>
          </div>
        ) : (
          <div className="types-grid">
            {filtered.map(t => <TypeCard key={t.id} t={t} />)}
          </div>
        )}

      </div>
    </main>
  )
}
