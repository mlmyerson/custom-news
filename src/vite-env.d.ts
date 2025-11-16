/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_DEPLOY_BRANCH?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
