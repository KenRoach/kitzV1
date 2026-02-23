/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_PAY_DOMAIN?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
