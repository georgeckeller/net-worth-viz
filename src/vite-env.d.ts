/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SHEET_ID: string;
  readonly VITE_PASSWORD_HASH: string;
  readonly VITE_REFRESH_INTERVAL: string;
  readonly VITE_GOOGLE_API_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
