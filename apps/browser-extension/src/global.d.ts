/// <reference types="vite/client" />

import JSX = preact.JSX

interface ImportMetaEnv {
    readonly VITE_BUILD_TYPE: string
    readonly VITE_MANIFEST_V3: boolean
    readonly VITE_KEY?: string
    readonly VITE_API_URL: string
    readonly VITE_AUTH_DOMAIN?: string
    readonly VITE_OAUTH_CLIENT_ID: string
    readonly VITE_SENTRY_PUBLIC_DSN?: string
    readonly VITE_BOUNCER_URL?: string
    readonly VITE_SERVICE_URL: string
    readonly VITE_BROWSER_IS_CHROME?: boolean
    readonly VITE_BROWSER_IS_FIREFOX?: boolean
    readonly VITE_APP_TYPE?: string
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}