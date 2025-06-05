export default defineBackground(() => {
  console.log('Translation extension background loaded', { id: browser.runtime.id })

  // Default translation configuration
  const defaultConfig = {
    provider: 'google',
    targetLanguage: 'zh',
    sourceLanguage: 'auto',
    apiKeys: {
      google: {
        key: '',
      },
      baidu: {
        appId: '',
        key: '',
      },
      youdao: {
        appKey: '',
        appSecret: '',
      },
    },
    translationRules: {
      enabled: true,
      skipChinese: false,
      skipNumbers: true,
      skipCryptoAddresses: true,
      customRules: [],
    },
  }

  // Default translation rules
  const defaultTranslationRules = {
    enabled: true,
    skipChinese: false,
    skipNumbers: true,
    skipCryptoAddresses: true,
    customRules: [],
  }

  // Initialize configuration
  browser.runtime.onInstalled.addListener(async () => {
    const config = await browser.storage.sync.get(['translationConfig', 'translationRules'])
    if (!config.translationConfig) {
      await browser.storage.sync.set({ translationConfig: defaultConfig })
    }
    if (!config.translationRules) {
      await browser.storage.sync.set({ translationRules: defaultTranslationRules })
    }
  })

  // Handle messages from content script
  browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'GET_TRANSLATION_CONFIG') {
      browser.storage.sync.get('translationConfig').then(config => {
        sendResponse(config.translationConfig || defaultConfig)
      })
      return true // Indicates async response
    }

    if (message.type === 'SET_TRANSLATION_CONFIG') {
      browser.storage.sync.set({ translationConfig: message.config }).then(() => {
        sendResponse({ success: true })
      })
      return true // Indicates async response
    }

    if (message.type === 'CHECK_TRANSLATION_RULES') {
      ; (async () => {
        try {
          const shouldTranslate = await checkTranslationRules(message.text)
          sendResponse({ shouldTranslate })
        } catch (error) {
          console.error('Error checking translation rules:', error)
          sendResponse({ shouldTranslate: true }) // Default to translate on error
        }
      })()
      return true // Indicates async response
    }

    if (message.type === 'GET_TRANSLATION_RULES') {
      browser.storage.sync.get('translationRules').then(config => {
        sendResponse(config.translationRules || defaultTranslationRules)
      })
      return true // Indicates async response
    }

    if (message.type === 'SET_TRANSLATION_RULES') {
      browser.storage.sync.set({ translationRules: message.rules }).then(() => {
        sendResponse({ success: true })
      })
      return true // Indicates async response
    }

    if (message.type === 'TRANSLATE_TEXT') {
      ; (async () => {
        const config = await browser.storage.sync.get('translationConfig')
        const translationConfig = config.translationConfig || defaultConfig

        try {
          const result = await translateWithProvider(message.text, translationConfig)
          sendResponse({ success: true, result })
        } catch (error) {
          console.error('Background translation error:', error)
          // Try fallback translation
          try {
            const fallbackResult = await fallbackTranslation(message.text)
            sendResponse({ success: true, result: fallbackResult })
          } catch (fallbackError: any) {
            sendResponse({ success: false, error: fallbackError.message })
          }
        }
      })()
      return true // Indicates async response
    }
  })

  // Check if text should be translated based on rules
  async function checkTranslationRules(text: string): Promise<boolean> {
    try {
      const config = await browser.storage.sync.get('translationRules')
      const rules = config.translationRules || defaultTranslationRules

      // If rules are disabled, translate everything
      if (!rules.enabled) {
        return true
      }

      // Check if text is only Chinese characters
      if (rules.skipChinese && /^[\u4e00-\u9fa5\s\p{P}]*$/u.test(text)) {
        return false
      }

      // Check if text is only numbers
      if (rules.skipNumbers && /^[\d\s\.\,\-\+]*$/.test(text)) {
        return false
      }

      // Check if text is a cryptocurrency contract address
      if (rules.skipCryptoAddresses && isCryptoAddress(text)) {
        return false
      }

      // Check custom rules
      if (rules.customRules && rules.customRules.length > 0) {
        for (const rule of rules.customRules) {
          if (rule.enabled && rule.pattern) {
            try {
              const regex = new RegExp(rule.pattern, rule.flags || 'i')
              if (regex.test(text)) {
                return false
              }
            } catch (error) {
              console.warn('Invalid custom rule pattern:', rule.pattern, error)
            }
          }
        }
      }

      return true
    } catch (error) {
      console.error('Error in checkTranslationRules:', error)
      return true // Default to translate on error
    }
  }

  // Check if text is a cryptocurrency contract address
  function isCryptoAddress(text: string): boolean {
    const trimmedText = text.trim()

    // Ethereum address (0x followed by 40 hex characters)
    if (/^0x[a-fA-F0-9]{40}$/.test(trimmedText)) {
      return true
    }

    // Bitcoin address patterns
    if (/^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(trimmedText) || // Legacy
      /^bc1[a-z0-9]{39,59}$/.test(trimmedText)) { // Bech32
      return true
    }

    // Solana address (base58, typically 32-44 characters)
    if (/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(trimmedText)) {
      return true
    }

    // Generic contract address pattern (long alphanumeric strings)
    if (trimmedText.length >= 26 && /^[a-zA-Z0-9]+$/.test(trimmedText)) {
      // Check if it looks like a hash (high entropy)
      const hasUpperCase = /[A-Z]/.test(trimmedText)
      const hasLowerCase = /[a-z]/.test(trimmedText)
      const hasNumbers = /[0-9]/.test(trimmedText)

      if ((hasUpperCase && hasLowerCase) || (hasNumbers && (hasUpperCase || hasLowerCase))) {
        return true
      }
    }

    return false
  }

  // Translation function
  async function translateWithProvider(text: string, config: any): Promise<string> {
    switch (config.provider) {
      case 'google':
        return await translateWithGoogle(text, config.targetLanguage)
      case 'baidu':
        return await translateWithBaidu(text, config)
      case 'youdao':
        return await translateWithYoudao(text, config)
      default:
        throw new Error('Unknown translation provider')
    }
  }

  async function translateWithGoogle(text: string, targetLang: string = 'zh'): Promise<string> {
    try {
      // Get configuration, check if Google API key exists
      const config = await browser.storage.sync.get('translationConfig')
      const googleApiKey = config.translationConfig?.apiKeys?.google?.key
      console.log('Google API key:', googleApiKey)
      // If API key exists, use official Cloud Translation API
      if (googleApiKey) {
        return await translateWithGoogleCloudAPI(text, targetLang, googleApiKey)
      }

      // Otherwise use free translation interface
      return await translateWithGoogleFreeAPI(text, targetLang)
    } catch (error) {
      console.error('Google translation error:', error)
      throw error
    }
  }

  // Google Cloud Translation API (Official interface)
  async function translateWithGoogleCloudAPI(text: string, targetLang: string, apiKey: string): Promise<string> {
    try {
      const url = 'https://translation.googleapis.com/language/translate/v2'
      const params = new URLSearchParams({
        key: apiKey,
        q: text,
        target: targetLang,
        format: 'text',
      })

      const response = await fetch(`${url}?${params}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`Google API HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()

      // Handle response format according to official documentation
      if (data && data.data && data.data.translations && data.data.translations.length > 0) {
        const translation = data.data.translations[0]
        if (translation.translatedText) {
          return translation.translatedText
        }
      }

      throw new Error('Invalid response format from Google Cloud Translation API')
    } catch (error) {
      console.error('Google Cloud API error:', error)
      throw error
    }
  }

  // Google free translation interface (Unofficial)
  async function translateWithGoogleFreeAPI(text: string, targetLang: string): Promise<string> {
    const apis = [
      {
        url: `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`,
        parseResponse: (data: any) => {
          // Google Translate free interface returns complex array structure
          if (data && Array.isArray(data) && data[0]) {
            if (Array.isArray(data[0])) {
              // Standard format: [[[translated text, original text, null, null, language code]], null, language code]
              const translations = data[0].map((item: any[]) => item[0]).filter(Boolean)
              if (translations.length > 0) {
                return translations.join('')
              }
            }
          }
          return null
        },
      },
      {
        url: `https://clients5.google.com/translate_a/t?client=dict-chrome-ex&sl=auto&tl=${targetLang}&q=${encodeURIComponent(text)}`,
        parseResponse: (data: any) => {
          // Chrome extension interface format
          if (data && data.sentences && Array.isArray(data.sentences)) {
            const translations = data.sentences.map((sentence: any) => sentence.trans).filter(Boolean)
            if (translations.length > 0) {
              return translations.join('')
            }
          }
          return null
        },
      },
      {
        url: `https://translate.google.com/translate_a/single?client=webapp&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`,
        parseResponse: (data: any) => {
          // Web application interface format
          if (data && Array.isArray(data) && data[0] && Array.isArray(data[0])) {
            const result = data[0]
              .map((item: any[]) => item[0])
              .filter(Boolean)
              .join('')
            return result || null
          }
          return null
        },
      },
    ]

    for (const api of apis) {
      try {
        const response = await fetch(api.url, {
          method: 'GET',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Referer': 'https://translate.google.com/',
            'Accept': 'application/json, text/plain, */*',
            'Accept-Language': 'en-US,en;q=0.9',
          },
        })

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }

        let data
        const contentType = response.headers.get('content-type')

        if (contentType && contentType.includes('application/json')) {
          data = await response.json()
        } else {
          // Some interfaces may return JavaScript format, requiring special handling
          const text = await response.text()
          try {
            // Remove possible JSON-P wrapper
            const jsonMatch = text.match(/(?:\w+\()?(\[.*\])(?:\))?/)
            if (jsonMatch) {
              data = JSON.parse(jsonMatch[1])
            } else {
              data = JSON.parse(text)
            }
          } catch (parseError) {
            console.warn('Failed to parse response:', parseError)
            continue
          }
        }

        const result = api.parseResponse(data)
        if (result) {
          return result
        }
      } catch (apiError) {
        console.warn(`Free API ${api.url} failed:`, apiError)
        continue
      }
    }

    throw new Error('All Google Translate free APIs failed')
  }

  // Baidu Translation API implementation
  async function translateWithBaidu(text: string, config: any): Promise<string> {
    const { appId, key } = config.apiKeys.baidu
    if (!appId || !key) {
      throw new Error('Baidu translation requires API credentials')
    }

    // Generate signature (MD5 implementation required)
    const salt = Date.now().toString()
    const query = text
    const from = 'auto'
    const to = config.targetLanguage === 'zh' ? 'zh' : config.targetLanguage

    // Generate signature (MD5 implementation required)
    const sign = generateMD5(`${appId}${query}${salt}${key}`)

    const url = 'https://fanyi-api.baidu.com/api/trans/vip/translate'
    const params = new URLSearchParams({
      q: query,
      from: from,
      to: to,
      appid: appId,
      salt: salt,
      sign: sign,
    })

    const response = await fetch(`${url}?${params}`)
    const data = await response.json()

    if (data.error_code) {
      throw new Error(`Baidu API Error: ${data.error_msg}`)
    }

    if (data.trans_result && data.trans_result[0]) {
      return data.trans_result[0].dst
    }

    throw new Error('Baidu translation failed')
  }

  // Youdao Translation API implementation
  async function translateWithYoudao(text: string, config: any): Promise<string> {
    const { appKey, appSecret } = config.apiKeys.youdao
    if (!appKey || !appSecret) {
      throw new Error('Youdao translation requires API credentials')
    }

    // Youdao Translation API implementation
    throw new Error('Youdao translation not implemented yet')
  }

  // Fallback translation solution
  async function fallbackTranslation(text: string): Promise<string> {
    // Simple word translation mapping
    const translations: Record<string, string> = {
      // 英文到中文
      'hello': '你好',
      'world': '世界',
      'good': '好的',
      'bad': '坏的',
      'yes': '是',
      'no': '不',
      'thank you': '谢谢',
      'please': '请',
      'sorry': '对不起',
      'welcome': '欢迎',
      'goodbye': '再见',
      'love': '爱',
      'like': '喜欢',
      'time': '时间',
      'day': '天',
      'night': '夜晚',
      'morning': '早晨',
      'afternoon': '下午',
      'evening': '晚上',
      'technology': '技术',
      'artificial intelligence': '人工智能',
      'machine learning': '机器学习',
      'javascript': 'JavaScript',
      'browser extension': '浏览器扩展',
      'api integration': 'API集成',
      'good luck': '祝你好运',
      'see you later': '再见',
      'have a nice day': '祝你有美好的一天',
    }

    const lowerText = text.toLowerCase().trim()

    // Find exact match
    if (translations[lowerText]) {
      return translations[lowerText]
    }

    // Find partial match
    for (const [key, value] of Object.entries(translations)) {
      if (lowerText.includes(key) || key.includes(lowerText)) {
        return value
      }
    }

    // If it's Chinese, try to translate to English
    if (/[\u4e00-\u9fa5]/.test(text)) {
      const chineseToEnglish: Record<string, string> = {
        你好: 'hello',
        世界: 'world',
        谢谢: 'thank you',
        再见: 'goodbye',
        爱: 'love',
        时间: 'time',
        早上: 'morning',
        下午: 'afternoon',
        晚上: 'evening',
        技术: 'technology',
        人工智能: 'artificial intelligence',
      }

      if (chineseToEnglish[text]) {
        return chineseToEnglish[text]
      }

      // Partial match
      for (const [key, value] of Object.entries(chineseToEnglish)) {
        if (text.includes(key)) {
          return value
        }
      }
    }

    // If no matching translation found, return original text with marker
    return `[Translation needed] ${text}`
  }

  // Simple MD5 implementation (for Baidu translation signature)
  function generateMD5(str: string): string {
    // Should implement real MD5 algorithm here
    // For simplification, temporarily return a fixed value
    // In actual use, need to import crypto library or MD5 implementation
    return 'placeholder_md5_hash'
  }
})
