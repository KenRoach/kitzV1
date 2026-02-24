/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_PAY_DOMAIN?: string
  readonly VITE_API_BASE_URL?: string
  readonly VITE_SERVICE_SECRET?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
