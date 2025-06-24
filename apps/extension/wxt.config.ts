import { defineConfig } from 'wxt'

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  srcDir: '.',
  manifest: {
    name: 'ANN - Advanced Text Toolkit',
    description: 'Multi-functional text selection toolkit with translation, notes, and sharing capabilities',
    version: '2.0.0',
    permissions: [
      'storage',
      'activeTab',
      'notifications',
      'tabs',
      'contextMenus',
      'commands',        // 快捷键支持
      'downloads',       // 文件下载支持
      'scripting'        // 脚本注入支持
    ],
    host_permissions: [
      'https://translation.googleapis.com/*',
      'https://translate.googleapis.com/*',
      'https://translate.google.com/*',
      'https://clients5.google.com/*',
      'https://fanyi-api.baidu.com/*',
      'https://openapi.youdao.com/*',
      '<all_urls>',      // 支持所有网站的截图功能
    ],
    action: {
      default_popup: 'popup/index.html',
      default_title: 'ANN - Advanced Text Toolkit',
    },
    options_ui: {
      page: 'options/index.html',
      open_in_tab: true,
    },
    commands: {
      'capture-selection': {
        suggested_key: {
          default: 'Ctrl+Shift+S',
          mac: 'Command+Shift+S'
        },
        description: 'Capture selected text area for annotation',
        global: false  // 只在 Chrome 有焦点时工作
      }
    },
    content_security_policy: {
      extension_pages: "script-src 'self'; object-src 'self'; style-src 'self' 'unsafe-inline';",
    },
  },
  webExt: {
    disabled: true,
    chromiumArgs: ['--user-data-dir=./.wxt/browser-data']
  }
})
