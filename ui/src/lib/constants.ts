// Environment-aware API routing
// Dev: Vite proxy handles routing to local services
// Prod: kitz_os serves the SPA — all API calls are same-origin
const BASE = import.meta.env.VITE_API_BASE_URL || ''
const KITZ_OS_BASE = import.meta.env.VITE_KITZ_OS_URL || ''
const WA_BASE = import.meta.env.VITE_WA_CONNECTOR_URL || ''

export const API = {
  GATEWAY: `${BASE}/api/gateway`,
  WORKSPACE: `${BASE}/api/workspace`,
  // kitz_os serves the SPA in production → same-origin, no base needed
  KITZ_OS: KITZ_OS_BASE ? `${KITZ_OS_BASE}/api/kitz` : `${BASE}/api/kitz`,
  // WhatsApp connector is a separate Railway service
  WHATSAPP: WA_BASE || (BASE ? BASE : '/api/whatsapp'),
  COMMS: `${BASE}/api/comms`,
  LOGS: `${BASE}/api/logs`,
} as const

export const AUTH_TOKEN_KEY = 'kitz_token'
export const AUTH_USER_KEY = 'kitz_user'
