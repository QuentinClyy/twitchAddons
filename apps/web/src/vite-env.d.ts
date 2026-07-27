/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_HENRIK_API_KEY?: string;
  readonly VITE_STREAMLABS_WIDGET_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
