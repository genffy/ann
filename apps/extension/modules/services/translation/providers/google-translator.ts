import { BaseTranslator } from './base-translator'
import { TranslationConfig } from '../../config/default-config'

export class GoogleTranslator extends BaseTranslator {
    constructor(config: TranslationConfig) {
        super(config)
    }

    getName(): string {
        return 'Google Translate'
    }

    isAvailable(): boolean {
        return this.config.enableGoogleTranslate
    }

    validateApiKey(): boolean {
        const apiKey = this.config.apiKeys.google.key
        return apiKey !== undefined && apiKey.trim() !== ''
    }

    async translate(text: string, targetLang: string = 'zh'): Promise<string> {
        // 如果有API密钥，使用官方Cloud Translation API
        if (this.validateApiKey()) {
            return await this.translateWithCloudAPI(text, targetLang)
        }

        // 否则使用免费翻译接口
        return await this.translateWithFreeAPI(text, targetLang)
    }

    /**
     * 使用Google Cloud Translation API（官方接口）
     */
    private async translateWithCloudAPI(text: string, targetLang: string): Promise<string> {
        try {
            const apiKey = this.config.apiKeys.google.key
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

            // 根据官方文档处理响应格式
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

    /**
     * 使用Google免费翻译接口（非官方）
     */
    private async translateWithFreeAPI(text: string, targetLang: string): Promise<string> {
        const apis = [
            {
                url: `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`,
                parseResponse: (data: any) => {
                    // Google Translate免费接口返回的是复杂的数组结构
                    if (data && Array.isArray(data) && data[0]) {
                        if (Array.isArray(data[0])) {
                            // 标准格式: [[[翻译文本, 原文本, null, null, 语言代码]], null, 语言代码]
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
                    // Chrome扩展接口格式
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
                    // Web应用接口格式
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
                    // 某些接口可能返回JavaScript格式，需要特殊处理
                    const text = await response.text()
                    try {
                        // 移除可能的JSON-P包装
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
} 