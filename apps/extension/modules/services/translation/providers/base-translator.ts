import { TranslationConfig } from '../../../config/default-config'

export interface TranslationResult {
    success: boolean
    translatedText?: string
    error?: string
}

export abstract class BaseTranslator {
    protected config: TranslationConfig

    constructor(config: TranslationConfig) {
        this.config = config
    }

    /**
     * 翻译文本的抽象方法
     * @param text 待翻译的文本
     * @param targetLang 目标语言
     * @returns 翻译结果
     */
    abstract translate(text: string, targetLang?: string): Promise<string>

    /**
     * 检查翻译器是否可用
     * @returns 是否可用
     */
    abstract isAvailable(): boolean

    /**
     * 获取翻译器名称
     */
    abstract getName(): string

    /**
     * 验证 API 密钥是否有效
     */
    abstract validateApiKey(): boolean
} 