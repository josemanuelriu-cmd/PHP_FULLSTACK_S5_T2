import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function ownerLabel(game) {
  if (!game.owner_user_id || game.owner_user_id === 0) return 'ZAS!'
  return game.owner?.nickname || game.owner?.name || `Usuario #${game.owner_user_id}`
}

export default function BoardgameDetail() {
  const { id }       = useParams()
  const navigate     = useNavigate()
  const { authHeaders, API, user } = useAuth()

  const [game,       setGame]       = useState(null)
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState('')
  const [deleting,   setDeleting]   = useState(false)
  const [confirmDel, setConfirmDel] = useState(false)

  const canEdit = user?.type === 'admin' || user?.type === 'junta'

  useEffect(() => {
    async function load() {
      setLoading(true); setError('')
      try {
        const res  = await fetch(`${API}/boardgames/${id}`, { headers: authHeaders })
        if (!res.ok) throw new Error('Juego no encontrado')
        const data = await res.json()
        const game = data.data || data

        // If owner not eager-loaded but owner_user_id exists, fetch the user
        if (game.owner_user_id && !game.owner?.nickname && !game.owner?.name) {
          try {
            const uRes = await fetch(`${API}/users/${game.owner_user_id}`, { headers: authHeaders })
            if (uRes.ok) {
              const uData = await uRes.json()
              game.owner = uData.data || uData
            }
          } catch {}
        }

        setGame(game)
      } catch (e) {
        setError(e.message)
      }
      setLoading(false)
    }
    load()
  }, [id])

  async function handleDelete() {
    setDeleting(true)
    try {
      const res = await fetch(`${API}/boardgames/${id}`, {
        method: 'DELETE',
        headers: authHeaders,
      })
      if (!res.ok) throw new Error('No se pudo eliminar el juego')
      navigate('/boardgames')
    } catch (e) {
      setError(e.message)
      setDeleting(false)
      setConfirmDel(false)
    }
  }

  if (loading) return (
    <main className="page-layout">
      <div className="page-container">
        <div className="loading-state" style={{ padding: '5rem' }}>
          <div className="spinner" /><span>Cargando juego...</span>
        </div>
      </div>
    </main>
  )

  if (error && !game) return (
    <main className="page-layout">
      <div className="page-container">
        <div className="page-error"><span>⚠️</span><p>{error}</p></div>
        <Link to="/boardgames" className="btn btn-ghost" style={{ marginTop: '1.5rem', display: 'inline-flex' }}>
          ← Volver a la ludoteca
        </Link>
      </div>
    </main>
  )

  const types = game?.types?.map(t => t.type) || []
  const owner = ownerLabel(game || {})

  return (
    <main className="page-layout">
      <div className="page-container page-container-narrow">

        <nav className="breadcrumb">
          <Link to="/boardgames" className="breadcrumb-link">Ludoteca</Link>
          <span className="breadcrumb-sep">›</span>
          <span className="breadcrumb-current">{game?.name}</span>
        </nav>

        <div className="detail-card">

          <div className="detail-card-header">
            <div className="detail-title-wrap">
              <h1 className="detail-title">{game?.name}</h1>
              {types.length > 0 && (
                <div className="detail-types">
                  {types.map(t => <span key={t} className="type-pill">{t}</span>)}
                </div>
              )}
            </div>
          </div>

          <div className="detail-stats-row">
            <div className="detail-stat">
              <div className="detail-stat-icon">👥</div>
              <div className="detail-stat-label">Jugadores</div>
              <div className="detail-stat-value">{game?.min_players} – {game?.max_players}</div>
            </div>
            <div className="detail-stat">
              <div className="detail-stat-icon">🎂</div>
              <div className="detail-stat-label">Edad mínima</div>
              <div className="detail-stat-value">{game?.min_age}+</div>
            </div>
            <div className="detail-stat">
              <div className="detail-stat-icon">⏱</div>
              <div className="detail-stat-label">Duración</div>
              <div className="detail-stat-value">{game?.duration} min</div>
            </div>
            <div className="detail-stat">
              <div className="detail-stat-icon">🛡</div>
              <div className="detail-stat-label">Propietario</div>
              <div className="detail-stat-value">{owner}</div>
            </div>
          </div>

          <div className="detail-description">
            {game?.description ? (
              <>
                <h2 className="detail-section-title">Descripción</h2>
                <div className="detail-description-body">{game.description}</div>
              </>
            ) : (
              <p className="detail-no-desc">Este juego no tiene descripción todavía.</p>
            )}
          </div>

          {error && <p className="msg msg-error" style={{ margin: '0 2rem 1rem' }}>{error}</p>}

          <div className="detail-actions">
            <Link to="/boardgames" className="btn btn-ghost">← Volver</Link>

            <div className="detail-actions-right">
              {canEdit && (
                <Link to={`/boardgames/${id}/edit`} className="btn btn-borgona">
                  ✏ Editar
                </Link>
              )}
              {canEdit && !confirmDel && (
                <button className="btn btn-delete" onClick={() => setConfirmDel(true)}>
                  🗑 Borrar
                </button>
              )}
              {confirmDel && (
                <div className="confirm-delete-wrap">
                  <span className="confirm-delete-text">
                    ¿Borrar <strong>{game?.name}</strong>? Esta acción no se puede deshacer.
                  </span>
                  <button className="btn btn-delete" onClick={handleDelete} disabled={deleting}>
                    {deleting ? 'Borrando...' : 'Sí, borrar'}
                  </button>
                  <button className="btn btn-ghost" onClick={() => setConfirmDel(false)} disabled={deleting}>
                    Cancelar
                  </button>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </main>
  )
}
