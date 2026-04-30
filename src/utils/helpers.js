// ── Shared constants ─────────────────────────────────────────────────────────

export const PALETTE = ['#800020', '#6C63FF', '#4aab78', '#d4963a', '#5a9fd4', '#9b59b6']

export const GAME_ICONS = ['♟', '⚔', '🃏', '♜', '🎲', '♞', '🏰', '🗡']

export const ROLE_LABELS = { admin: 'Admin', junta: 'Junta', partner: 'Socio', guest: 'Invitado' }
export const ROLE_BADGE  = { admin: 'badge-red', junta: 'badge-amber', partner: 'badge-green', guest: 'badge-blue' }

// ── Avatar helpers ────────────────────────────────────────────────────────────

export function avatarColor(str) {
  let h = 0
  for (const c of (str || '')) h = (h * 31 + c.charCodeAt(0)) % PALETTE.length
  return PALETTE[h]
}

export function initials(nick, name) {
  const s = nick || name || '?'
  return s.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

export function gameIcon(name) {
  let h = 0
  for (const c of (name || '')) h = (h * 17 + c.charCodeAt(0)) % GAME_ICONS.length
  return GAME_ICONS[h]
}

// ── Date / time formatters ────────────────────────────────────────────────────

export function fmtDate(d) {
  if (!d) return '—'
  try {
    const [y, m, day] = d.split('-').map(Number)
    return new Date(y, m - 1, day).toLocaleDateString('es-ES', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    })
  } catch { return d }
}

export function fmtTime(t) {
  return t ? t.slice(0, 5) : ''
}

export function isToday(dateStr) {
  if (!dateStr) return false
  const today = new Date()
  const [y, m, d] = dateStr.split('-').map(Number)
  return today.getFullYear() === y && today.getMonth() + 1 === m && today.getDate() === d
}

export function isPast(dateStr) {
  if (!dateStr) return false
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d) < today
}

// ── Boardgame helpers ─────────────────────────────────────────────────────────

export function ownerLabel(game) {
  if (!game.owner_user_id || game.owner_user_id === 0) return 'ZAS!'
  return game.owner?.nickname || game.owner?.name || `Usuario #${game.owner_user_id}`
}

export function extractTypes(game) {
  if (Array.isArray(game.types) && game.types.length > 0)
    return game.types.map(t => t.type || t).filter(Boolean)
  if (Array.isArray(game.boardgame_types) && game.boardgame_types.length > 0)
    return game.boardgame_types.map(bt => bt.type?.type || bt.type).filter(Boolean)
  return []
}
