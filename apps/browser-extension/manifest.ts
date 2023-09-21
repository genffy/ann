import { defineManifest, type ManifestV3Export } from '@crxjs/vite-plugin'
import { version } from './package.json'
import { loadEnv } from 'vite';


export default defineManifest(({ mode, command }) => {
  const env = loadEnv(mode, process.cwd());
  const browserIsChrome = env.VITE_BROWSER_IS_CHROME
  const versionName = browserIsChrome ? 'Chrome' : 'Firefox'
  const key = env.VITE_KEY
  const bouncerUrl = env.VITE_BOUNCER_URL;

  const baseConfig: ManifestV3Export = {
    name: 'ann-browser-extension',
    description: 'Collaboratively annotate, highlight, and tag web pages and PDF documents.',
    version: `${version}`,
    manifest_version: 3,
    homepage_url: 'https://annhub.xyz',
    icons: {
      '16': 'icons/logo-16.png',
      '32': 'icons/logo-34.png',
      '48': 'icons/logo-48.png',
      '128': 'icons/logo-128.png',
    },
    action: {
      default_popup: 'popup.html',
      default_icon: 'icons/logo-48.png',
    },
    options_page: 'options.html',
    options_ui: {
      page: "options.html"
    },
    content_scripts: [
      {
        matches: ['http://*/*', 'https://*/*'],
        js: ['src/content/index.ts'],
      },
    ],
    web_accessible_resources: [
      {
        resources: ['icons/logo-16.png', 'icons/logo-34.png', 'icons/logo-48.png', 'icons/logo-128.png'],
        matches: [],
      },
      {
        "resources": [
          "client/*",
          "help/*",
          // TODO use CDN to inject the pdfjs viewer
          // "pdfjs/*",
          // "pdfjs/web/viewer.html"
        ],
        "matches": ["<all_urls>"]
      }
    ],
    permissions: [
      "contextMenus",
      "storage",
      "tabs",
      "scripting",
    ],
    optional_permissions: [
      "webNavigation"
    ],
    host_permissions: ['<all_urls>'],
    background: {
      service_worker: 'src/background/index.ts',
      type: 'module',
    },
  };
  if (browserIsChrome) {
    baseConfig['version_name'] = `${version} (${versionName})`;
    baseConfig["minimum_chrome_version"] = "88";
    baseConfig["incognito"] = "split";
    baseConfig["offline_enabled"] = false;

    if (bouncerUrl) {
      baseConfig['externally_connectable'] = {
        "matches": [`${bouncerUrl}*`]
      }
    }
  }

  if (key) {
    baseConfig["key"] = key;
  }

  // if (browserIsFirefox) {
  //   baseConfig["applications"] = {
  //     gecko: {
  //       gecko: {
  //         "strict_min_version": "68.0"
  //       }
  //     }
  //   }
  // }
  return baseConfig
})
