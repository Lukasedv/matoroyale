/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ENGINE_URL: string
  readonly VITE_SIGNALR_URL: string
  // more env variables...
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
