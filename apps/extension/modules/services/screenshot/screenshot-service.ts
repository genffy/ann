import { errorUtils, domUtils } from '../../../lib/helpers'
import { SHARING_CONFIG } from '../../../lib/constants'

/**
 * 截图区域类型
 */
export interface CaptureArea {
    x: number
    y: number
    width: number
    height: number
    element?: Element
    context?: {
        container: Element
        siblings: Element[]
        parent: Element
    }
}

/**
 * 截图选项
 */
export interface ScreenshotOptions {
    format?: 'png' | 'jpeg' | 'webp'
    quality?: number
    scale?: number
    backgroundColor?: string
    allowTaint?: boolean
    useCORS?: boolean
    logging?: boolean
}

/**
 * 智能区域检测结果
 */
export interface SmartAreaResult {
    primary: CaptureArea
    alternatives: CaptureArea[]
    confidence: number
    reasoning: string
}

/**
 * 截图服务类
 * 负责智能区域检测和高质量截图生成
 */
export class ScreenshotService {
    private static instance: ScreenshotService | null = null

    private constructor() { }

    /**
     * 获取单例实例
     */
    static getInstance(): ScreenshotService {
        if (!ScreenshotService.instance) {
            ScreenshotService.instance = new ScreenshotService()
        }
        return ScreenshotService.instance
    }

    /**
     * 智能区域检测
     * 基于选中文本分析最佳截图区域
     */
    async detectSmartCaptureArea(
        selectionRect: DOMRect,
        selectedText: string,
        range?: Range
    ): Promise<SmartAreaResult> {
        try {
            console.log('[ScreenshotService] Starting smart area detection...')

            const alternatives: CaptureArea[] = []
            let primary: CaptureArea
            let confidence = 0.5
            let reasoning = ''

            // 方案1: 基于选中文本的直接区域
            const directArea = this.createDirectCaptureArea(selectionRect)
            alternatives.push(directArea)

            // 方案2: 基于DOM结构的智能扩展
            if (range) {
                const smartArea = await this.createSmartCaptureArea(range, selectionRect)
                if (smartArea) {
                    alternatives.push(smartArea)
                    confidence = Math.max(confidence, 0.8)
                }
            }

            // 方案3: 基于视觉容器的检测
            const containerArea = await this.detectVisualContainer(selectionRect)
            if (containerArea) {
                alternatives.push(containerArea)
                confidence = Math.max(confidence, 0.7)
            }

            // 方案4: 基于语义内容的检测
            const semanticArea = await this.detectSemanticContainer(selectedText, selectionRect)
            if (semanticArea) {
                alternatives.push(semanticArea)
                confidence = Math.max(confidence, 0.9)
            }

            // 选择最佳方案
            primary = this.selectBestCaptureArea(alternatives, selectionRect)
            reasoning = this.generateReasoningText(primary, alternatives)

            console.log(`[ScreenshotService] Smart detection completed. Confidence: ${confidence}`)

            return {
                primary,
                alternatives,
                confidence,
                reasoning
            }

        } catch (error) {
            errorUtils.log(error as Error, 'ScreenshotService.detectSmartCaptureArea')

            // 降级到简单区域
            const fallbackArea = this.createDirectCaptureArea(selectionRect)
            return {
                primary: fallbackArea,
                alternatives: [fallbackArea],
                confidence: 0.3,
                reasoning: '使用基础区域检测（智能检测失败）'
            }
        }
    }

    /**
     * 高质量截图生成
     */
    async captureScreenshot(
        area: CaptureArea,
        options: ScreenshotOptions = {}
    ): Promise<string | null> {
        try {
            console.log('[ScreenshotService] Starting screenshot capture...')

            const defaultOptions: ScreenshotOptions = {
                format: 'png',
                quality: 0.9,
                scale: window.devicePixelRatio || 1,
                backgroundColor: '#ffffff',
                allowTaint: false,
                useCORS: true,
                logging: false,
                ...options
            }

            // 方法1: 尝试使用html2canvas
            let imageData = await this.captureWithHtml2Canvas(area, defaultOptions)

            // 方法2: 如果失败，尝试使用dom-to-image
            if (!imageData) {
                imageData = await this.captureWithDomToImage(area, defaultOptions)
            }

            // 方法3: 如果都失败，使用Chrome截图API（如果可用）
            if (!imageData) {
                imageData = await this.captureWithChromeAPI(area)
            }

            if (imageData) {
                console.log('[ScreenshotService] Screenshot captured successfully')
                return imageData
            } else {
                throw new Error('All capture methods failed')
            }

        } catch (error) {
            errorUtils.log(error as Error, 'ScreenshotService.captureScreenshot')
            return null
        }
    }

    /**
     * 批量截图（支持多个区域）
     */
    async captureMultipleAreas(
        areas: CaptureArea[],
        options: ScreenshotOptions = {}
    ): Promise<Array<{ area: CaptureArea; imageData: string | null }>> {
        const results = []

        for (const area of areas) {
            const imageData = await this.captureScreenshot(area, options)
            results.push({ area, imageData })
        }

        return results
    }

    // ===================
    // 私有方法 - 区域检测
    // ===================

    /**
     * 创建直接截图区域
     */
    private createDirectCaptureArea(selectionRect: DOMRect): CaptureArea {
        const padding = SHARING_CONFIG.screenshot.expandPadding

        return {
            x: Math.max(0, selectionRect.x - padding),
            y: Math.max(0, selectionRect.y - padding),
            width: Math.min(
                window.innerWidth - selectionRect.x + padding,
                selectionRect.width + padding * 2
            ),
            height: Math.min(
                window.innerHeight - selectionRect.y + padding,
                selectionRect.height + padding * 2
            )
        }
    }

    /**
     * 基于DOM结构创建智能截图区域
     */
    private async createSmartCaptureArea(
        range: Range,
        selectionRect: DOMRect
    ): Promise<CaptureArea | null> {
        try {
            const container = range.commonAncestorContainer
            let targetElement: Element

            // 找到合适的容器元素
            if (container.nodeType === Node.TEXT_NODE) {
                targetElement = container.parentElement!
            } else {
                targetElement = container as Element
            }

            // 向上查找更合适的容器
            targetElement = this.findOptimalContainer(targetElement)

            const elementRect = targetElement.getBoundingClientRect()

            // 检查是否比选中区域大得多（避免截取过大区域）
            const areaRatio = (elementRect.width * elementRect.height) /
                (selectionRect.width * selectionRect.height)

            if (areaRatio > 10) {
                return null // 区域过大，不适合
            }

            return {
                x: elementRect.x,
                y: elementRect.y,
                width: elementRect.width,
                height: elementRect.height,
                element: targetElement,
                context: {
                    container: targetElement,
                    siblings: Array.from(targetElement.parentElement?.children || []),
                    parent: targetElement.parentElement!
                }
            }

        } catch (error) {
            errorUtils.log(error as Error, 'ScreenshotService.createSmartCaptureArea')
            return null
        }
    }

    /**
     * 检测视觉容器
     */
    private async detectVisualContainer(selectionRect: DOMRect): Promise<CaptureArea | null> {
        try {
            // 在选中区域周围查找视觉边界
            const elements = document.elementsFromPoint(
                selectionRect.x + selectionRect.width / 2,
                selectionRect.y + selectionRect.height / 2
            )

            for (const element of elements) {
                if (this.isVisualContainer(element)) {
                    const rect = element.getBoundingClientRect()

                    // 检查是否合理包含选中区域
                    if (this.isReasonableContainer(rect, selectionRect)) {
                        return {
                            x: rect.x,
                            y: rect.y,
                            width: rect.width,
                            height: rect.height,
                            element,
                            context: {
                                container: element,
                                siblings: Array.from(element.parentElement?.children || []),
                                parent: element.parentElement!
                            }
                        }
                    }
                }
            }

            return null

        } catch (error) {
            errorUtils.log(error as Error, 'ScreenshotService.detectVisualContainer')
            return null
        }
    }

    /**
     * 检测语义容器
     */
    private async detectSemanticContainer(
        selectedText: string,
        selectionRect: DOMRect
    ): Promise<CaptureArea | null> {
        try {
            // 基于文本内容分析语义容器
            const semanticTags = ['article', 'section', 'main', 'div[class*="content"]',
                'div[class*="post"]', 'div[class*="article"]']

            for (const selector of semanticTags) {
                const elements = document.querySelectorAll(selector)

                for (const element of elements) {
                    const rect = element.getBoundingClientRect()

                    // 检查是否包含选中区域且大小合理
                    if (this.containsSelection(rect, selectionRect) &&
                        this.isReasonableContainer(rect, selectionRect)) {

                        // 进一步检查文本相关性
                        const elementText = element.textContent || ''
                        if (this.isTextRelated(selectedText, elementText)) {
                            return {
                                x: rect.x,
                                y: rect.y,
                                width: rect.width,
                                height: rect.height,
                                element,
                                context: {
                                    container: element,
                                    siblings: Array.from(element.parentElement?.children || []),
                                    parent: element.parentElement!
                                }
                            }
                        }
                    }
                }
            }

            return null

        } catch (error) {
            errorUtils.log(error as Error, 'ScreenshotService.detectSemanticContainer')
            return null
        }
    }

    // ===================
    // 私有方法 - 截图实现
    // ===================

    /**
     * 使用html2canvas进行截图
     */
    private async captureWithHtml2Canvas(
        area: CaptureArea,
        options: ScreenshotOptions
    ): Promise<string | null> {
        try {
            // 动态导入html2canvas
            const html2canvas = await import('html2canvas')

            const targetElement = (area.element as HTMLElement) || document.body

            const canvas = await html2canvas.default(targetElement, {
                x: area.x,
                y: area.y,
                width: area.width,
                height: area.height,
                scale: options.scale,
                backgroundColor: options.backgroundColor,
                allowTaint: options.allowTaint,
                useCORS: options.useCORS,
                logging: options.logging,
                imageTimeout: 15000,
                removeContainer: true,
                foreignObjectRendering: true
            })

            return canvas.toDataURL(`image/${options.format}`, options.quality)

        } catch (error) {
            console.warn('[ScreenshotService] html2canvas capture failed:', error)
            return null
        }
    }

    /**
     * 使用dom-to-image进行截图
     */
    private async captureWithDomToImage(
        area: CaptureArea,
        options: ScreenshotOptions
    ): Promise<string | null> {
        try {
            // 动态导入dom-to-image
            const domToImage = await import('dom-to-image')

            const targetElement = (area.element as HTMLElement) || document.body

            let imageData: string

            switch (options.format) {
                case 'jpeg':
                    imageData = await (domToImage as any).toJpeg(targetElement, {
                        quality: options.quality,
                        bgcolor: options.backgroundColor
                    })
                    break
                case 'png':
                default:
                    imageData = await (domToImage as any).toPng(targetElement, {
                        bgcolor: options.backgroundColor
                    })
                    break
            }

            return imageData

        } catch (error) {
            console.warn('[ScreenshotService] dom-to-image capture failed:', error)
            return null
        }
    }

    /**
     * 使用Chrome API进行截图（如果可用）
     */
    private async captureWithChromeAPI(area: CaptureArea): Promise<string | null> {
        try {
            // 这需要在background script中实现
            // 这里只是发送消息请求截图
            if (typeof chrome !== 'undefined' && chrome.runtime) {
                const response = await chrome.runtime.sendMessage({
                    type: 'CAPTURE_VISIBLE_TAB',
                    area: area
                })

                return response.imageData || null
            }

            return null

        } catch (error) {
            console.warn('[ScreenshotService] Chrome API capture failed:', error)
            return null
        }
    }

    // ===================
    // 私有方法 - 辅助函数
    // ===================

    /**
     * 找到最优容器元素
     */
    private findOptimalContainer(element: Element): Element {
        const maxLevels = 5
        let current = element
        let level = 0

        while (current.parentElement && level < maxLevels) {
            const parent = current.parentElement

            // 检查父元素是否是更好的容器
            if (this.isVisualContainer(parent) || this.isSemanticContainer(parent)) {
                const parentRect = parent.getBoundingClientRect()
                const currentRect = current.getBoundingClientRect()

                // 如果父元素不会过度扩大区域，则选择父元素
                const areaIncrease = (parentRect.width * parentRect.height) /
                    (currentRect.width * currentRect.height)

                if (areaIncrease < 3) {
                    current = parent
                }
            }

            level++
        }

        return current
    }

    /**
     * 检查是否为视觉容器
     */
    private isVisualContainer(element: Element): boolean {
        const style = window.getComputedStyle(element)

        return (
            style.border !== 'none' ||
            style.borderRadius !== '0px' ||
            style.boxShadow !== 'none' ||
            style.backgroundColor !== 'rgba(0, 0, 0, 0)' ||
            style.backgroundImage !== 'none'
        )
    }

    /**
     * 检查是否为语义容器
     */
    private isSemanticContainer(element: Element): boolean {
        const tagName = element.tagName.toLowerCase()
        const className = element.className.toLowerCase()

        const semanticTags = ['article', 'section', 'main', 'header', 'footer', 'aside']
        const semanticClasses = ['content', 'post', 'article', 'card', 'item', 'block']

        return semanticTags.includes(tagName) ||
            semanticClasses.some(cls => className.includes(cls))
    }

    /**
     * 检查容器是否合理
     */
    private isReasonableContainer(containerRect: DOMRect, selectionRect: DOMRect): boolean {
        // 检查是否包含选中区域
        if (!this.containsSelection(containerRect, selectionRect)) {
            return false
        }

        // 检查大小是否合理（不能过大或过小）
        const areaRatio = (containerRect.width * containerRect.height) /
            (selectionRect.width * selectionRect.height)

        return areaRatio >= 1.2 && areaRatio <= 20
    }

    /**
     * 检查是否包含选中区域
     */
    private containsSelection(containerRect: DOMRect, selectionRect: DOMRect): boolean {
        return containerRect.x <= selectionRect.x &&
            containerRect.y <= selectionRect.y &&
            containerRect.x + containerRect.width >= selectionRect.x + selectionRect.width &&
            containerRect.y + containerRect.height >= selectionRect.y + selectionRect.height
    }

    /**
     * 检查文本相关性
     */
    private isTextRelated(selectedText: string, containerText: string): boolean {
        if (!selectedText || !containerText) return false

        // 简单的文本包含检查
        return containerText.includes(selectedText) ||
            selectedText.length / containerText.length > 0.1
    }

    /**
     * 选择最佳截图区域
     */
    private selectBestCaptureArea(
        alternatives: CaptureArea[],
        selectionRect: DOMRect
    ): CaptureArea {
        if (alternatives.length === 0) {
            return this.createDirectCaptureArea(selectionRect)
        }

        // 评分算法选择最佳区域
        let bestArea = alternatives[0]
        let bestScore = 0

        for (const area of alternatives) {
            const score = this.scoreArea(area, selectionRect)
            if (score > bestScore) {
                bestScore = score
                bestArea = area
            }
        }

        return bestArea
    }

    /**
     * 区域评分
     */
    private scoreArea(area: CaptureArea, selectionRect: DOMRect): number {
        let score = 0

        // 大小合理性评分
        const areaRatio = (area.width * area.height) / (selectionRect.width * selectionRect.height)
        if (areaRatio >= 1.2 && areaRatio <= 5) {
            score += 30
        } else if (areaRatio <= 10) {
            score += 15
        }

        // 语义容器加分
        if (area.element && this.isSemanticContainer(area.element)) {
            score += 25
        }

        // 视觉容器加分
        if (area.element && this.isVisualContainer(area.element)) {
            score += 20
        }

        // 上下文信息加分
        if (area.context) {
            score += 10
        }

        return score
    }

    /**
     * 生成推理文本
     */
    private generateReasoningText(primary: CaptureArea, alternatives: CaptureArea[]): string {
        let reasoning = '基于'

        if (primary.element) {
            if (this.isSemanticContainer(primary.element)) {
                reasoning += '语义容器'
            } else if (this.isVisualContainer(primary.element)) {
                reasoning += '视觉容器'
            } else {
                reasoning += 'DOM结构'
            }
        } else {
            reasoning += '选中区域'
        }

        reasoning += `检测，从${alternatives.length}个候选区域中选择最佳方案`

        return reasoning
    }
} 