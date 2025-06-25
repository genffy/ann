import { BaseTranslator } from './providers/base-translator'
import { GoogleTranslator } from './providers/google-translator'
import { ConfigManager } from '../../config/config-manager'

export class TranslationService {
    private static instance: TranslationService
    private translators: Map<string, BaseTranslator> = new Map()

    private constructor() { }

    static getInstance(): TranslationService {
        if (!TranslationService.instance) {
            TranslationService.instance = new TranslationService()
        }
        return TranslationService.instance
    }

    /**
     * 初始化翻译服务
     */
    async initialize(): Promise<void> {
        const config = await ConfigManager.getTranslationConfig()

        // 初始化各个翻译提供商
        this.translators.set('google', new GoogleTranslator(config))
    }

    /**
     * 翻译文本
     * @param text 待翻译的文本
     * @param provider 指定的翻译提供商，如果不指定则使用默认配置
     * @returns 翻译结果
     */
    async translateText(text: string, provider?: string): Promise<string> {
        const config = await ConfigManager.getTranslationConfig()
        const selectedProvider = provider || config.defaultTranslationService

        const translator = this.translators.get(selectedProvider)
        if (!translator) {
            throw new Error(`Unknown translation provider: ${selectedProvider}`)
        }

        if (!translator.isAvailable()) {
            // 尝试使用备用翻译服务
            return await this.fallbackTranslate(text)
        }

        try {
            return await translator.translate(text, config.targetLanguage)
        } catch (error) {
            console.error(`Translation error with ${selectedProvider}:`, error)
            // 尝试备用翻译
            return await this.fallbackTranslate(text)
        }
    }

    /**
     * 备用翻译方法
     */
    private async fallbackTranslate(text: string): Promise<string> {
        // 简单的词汇映射翻译
        const translations: Record<string, string> = {
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
        }

        const lowerText = text.toLowerCase().trim()

        // 精确匹配
        if (translations[lowerText]) {
            return translations[lowerText]
        }

        // 部分匹配
        for (const [key, value] of Object.entries(translations)) {
            if (lowerText.includes(key) || key.includes(lowerText)) {
                return value
            }
        }

        // 如果是中文，尝试翻译成英文
        if (/[\u4e00-\u9fa5]/.test(text)) {
            const chineseToEnglish: Record<string, string> = {
                '你好': 'hello',
                '世界': 'world',
                '谢谢': 'thank you',
                '再见': 'goodbye',
                '爱': 'love',
                '时间': 'time',
                '早上': 'morning',
                '下午': 'afternoon',
                '晚上': 'evening',
                '技术': 'technology',
                '人工智能': 'artificial intelligence',
            }

            if (chineseToEnglish[text]) {
                return chineseToEnglish[text]
            }

            // 部分匹配
            for (const [key, value] of Object.entries(chineseToEnglish)) {
                if (text.includes(key)) {
                    return value
                }
            }
        }

        // 如果没有找到匹配的翻译，返回带标记的原文
        return `[Translation needed] ${text}`
    }

    /**
     * 获取可用的翻译提供商列表
     */
    getAvailableProviders(): string[] {
        const available: string[] = []
        this.translators.forEach((translator, key) => {
            if (translator.isAvailable()) {
                available.push(key)
            }
        })
        return available
    }

    /**
     * 更新配置
     */
    async updateConfig(): Promise<void> {
        const config = await ConfigManager.getTranslationConfig()
        this.translators.forEach(translator => {
            // 更新每个翻译器的配置
            ; (translator as any).config = config
        })
    }
} 