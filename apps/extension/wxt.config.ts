import { defineConfig } from 'wxt'

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  manifest: {
    name: '选词翻译',
    description: '选中文本即可翻译，支持多种翻译服务',
    version: '1.0.0',
    permissions: ['storage', 'activeTab'],
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
      default_title: '选词翻译设置',
    },
    content_security_policy: {
      extension_pages: "script-src 'self'; object-src 'self';",
    },
  },
})
