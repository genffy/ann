import { PluginBase } from '../../lib/core/plugin-base'
import { useAppStore } from '../../lib/store'
import { errorUtils, domUtils } from '../../lib/helpers'
import { EVENT_TYPES, SHARING_CONFIG } from '../../lib/constants'

/**
 * 分享插件
 * 负责处理截图和分享功能
 */
export class SharingPlugin extends PluginBase {
    readonly name = 'sharing'
    readonly version = '1.0.0'
    readonly description = '截图分享功能插件'

    private isCapturing = false

    /**
     * 初始化插件
     */
    initialize(center: any): void {
        super.initialize(center)

        // 监听分享相关事件
        this.center?.on(EVENT_TYPES.SHARING_CAPTURE, this.handleSharingCapture.bind(this))

        console.log('[SharingPlugin] Sharing service initialized')
    }

    /**
     * 销毁插件
     */
    destroy(): void {
        if (this.center) {
            this.center.off(EVENT_TYPES.SHARING_CAPTURE, this.handleSharingCapture.bind(this))
        }

        super.destroy()
    }

    /**
     * 执行分享功能
     */
    async execute(): Promise<void> {
        if (!this.isAvailable() || this.isCapturing) {
            console.warn('[SharingPlugin] Plugin not available or already capturing')
            return
        }

        try {
            const currentSelection = useAppStore.getState().currentSelection
            if (!currentSelection) {
                console.warn('[SharingPlugin] No text selected for sharing')
                return
            }

            this.isCapturing = true

            // 更新UI状态
            useAppStore.getState().setSharingCapturing(true)
            useAppStore.getState().setSharingError(null)

            console.log(`[SharingPlugin] Starting capture for selected text`)

            // 计算扩展区域
            const captureArea = this.calculateCaptureArea(currentSelection.boundingRect!)

            // 执行截图
            const imageData = await this.captureScreenshot(captureArea)

            if (imageData) {
                // 更新截图结果
                useAppStore.getState().setSharingImage(imageData)

                // 触发截图完成事件
                this.center?.emit(EVENT_TYPES.SHARING_CAPTURE, {
                    imageData,
                    captureArea,
                    timestamp: Date.now()
                })

                console.log(`[SharingPlugin] Screenshot captured successfully`)
            } else {
                throw new Error('Screenshot capture failed')
            }

        } catch (error) {
            console.error('[SharingPlugin] Sharing failed:', error)

            const errorMessage = error instanceof Error ? error.message : '截图失败，请重试'
            useAppStore.getState().setSharingError(errorMessage)

            // 记录错误
            errorUtils.log(error as Error, 'SharingPlugin.execute')

        } finally {
            this.isCapturing = false
            useAppStore.getState().setSharingCapturing(false)
        }
    }

    /**
     * 开始编辑截图
     */
    startEditing(): void {
        if (!this.isAvailable()) return

        const imageData = useAppStore.getState().sharing.capturedImage
        if (!imageData) {
            console.warn('[SharingPlugin] No image to edit')
            return
        }

        useAppStore.getState().setSharingEditing(true)
        console.log('[SharingPlugin] Started image editing')
    }

    /**
     * 结束编辑截图
     */
    finishEditing(editedImageData?: string): void {
        if (!this.isAvailable()) return

        if (editedImageData) {
            useAppStore.getState().setSharingImage(editedImageData)
        }

        useAppStore.getState().setSharingEditing(false)
        console.log('[SharingPlugin] Finished image editing')
    }

    /**
     * 下载截图
     */
    async downloadImage(): Promise<void> {
        if (!this.isAvailable()) return

        try {
            const imageData = useAppStore.getState().sharing.capturedImage
            if (!imageData) {
                throw new Error('No image to download')
            }

            // 创建下载链接
            const link = document.createElement('a')
            link.href = imageData
            link.download = `ann-screenshot-${Date.now()}.png`
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)

            console.log('[SharingPlugin] Image downloaded')

        } catch (error) {
            errorUtils.log(error as Error, 'SharingPlugin.downloadImage')
            throw error
        }
    }

    /**
     * 复制到剪贴板
     */
    async copyToClipboard(): Promise<void> {
        if (!this.isAvailable()) return

        try {
            const imageData = useAppStore.getState().sharing.capturedImage
            if (!imageData) {
                throw new Error('No image to copy')
            }

            // 将base64转换为blob
            const response = await fetch(imageData)
            const blob = await response.blob()

            // 复制到剪贴板
            await navigator.clipboard.write([
                new ClipboardItem({ 'image/png': blob })
            ])

            console.log('[SharingPlugin] Image copied to clipboard')

        } catch (error) {
            errorUtils.log(error as Error, 'SharingPlugin.copyToClipboard')
            throw error
        }
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
                screenshotFormat: SHARING_CONFIG.screenshot.format,
                screenshotQuality: SHARING_CONFIG.screenshot.quality,
                expandPadding: SHARING_CONFIG.screenshot.expandPadding,
                enabledChannels: Object.keys(SHARING_CONFIG.channels).filter(
                    key => SHARING_CONFIG.channels[key as keyof typeof SHARING_CONFIG.channels].enabled
                )
            }
        }
    }

    /**
     * 更新插件配置
     */
    updateConfig(config: Record<string, any>): void {
        console.log('[SharingPlugin] Configuration updated:', config)
    }

    /**
     * 清除分享结果
     */
    clearResult(): void {
        useAppStore.getState().setSharingImage(null)
        useAppStore.getState().setSharingEditing(false)
        useAppStore.getState().setSharingError(null)
        console.log('[SharingPlugin] Sharing result cleared')
    }

    // ===================
    // 私有方法
    // ===================

    /**
     * 计算截图区域
     */
    private calculateCaptureArea(selectionRect: DOMRect): DOMRect {
        const padding = SHARING_CONFIG.screenshot.expandPadding

        // 扩展选择区域
        const expandedRect = new DOMRect(
            Math.max(0, selectionRect.left - padding),
            Math.max(0, selectionRect.top - padding),
            Math.min(window.innerWidth, selectionRect.width + padding * 2),
            Math.min(window.innerHeight, selectionRect.height + padding * 2)
        )

        return expandedRect
    }

    /**
     * 执行截图
     */
    private async captureScreenshot(area: DOMRect): Promise<string | null> {
        try {
            // 检查是否支持 getDisplayMedia
            if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
                throw new Error('Screenshot API not supported')
            }

            // 简化版截图实现：使用 Canvas API 模拟
            const canvas = document.createElement('canvas')
            const ctx = canvas.getContext('2d')

            if (!ctx) {
                throw new Error('Canvas context not available')
            }

            canvas.width = area.width
            canvas.height = area.height

            // 填充背景色（模拟截图）
            ctx.fillStyle = '#ffffff'
            ctx.fillRect(0, 0, canvas.width, canvas.height)

            // 添加选中文本信息（模拟）
            ctx.fillStyle = '#333333'
            ctx.font = '14px Arial'
            ctx.textAlign = 'center'
            ctx.fillText('ANN 截图功能', canvas.width / 2, canvas.height / 2)
            ctx.fillText('选中文本区域', canvas.width / 2, canvas.height / 2 + 20)

            // 转换为base64
            return canvas.toDataURL(SHARING_CONFIG.screenshot.format, SHARING_CONFIG.screenshot.quality)

        } catch (error) {
            errorUtils.log(error as Error, 'SharingPlugin.captureScreenshot')
            return null
        }
    }

    /**
     * 处理分享捕获事件
     */
    private handleSharingCapture(data: any): void {
        console.log('[SharingPlugin] Screenshot captured:', data.captureArea)
    }
} 