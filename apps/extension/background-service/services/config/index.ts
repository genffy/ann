import { defaultTranslationConfig, defaultTranslationRules } from './default-config'
import type { TranslationConfig, TranslationRules } from '../../../types/translate'
import { IService } from '../../service-manager'
import { ResponseMessage } from '../../../types/messages'
import { messageHandlers } from './message-handles'
import { Logger } from '../../../utils/logger'

export class ConfigService implements IService {
    readonly name = 'config' as const
    private static instance: ConfigService
    private initialized = false

    private constructor() {}

    static getInstance(): ConfigService {
        if (!ConfigService.instance) {
            ConfigService.instance = new ConfigService()
        }
        return ConfigService.instance
    }

    /**
     * 初始化配置服务
     */
    async initialize(): Promise<void> {
        if (this.initialized) {
            Logger.info('[ConfigService] Already initialized, skipping...')
            return
        }

        try {
            Logger.info('[ConfigService] Initializing configuration service...')
            
            const config = await browser.storage.sync.get(['translationConfig', 'translationRules'])

            if (!config.translationConfig) {
                await this.setTranslationConfig(defaultTranslationConfig)
                Logger.info('[ConfigService] Set default translation config')
            }

            if (!config.translationRules) {
                await this.setTranslationRules(defaultTranslationRules)
                Logger.info('[ConfigService] Set default translation rules')
            }

            this.initialized = true
            Logger.info('[ConfigService] Configuration service initialized successfully')
        } catch (error) {
            Logger.error('[ConfigService] Failed to initialize:', error)
            throw error
        }
    }

    /**
     * 获取消息处理器
     */
    getMessageHandlers(): Record<string, (message: any, sender: chrome.runtime.MessageSender) => Promise<ResponseMessage>> {
        return messageHandlers
    }

    /**
     * 检查服务是否已初始化
     */
    isInitialized(): boolean {
        return this.initialized
    }

    /**
     * 获取翻译配置
     */
    async getTranslationConfig(): Promise<TranslationConfig> {
        const result = await browser.storage.sync.get('translationConfig')
        return result.translationConfig || defaultTranslationConfig
    }

    /**
     * 设置翻译配置
     */
    async setTranslationConfig(config: TranslationConfig): Promise<void> {
        await browser.storage.sync.set({ translationConfig: config })
    }

    /**
     * 获取翻译规则
     */
    async getTranslationRules(): Promise<TranslationRules> {
        const result = await browser.storage.sync.get('translationRules')
        return result.translationRules || defaultTranslationRules
    }

    /**
     * 设置翻译规则
     */
    async setTranslationRules(rules: TranslationRules): Promise<void> {
        await browser.storage.sync.set({ translationRules: rules })
    }

    /**
     * 重置配置到默认值
     */
    async resetToDefaults(): Promise<void> {
        await this.setTranslationConfig(defaultTranslationConfig)
        await this.setTranslationRules(defaultTranslationRules)
        Logger.info('[ConfigService] Reset configuration to defaults')
    }

    /**
     * 清理资源
     */
    async cleanup(): Promise<void> {
        this.initialized = false
        Logger.info('[ConfigService] Cleaned up successfully')
    }
}
