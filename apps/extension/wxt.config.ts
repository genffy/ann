import { defineConfig } from 'wxt'

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  manifest: {
    name: 'Text Selection Translation',
    description: 'Translate selected text instantly with multiple translation services',
    version: '1.0.0',
    permissions: ['storage', 'activeTab', 'tabs'],
    host_permissions: [
      'https://translation.googleapis.com/*',
      'https://translate.googleapis.com/*',
      'https://translate.google.com/*',
      'https://clients5.google.com/*',
      'https://fanyi-api.baidu.com/*',
      'https://openapi.youdao.com/*',
    ],
    action: {
      default_popup: 'popup/index.html',
      default_title: 'Text Selection Translation',
    },
    options_ui: {
      page: 'options/index.html',
      open_in_tab: true,
    },
    content_security_policy: {
      extension_pages: "script-src 'self'; object-src 'self';",
    },
  },
})
