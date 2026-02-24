// Environment-aware API routing
// Dev: empty base → Vite proxy handles routing to local services
// Prod: Railway backend URL → direct HTTPS calls
const BASE = import.meta.env.VITE_API_BASE_URL || ''

export const API = {
  GATEWAY: `${BASE}/api/gateway`,
  WORKSPACE: `${BASE}/api/workspace`,
  KITZ_OS: `${BASE}/api/kitz`,
  COMMS: `${BASE}/api/comms`,
  LOGS: `${BASE}/api/logs`,
} as const

export const AUTH_TOKEN_KEY = 'kitz_token'
export const AUTH_USER_KEY = 'kitz_user'
