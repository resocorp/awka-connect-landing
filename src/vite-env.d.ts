/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Chatwoot Website Chat inbox token. Public by design; unset disables the widget. */
  readonly VITE_CHATWOOT_WEBSITE_TOKEN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
