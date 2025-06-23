import { defaultTranslationConfig, defaultTranslationRules, TranslationConfig, TranslationRules } from './default-config'

export class ConfigManager {
    /**
     * 获取翻译配置
     */
    static async getTranslationConfig(): Promise<TranslationConfig> {
        const result = await browser.storage.sync.get('translationConfig')
        return result.translationConfig || defaultTranslationConfig
    }

    /**
     * 设置翻译配置
     */
    static async setTranslationConfig(config: TranslationConfig): Promise<void> {
        await browser.storage.sync.set({ translationConfig: config })
    }

    /**
     * 获取翻译规则
     */
    static async getTranslationRules(): Promise<TranslationRules> {
        const result = await browser.storage.sync.get('translationRules')
        return result.translationRules || defaultTranslationRules
    }

    /**
     * 设置翻译规则
     */
    static async setTranslationRules(rules: TranslationRules): Promise<void> {
        await browser.storage.sync.set({ translationRules: rules })
    }

    /**
     * 初始化配置 - 设置默认值（如果不存在）
     */
    static async initializeConfig(): Promise<void> {
        const config = await browser.storage.sync.get(['translationConfig', 'translationRules'])

        if (!config.translationConfig) {
            await this.setTranslationConfig(defaultTranslationConfig)
        }

        if (!config.translationRules) {
            await this.setTranslationRules(defaultTranslationRules)
        }
    }

    /**
     * 重置配置到默认值
     */
    static async resetToDefaults(): Promise<void> {
        await this.setTranslationConfig(defaultTranslationConfig)
        await this.setTranslationRules(defaultTranslationRules)
    }
} 