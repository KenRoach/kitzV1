// Environment-aware API routing
// Dev: empty base → Vite proxy handles routing to local services
// Prod: per-service Railway URLs → direct HTTPS calls
const BASE = import.meta.env.VITE_API_BASE_URL || ''
const KITZ_OS_BASE = import.meta.env.VITE_KITZ_OS_URL || ''

export const API = {
  GATEWAY: `${BASE}/api/gateway`,
  WORKSPACE: `${BASE}/api/workspace`,
  // kitz_os has its own Railway service URL (separate from WhatsApp connector)
  KITZ_OS: KITZ_OS_BASE ? `${KITZ_OS_BASE}/api/kitz` : `${BASE}/api/kitz`,
  // Dev: /api/whatsapp → Vite proxy strips prefix → localhost:3006/...
  // Prod: Railway IS the WhatsApp connector, so call it directly (no /api/whatsapp prefix)
  WHATSAPP: BASE ? BASE : '/api/whatsapp',
  COMMS: `${BASE}/api/comms`,
  LOGS: `${BASE}/api/logs`,
} as const

export const AUTH_TOKEN_KEY = 'kitz_token'
export const AUTH_USER_KEY = 'kitz_user'
