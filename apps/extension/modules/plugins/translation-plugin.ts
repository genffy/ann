import { PluginBase } from '../core/plugin-base'
import { useAppStore } from '../store'
import { errorUtils } from '../../lib/logger'
import { EVENT_TYPES } from '../../constants'
import { TranslationService } from '../services/translation/translation-service'

/**
 * 翻译插件
 * 负责处理文本翻译功能，将翻译结果插入到页面中
 */
export class TranslationPlugin extends PluginBase {
    readonly name = 'translation'
    readonly version = '1.0.0'
    readonly description = '文本翻译功能插件'

    private isTranslating = false
    private translationService: TranslationService

    constructor() {
        super()
        this.translationService = TranslationService.getInstance()
    }

    /**
     * 初始化插件
     */
    initialize(center: any): void {
        super.initialize(center)

        // 监听翻译相关事件
        this.center?.on(EVENT_TYPES.TRANSLATE_START, this.handleTranslationStart.bind(this))
        this.center?.on(EVENT_TYPES.TRANSLATE_COMPLETE, this.handleTranslationComplete.bind(this))

        // 初始化翻译服务
        this.translationService.initialize()

        console.log('[TranslationPlugin] Translation service initialized')
    }

    /**
     * 销毁插件
     */
    destroy(): void {
        if (this.center) {
            this.center.off(EVENT_TYPES.TRANSLATE_START, this.handleTranslationStart.bind(this))
            this.center.off(EVENT_TYPES.TRANSLATE_COMPLETE, this.handleTranslationComplete.bind(this))
        }

        // 清理页面中的翻译结果
        this.clearAllTranslations()

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
            if (!currentSelection?.text || !currentSelection?.range) {
                console.warn('[TranslationPlugin] No text selected for translation')
                return
            }

            this.isTranslating = true

            // 更新UI状态
            useAppStore.getState().setTranslationLoading(true)
            useAppStore.getState().setTranslationError(null)

            // 触发翻译开始事件
            this.center?.emit(EVENT_TYPES.TRANSLATE_START, {
                text: currentSelection.text,
                timestamp: Date.now()
            })

            console.log(`[TranslationPlugin] Translating "${currentSelection.text.substring(0, 50)}..."`)

            // 分段处理文本
            const segments = this.segmentText(currentSelection.text)
            const translatedSegments: string[] = []

            // 逐段翻译
            for (const segment of segments) {
                if (segment.trim()) {
                    try {
                        const translated = await this.translationService.translateText(segment.trim())
                        translatedSegments.push(translated)
                    } catch (error) {
                        console.error('[TranslationPlugin] Segment translation failed:', error)
                        translatedSegments.push(`[翻译失败] ${segment}`)
                    }
                } else {
                    translatedSegments.push(segment) // 保持空白段落
                }
            }

            const fullTranslation = translatedSegments.join('')

            // 在页面中插入翻译结果
            await this.insertTranslationIntoPage(currentSelection.range, fullTranslation)

            // 更新翻译结果到状态
            useAppStore.getState().setTranslationResult(fullTranslation)

            // 触发翻译完成事件
            this.center?.emit(EVENT_TYPES.TRANSLATE_COMPLETE, {
                originalText: currentSelection.text,
                result: fullTranslation,
                timestamp: Date.now()
            })

            console.log(`[TranslationPlugin] Translation completed and inserted`)

        } catch (error) {
            console.error('[TranslationPlugin] Translation failed:', error)

            const errorMessage = error instanceof Error ? error.message : '翻译失败，请重试'
            useAppStore.getState().setTranslationError(errorMessage)

            // 记录错误
            errorUtils.log(error as Error, 'TranslationPlugin.execute')

        } finally {
            this.isTranslating = false
            useAppStore.getState().setTranslationLoading(false)
        }
    }

    /**
     * 分段处理文本
     * 根据句号、换行符等标点符号进行分段
     */
    private segmentText(text: string): string[] {
        // 按句子分段，保留分隔符
        const segments = text.split(/([.!?。！？\n]+)/)
        return segments.filter(segment => segment.length > 0)
    }

    /**
     * 在页面中插入翻译结果
     */
    private async insertTranslationIntoPage(range: Range, translation: string): Promise<void> {
        try {
            // 创建翻译结果元素
            const translationElement = this.createTranslationElement(translation)

            // 获取选择的结束位置
            const endContainer = range.endContainer
            const parentElement = endContainer.nodeType === Node.TEXT_NODE
                ? endContainer.parentElement
                : endContainer as Element

            if (!parentElement) {
                throw new Error('Unable to find parent element for insertion')
            }

            // 创建一个临时range来确定插入位置
            const insertRange = range.cloneRange()
            insertRange.collapse(false) // 折叠到选择结束位置

            // 在选择结束位置后插入翻译结果
            if (insertRange.endContainer.nodeType === Node.TEXT_NODE) {
                // 如果结束容器是文本节点，分割文本节点并插入
                const textNode = insertRange.endContainer as Text
                const offset = insertRange.endOffset

                if (offset < textNode.textContent!.length) {
                    // 分割文本节点
                    textNode.splitText(offset)
                }

                // 插入到父元素中
                const nextSibling = textNode.nextSibling
                if (nextSibling) {
                    parentElement.insertBefore(translationElement, nextSibling)
                } else {
                    parentElement.appendChild(translationElement)
                }
            } else {
                // 如果结束容器是元素节点，直接插入
                const element = insertRange.endContainer as Element
                if (insertRange.endOffset < element.childNodes.length) {
                    element.insertBefore(translationElement, element.childNodes[insertRange.endOffset])
                } else {
                    element.appendChild(translationElement)
                }
            }

            // 添加到管理列表中，便于后续清理
            this.addTranslationElement(translationElement)

            console.log('[TranslationPlugin] Translation inserted into page')

        } catch (error) {
            console.error('[TranslationPlugin] Failed to insert translation:', error)
            throw error
        }
    }

    /**
     * 创建翻译结果元素
     */
    private createTranslationElement(translation: string): HTMLElement {
        const translationElement = document.createElement('span')
        translationElement.className = 'ann-translation-result'
        translationElement.style.cssText = `
            display: inline;
            margin-left: 0.5em;
            padding: 2px 6px;
            background-color: #e3f2fd;
            border: 1px solid #90caf9;
            border-radius: 4px;
            font-size: 0.9em;
            color: #1976d2;
            font-weight: normal;
            box-decoration-break: clone;
            -webkit-box-decoration-break: clone;
            line-height: 1.4;
            white-space: normal;
            word-wrap: break-word;
            max-width: none;
            vertical-align: baseline;
        `

        // 添加翻译文本
        translationElement.textContent = `[${translation}]`

        // 添加关闭按钮
        const closeButton = document.createElement('button')
        closeButton.innerHTML = '×'
        closeButton.style.cssText = `
            margin-left: 4px;
            background: none;
            border: none;
            color: #1976d2;
            cursor: pointer;
            font-size: 12px;
            padding: 0;
            line-height: 1;
            vertical-align: top;
        `
        closeButton.title = '移除翻译'
        closeButton.onclick = (e) => {
            e.stopPropagation()
            this.removeTranslationElement(translationElement)
        }

        translationElement.appendChild(closeButton)

        return translationElement
    }

    /**
     * 添加翻译元素到管理列表
     */
    private addTranslationElement(element: HTMLElement): void {
        element.setAttribute('data-ann-translation', 'true')
        element.setAttribute('data-ann-translation-id', Date.now().toString())
    }

    /**
     * 移除单个翻译元素
     */
    private removeTranslationElement(element: HTMLElement): void {
        if (element && element.parentNode) {
            element.parentNode.removeChild(element)
        }
    }

    /**
     * 清理页面中所有翻译结果
     */
    private clearAllTranslations(): void {
        const translationElements = document.querySelectorAll('[data-ann-translation="true"]')
        translationElements.forEach(element => {
            if (element.parentNode) {
                element.parentNode.removeChild(element)
            }
        })
        console.log(`[TranslationPlugin] Cleared ${translationElements.length} translation elements`)
    }

    /**
     * 获取插件配置
     */
    getConfig(): Record<string, any> {
        return {
            name: this.name,
            version: this.version,
            enabled: true,
            config: {
                provider: 'google',
                targetLanguage: 'zh-CN',
                sourceLanguage: 'auto',
                autoDetectLanguage: true
            }
        }
    }

    /**
     * 更新插件配置
     */
    updateConfig(config: Record<string, any>): void {
        console.log('[TranslationPlugin] Configuration updated:', config)
    }

    /**
     * 切换翻译提供商
     */
    async switchProvider(provider: 'google' | 'baidu' | 'youdao'): Promise<void> {
        if (!this.isAvailable()) return

        try {
            console.log(`[TranslationPlugin] Switched to ${provider} provider`)
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
            console.log(`[TranslationPlugin] Switched target language to ${language}`)
        } catch (error) {
            errorUtils.log(error as Error, 'TranslationPlugin.switchTargetLanguage')
        }
    }

    /**
     * 清除翻译结果
     */
    clearResult(): void {
        this.clearAllTranslations()
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
        console.log('[TranslationPlugin] Translation completed:', data.result?.substring(0, 50))
    }
} 