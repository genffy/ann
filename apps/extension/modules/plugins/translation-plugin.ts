import { PluginBase } from '../../lib/core/plugin-base'
import { useAppStore } from '../../lib/store'
import { errorUtils } from '../../lib/helpers'
import { EVENT_TYPES } from '../../lib/constants'

/**
 * 翻译插件
 * 负责处理文本翻译功能
 */
export class TranslationPlugin extends PluginBase {
    readonly name = 'translation'
    readonly version = '1.0.0'
    readonly description = '文本翻译功能插件'

    private isTranslating = false

    /**
     * 初始化插件
     */
    initialize(center: any): void {
        super.initialize(center)

        // 监听翻译相关事件
        this.center?.on(EVENT_TYPES.TRANSLATE_START, this.handleTranslationStart.bind(this))
        this.center?.on(EVENT_TYPES.TRANSLATE_COMPLETE, this.handleTranslationComplete.bind(this))

        console.log('[TranslationPlugin] Translation service initialized')
    }

    /**
     * 销毁插件
     */
    destroy(): void {
        if (this.center) {
            this.center.off(EVENT_TYPES.TRANSLATION_START, this.handleTranslationStart.bind(this))
            this.center.off(EVENT_TYPES.TRANSLATION_COMPLETE, this.handleTranslationComplete.bind(this))
        }

        this.translationService = null
        super.destroy()
    }

    /**
     * 执行翻译功能
     */
    async execute(): Promise<void> {
        if (!this.isAvailable() || this.isTranslating) {
            console.warn('[TranslationPlugin] Plugin not available or already translating')
            return
        }

        try {
            const currentSelection = useAppStore.getState().currentSelection
            if (!currentSelection?.text) {
                console.warn('[TranslationPlugin] No text selected for translation')
                return
            }

            this.isTranslating = true

            // 更新UI状态
            useAppStore.getState().setTranslationLoading(true)
            useAppStore.getState().setTranslationError(null)

            // 触发翻译开始事件
            this.center?.emit(EVENT_TYPES.TRANSLATION_START, {
                text: currentSelection.text,
                timestamp: Date.now()
            })

            // 获取当前翻译配置
            const translationConfig = useAppStore.getState().translation
            const { provider, targetLanguage, sourceLanguage } = translationConfig

            console.log(`[TranslationPlugin] Translating "${currentSelection.text.substring(0, 50)}..." using ${provider}`)

            // 执行翻译
            const result = await this.translationService?.translate({
                text: currentSelection.text,
                provider,
                sourceLanguage,
                targetLanguage
            })

            if (result) {
                // 更新翻译结果
                useAppStore.getState().setTranslationResult(result)

                // 触发翻译完成事件
                this.center?.emit(EVENT_TYPES.TRANSLATION_COMPLETE, {
                    originalText: currentSelection.text,
                    result,
                    provider,
                    timestamp: Date.now()
                })

                console.log(`[TranslationPlugin] Translation completed: "${result.translatedText}"`)
            } else {
                throw new Error('Translation service returned no result')
            }

        } catch (error) {
            console.error('[TranslationPlugin] Translation failed:', error)

            const errorMessage = error instanceof Error ? error.message : '翻译失败，请重试'
            useAppStore.getState().setTranslationError(errorMessage)

            // 记录错误
            errorUtils.log(error as Error, 'TranslationPlugin.execute')

            // 触发错误事件
            this.center?.emit(EVENT_TYPES.TRANSLATION_ERROR, {
                error: errorMessage,
                timestamp: Date.now()
            })

        } finally {
            this.isTranslating = false
            useAppStore.getState().setTranslationLoading(false)
        }
    }

    /**
     * 获取插件配置
     */
    getConfig(): Record<string, any> {
        const translationConfig = useAppStore.getState().translation
        return {
            name: this.name,
            version: this.version,
            enabled: true,
            config: {
                provider: translationConfig.provider,
                targetLanguage: translationConfig.targetLanguage,
                sourceLanguage: translationConfig.sourceLanguage,
                autoDetectLanguage: translationConfig.autoDetectLanguage
            }
        }
    }

    /**
     * 更新插件配置
     */
    updateConfig(config: Record<string, any>): void {
        const { provider, targetLanguage, sourceLanguage, autoDetectLanguage } = config

        if (provider) {
            useAppStore.getState().setTranslationProvider(provider)
        }

        if (targetLanguage) {
            useAppStore.getState().setTranslationTargetLanguage(targetLanguage)
        }

        if (sourceLanguage) {
            useAppStore.getState().setTranslationSourceLanguage(sourceLanguage)
        }

        if (typeof autoDetectLanguage === 'boolean') {
            useAppStore.getState().setTranslationAutoDetect(autoDetectLanguage)
        }

        console.log('[TranslationPlugin] Configuration updated:', config)
    }

    /**
     * 切换翻译提供商
     */
    async switchProvider(provider: 'google' | 'baidu' | 'youdao'): Promise<void> {
        if (!this.isAvailable()) return

        try {
            useAppStore.getState().setTranslationProvider(provider)
            console.log(`[TranslationPlugin] Switched to ${provider} provider`)

            // 如果当前有翻译结果，使用新提供商重新翻译
            const currentSelection = useAppStore.getState().currentSelection
            const hasResult = useAppStore.getState().translation.result

            if (currentSelection?.text && hasResult) {
                await this.execute()
            }

        } catch (error) {
            errorUtils.log(error as Error, 'TranslationPlugin.switchProvider')
        }
    }

    /**
     * 切换目标语言
     */
    async switchTargetLanguage(language: string): Promise<void> {
        if (!this.isAvailable()) return

        try {
            useAppStore.getState().setTranslationTargetLanguage(language)
            console.log(`[TranslationPlugin] Switched target language to ${language}`)

            // 如果当前有翻译结果，重新翻译
            const currentSelection = useAppStore.getState().currentSelection
            const hasResult = useAppStore.getState().translation.result

            if (currentSelection?.text && hasResult) {
                await this.execute()
            }

        } catch (error) {
            errorUtils.log(error as Error, 'TranslationPlugin.switchTargetLanguage')
        }
    }

    /**
     * 清除翻译结果
     */
    clearResult(): void {
        useAppStore.getState().setTranslationResult(null)
        useAppStore.getState().setTranslationError(null)
        console.log('[TranslationPlugin] Translation result cleared')
    }

    // ===================
    // 私有方法
    // ===================

    /**
     * 处理翻译开始事件
     */
    private handleTranslationStart(data: any): void {
        console.log('[TranslationPlugin] Translation started for:', data.text?.substring(0, 50))
    }

    /**
     * 处理翻译完成事件
     */
    private handleTranslationComplete(data: any): void {
        console.log('[TranslationPlugin] Translation completed:', data.result?.translatedText?.substring(0, 50))
    }
} 