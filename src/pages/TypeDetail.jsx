import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { createApi } from '../services/api'

export default function TypeDetail() {
  const { id }     = useParams()
  const navigate   = useNavigate()
  const { authHeaders, API, user } = useAuth()
  const api = createApi(API, authHeaders)

  const [type,       setType]       = useState(null)
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState('')
  const [deleting,   setDeleting]   = useState(false)
  const [confirmDel, setConfirmDel] = useState(false)

  const canEdit = user?.type === 'admin' || user?.type === 'junta'

  useEffect(() => {
    async function load() {
      setLoading(true); setError('')
      try {
        const data = await api.types.get(id)
        setType(data.data || data)
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
      await api.types.delete(id)
      navigate('/types')
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
          <div className="spinner" /><span>Cargando tipo...</span>
        </div>
      </div>
    </main>
  )

  if (error && !type) return (
    <main className="page-layout">
      <div className="page-container">
        <div className="page-error"><span>⚠️</span><p>{error}</p></div>
        <Link to="/types" className="btn btn-ghost" style={{ marginTop: '1.5rem', display: 'inline-flex' }}>
          ← Volver a tipos
        </Link>
      </div>
    </main>
  )

  return (
    <main className="page-layout">
      <div className="page-container page-container-narrow">

        <nav className="breadcrumb">
          <Link to="/types" className="breadcrumb-link">Tipos de juego</Link>
          <span className="breadcrumb-sep">›</span>
          <span className="breadcrumb-current">{type?.type}</span>
        </nav>

        <div className="detail-card">

          <div className="detail-card-header">
            <div className="detail-title-wrap">
              <h1 className="detail-title" style={{ textTransform: 'capitalize' }}>
                {type?.type}
              </h1>
            </div>
          </div>

          <div className="detail-description">
            {type?.description ? (
              <>
                <h2 className="detail-section-title">Descripción</h2>
                <div className="detail-description-body">{type.description}</div>
              </>
            ) : (
              <p className="detail-no-desc">Este tipo no tiene descripción todavía.</p>
            )}
          </div>

          {error && <p className="msg msg-error" style={{ margin: '0 2rem 1rem' }}>{error}</p>}

          <div className="detail-actions">
            <Link to="/types" className="btn btn-ghost">← Volver</Link>

            <div className="detail-actions-right">
              {canEdit && (
                <Link to={`/types/${id}/edit`} className="btn btn-borgona">
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
                    ¿Borrar el tipo <strong>{type?.type}</strong>? Esta acción no se puede deshacer.
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
