/**
 * Incomplete type for settings in the `settings.json` file.
 *
 * This contains only the settings that the background script uses. Other
 * settings are used when generating the `manifest.json` file.
 */
export type Settings = {
  apiUrl: string
  buildType: string
  serviceUrl: string
  manifestV3?: boolean
}

// nb. This will error if the build has not been run yet.
// import rawSettings from env files
const rawSettings = {
  // badge theme DEV | QA
  buildType: import.meta.env.VITE_BUILD_TYPE,
  manifestV3: import.meta.env.VITE_MANIFEST_V3,
  apiUrl: import.meta.env.VITE_API_URL,
  serviceUrl: import.meta.env.VITE_SERVICE_URL,
}

/**
 * Configuration data for the extension.
 */
const settings: Settings = {
  ...rawSettings,

  // Ensure API url does not end with '/'
  apiUrl: rawSettings.apiUrl.replace(/\/$/, ''),
}

export default settings
