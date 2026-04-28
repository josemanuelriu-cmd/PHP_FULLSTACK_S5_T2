// ── Base request ──────────────────────────────────────────────────────────────

async function request(url, options = {}) {
  const res  = await fetch(url, options)
  const data = await res.json()
  if (!res.ok) {
    const error = new Error(
      data.errors
        ? Object.values(data.errors).flat().join(' · ')
        : (data.message || `Error ${res.status}`)
    )
    error.data   = data
    error.status = res.status
    throw error
  }
  return data
}

function list(data) {
  return Array.isArray(data) ? data : (data?.data ?? [])
}

// ── Factory ───────────────────────────────────────────────────────────────────
// Usage in components:
//   const { API, authHeaders } = useAuth()
//   const api = createApi(API, authHeaders)

export function createApi(baseUrl, headers) {
  const h = headers

  const get  = (path)       => request(`${baseUrl}${path}`, { headers: h })
  const post = (path, body) => request(`${baseUrl}${path}`, { method: 'POST',   headers: h, body: JSON.stringify(body ?? {}) })
  const put  = (path, body) => request(`${baseUrl}${path}`, { method: 'PUT',    headers: h, body: JSON.stringify(body) })
  const del  = (path)       => request(`${baseUrl}${path}`, { method: 'DELETE', headers: h })

  // Auth headers without Content-Type for public endpoints
  const pubHeaders = { 'Content-Type': 'application/json', Accept: 'application/json' }
  const pubPost = (path, body) => request(`${baseUrl}${path}`, { method: 'POST', headers: pubHeaders, body: JSON.stringify(body) })

  return {

    // ── Auth ────────────────────────────────────────────────────────────────
    auth: {
      login:    (credentials) => pubPost('/login',    credentials),
      register: (data)        => pubPost('/register', data),
      logout:   ()            => post('/logout'),
    },

    // ── Users ───────────────────────────────────────────────────────────────
    users: {
      list:   ()        => get('/users').then(list),
      get:    (id)      => get(`/users/${id}`),
      update: (id, data) => put(`/users/${id}`, data),
    },

    // ── Boardgames ──────────────────────────────────────────────────────────
    boardgames: {
      list:   ()         => get('/boardgames').then(list),
      get:    (id)       => get(`/boardgames/${id}`),
      create: (data)     => post('/boardgames', data),
      update: (id, data) => put(`/boardgames/${id}`, data),
      delete: (id)       => del(`/boardgames/${id}`),
    },

    // ── Types ───────────────────────────────────────────────────────────────
    types: {
      list:   ()         => get('/types').then(list),
      get:    (id)       => get(`/types/${id}`),
      create: (data)     => post('/types', data),
      update: (id, data) => put(`/types/${id}`, data),
      delete: (id)       => del(`/types/${id}`),
    },

    // ── Sessions ────────────────────────────────────────────────────────────
    sessions: {
      list:     ()         => get('/zassessions').then(list),
      get:      (id)       => get(`/zassessions/${id}`),
      create:   (data)     => post('/zassessions', data),
      update:   (id, data) => put(`/zassessions/${id}`, data),
      delete:   (id)       => del(`/zassessions/${id}`),
      join:     (id)       => post(`/zassessions/${id}/join`),
      leave:    (id)       => del(`/zassessions/${id}/leave`),
      getUsers: (id)       => get(`/zassessions/${id}/users`).then(list),
      getGames: (id)       => get(`/zassessions/${id}/games`).then(list),
    },

    // ── Games ───────────────────────────────────────────────────────────────
    games: {
      get:      (id)       => get(`/games/${id}`),
      create:   (data)     => post('/games', data),
      update:   (id, data) => put(`/games/${id}`, data),
      delete:   (id)       => del(`/games/${id}`),
      join:     (id)       => post(`/games/${id}/join`),
      leave:    (id)       => del(`/games/${id}/leave`),
      getUsers: (id)       => get(`/games/${id}/users`).then(list),
    },

  }
}
