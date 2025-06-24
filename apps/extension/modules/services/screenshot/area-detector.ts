import { errorUtils } from '../../../lib/helpers'
import { CaptureArea } from './screenshot-service'

/**
 * 区域检测类型
 */
export type DetectionMethod = 'direct' | 'smart' | 'visual' | 'semantic' | 'context'

/**
 * 检测配置
 */
export interface DetectionConfig {
    maxAreaRatio: number
    minAreaRatio: number
    maxSearchLevels: number
    semanticTags: string[]
    semanticClasses: string[]
    visualProperties: string[]
}

/**
 * 检测结果
 */
export interface DetectionResult {
    areas: CaptureArea[]
    method: DetectionMethod
    confidence: number
    metadata: Record<string, any>
}

/**
 * 区域检测器类
 * 专门负责各种智能区域检测算法
 */
export class AreaDetector {
    private static instance: AreaDetector | null = null

    private readonly config: DetectionConfig = {
        maxAreaRatio: 20,
        minAreaRatio: 1.2,
        maxSearchLevels: 5,
        semanticTags: ['article', 'section', 'main', 'header', 'footer', 'aside', 'nav'],
        semanticClasses: ['content', 'post', 'article', 'card', 'item', 'block', 'container'],
        visualProperties: ['border', 'borderRadius', 'boxShadow', 'backgroundColor', 'backgroundImage']
    }

    private constructor() { }

    /**
     * 获取单例实例
     */
    static getInstance(): AreaDetector {
        if (!AreaDetector.instance) {
            AreaDetector.instance = new AreaDetector()
        }
        return AreaDetector.instance
    }

    /**
     * 综合检测最佳区域
     */
    async detectBestAreas(
        selectionRect: DOMRect,
        selectedText: string,
        range?: Range
    ): Promise<DetectionResult[]> {
        const results: DetectionResult[] = []

        try {
            // 1. 直接区域检测
            const directResult = await this.detectDirectArea(selectionRect)
            results.push(directResult)

            // 2. 智能DOM检测
            if (range) {
                const smartResult = await this.detectSmartArea(range, selectionRect)
                if (smartResult.areas.length > 0) {
                    results.push(smartResult)
                }
            }

            // 3. 视觉容器检测
            const visualResult = await this.detectVisualContainers(selectionRect)
            if (visualResult.areas.length > 0) {
                results.push(visualResult)
            }

            // 4. 语义容器检测
            const semanticResult = await this.detectSemanticContainers(selectedText, selectionRect)
            if (semanticResult.areas.length > 0) {
                results.push(semanticResult)
            }

            // 5. 上下文感知检测
            const contextResult = await this.detectContextualAreas(selectionRect, selectedText)
            if (contextResult.areas.length > 0) {
                results.push(contextResult)
            }

            console.log(`[AreaDetector] Detected ${results.length} area sets`)
            return results

        } catch (error) {
            errorUtils.log(error as Error, 'AreaDetector.detectBestAreas')

            // 返回基础检测结果
            const fallbackResult = await this.detectDirectArea(selectionRect)
            return [fallbackResult]
        }
    }

    /**
     * 直接区域检测
     */
    private async detectDirectArea(selectionRect: DOMRect): Promise<DetectionResult> {
        const padding = 20

        const area: CaptureArea = {
            x: Math.max(0, selectionRect.x - padding),
            y: Math.max(0, selectionRect.y - padding),
            width: Math.min(
                window.innerWidth - (selectionRect.x - padding),
                selectionRect.width + padding * 2
            ),
            height: Math.min(
                window.innerHeight - (selectionRect.y - padding),
                selectionRect.height + padding * 2
            )
        }

        return {
            areas: [area],
            method: 'direct',
            confidence: 0.5,
            metadata: {
                padding,
                originalRect: {
                    x: selectionRect.x,
                    y: selectionRect.y,
                    width: selectionRect.width,
                    height: selectionRect.height
                }
            }
        }
    }

    /**
     * 智能DOM结构检测
     */
    private async detectSmartArea(
        range: Range,
        selectionRect: DOMRect
    ): Promise<DetectionResult> {
        const areas: CaptureArea[] = []

        try {
            const container = range.commonAncestorContainer
            let targetElement: Element

            // 找到合适的元素容器
            if (container.nodeType === Node.TEXT_NODE) {
                targetElement = container.parentElement!
            } else {
                targetElement = container as Element
            }

            // 向上遍历DOM树，寻找合适的容器
            const candidates = this.findContainerCandidates(targetElement, selectionRect)

            for (const candidate of candidates) {
                const rect = candidate.getBoundingClientRect()

                if (this.isValidContainer(rect, selectionRect)) {
                    areas.push({
                        x: rect.x,
                        y: rect.y,
                        width: rect.width,
                        height: rect.height,
                        element: candidate,
                        context: {
                            container: candidate,
                            siblings: Array.from(candidate.parentElement?.children || []),
                            parent: candidate.parentElement!
                        }
                    })
                }
            }

            return {
                areas,
                method: 'smart',
                confidence: areas.length > 0 ? 0.8 : 0.2,
                metadata: {
                    candidatesFound: candidates.length,
                    validContainers: areas.length
                }
            }

        } catch (error) {
            errorUtils.log(error as Error, 'AreaDetector.detectSmartArea')
            return {
                areas: [],
                method: 'smart',
                confidence: 0.1,
                metadata: { error: error.message }
            }
        }
    }

    /**
     * 视觉容器检测
     */
    private async detectVisualContainers(selectionRect: DOMRect): Promise<DetectionResult> {
        const areas: CaptureArea[] = []

        try {
            // 从选中区域中心点开始检测
            const centerX = selectionRect.x + selectionRect.width / 2
            const centerY = selectionRect.y + selectionRect.height / 2

            const elements = document.elementsFromPoint(centerX, centerY)

            for (const element of elements) {
                if (this.hasVisualBoundaries(element)) {
                    const rect = element.getBoundingClientRect()

                    if (this.isValidContainer(rect, selectionRect)) {
                        const visualScore = this.calculateVisualScore(element)

                        areas.push({
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
                        })
                    }
                }
            }

            // 按视觉评分排序
            areas.sort((a, b) => {
                const scoreA = this.calculateVisualScore(a.element!)
                const scoreB = this.calculateVisualScore(b.element!)
                return scoreB - scoreA
            })

            return {
                areas: areas.slice(0, 3), // 只返回前3个最佳候选
                method: 'visual',
                confidence: areas.length > 0 ? 0.7 : 0.2,
                metadata: {
                    totalCandidates: areas.length,
                    centerPoint: { x: centerX, y: centerY }
                }
            }

        } catch (error) {
            errorUtils.log(error as Error, 'AreaDetector.detectVisualContainers')
            return {
                areas: [],
                method: 'visual',
                confidence: 0.1,
                metadata: { error: error.message }
            }
        }
    }

    /**
     * 语义容器检测
     */
    private async detectSemanticContainers(
        selectedText: string,
        selectionRect: DOMRect
    ): Promise<DetectionResult> {
        const areas: CaptureArea[] = []

        try {
            // 构建语义选择器
            const selectors = [
                ...this.config.semanticTags,
                ...this.config.semanticClasses.map(cls => `[class*="${cls}"]`)
            ]

            for (const selector of selectors) {
                const elements = document.querySelectorAll(selector)

                for (const element of elements) {
                    const rect = element.getBoundingClientRect()

                    if (this.isValidContainer(rect, selectionRect)) {
                        // 检查文本相关性
                        const relevanceScore = this.calculateTextRelevance(
                            selectedText,
                            element.textContent || ''
                        )

                        if (relevanceScore > 0.1) {
                            areas.push({
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
                            })
                        }
                    }
                }
            }

            // 按语义相关性排序
            areas.sort((a, b) => {
                const scoreA = this.calculateSemanticScore(a.element!, selectedText)
                const scoreB = this.calculateSemanticScore(b.element!, selectedText)
                return scoreB - scoreA
            })

            return {
                areas: areas.slice(0, 5), // 返回前5个最佳候选
                method: 'semantic',
                confidence: areas.length > 0 ? 0.9 : 0.2,
                metadata: {
                    totalCandidates: areas.length,
                    selectorsUsed: selectors.length
                }
            }

        } catch (error) {
            errorUtils.log(error as Error, 'AreaDetector.detectSemanticContainers')
            return {
                areas: [],
                method: 'semantic',
                confidence: 0.1,
                metadata: { error: error.message }
            }
        }
    }

    /**
     * 上下文感知检测
     */
    private async detectContextualAreas(
        selectionRect: DOMRect,
        selectedText: string
    ): Promise<DetectionResult> {
        const areas: CaptureArea[] = []

        try {
            // 分析页面布局模式
            const layoutPattern = this.analyzeLayoutPattern()

            // 基于布局模式调整检测策略
            switch (layoutPattern) {
                case 'article':
                    areas.push(...await this.detectArticleLayout(selectionRect))
                    break
                case 'card':
                    areas.push(...await this.detectCardLayout(selectionRect))
                    break
                case 'list':
                    areas.push(...await this.detectListLayout(selectionRect))
                    break
                case 'grid':
                    areas.push(...await this.detectGridLayout(selectionRect))
                    break
                default:
                    areas.push(...await this.detectGenericLayout(selectionRect))
            }

            return {
                areas,
                method: 'context',
                confidence: areas.length > 0 ? 0.8 : 0.3,
                metadata: {
                    layoutPattern,
                    contextualAreas: areas.length
                }
            }

        } catch (error) {
            errorUtils.log(error as Error, 'AreaDetector.detectContextualAreas')
            return {
                areas: [],
                method: 'context',
                confidence: 0.1,
                metadata: { error: error.message }
            }
        }
    }

    // ===================
    // 私有辅助方法
    // ===================

    /**
     * 查找容器候选元素
     */
    private findContainerCandidates(element: Element, selectionRect: DOMRect): Element[] {
        const candidates: Element[] = []
        let current = element
        let level = 0

        while (current && level < this.config.maxSearchLevels) {
            candidates.push(current)

            if (current.parentElement) {
                current = current.parentElement
                level++
            } else {
                break
            }
        }

        return candidates
    }

    /**
     * 检查是否为有效容器
     */
    private isValidContainer(containerRect: DOMRect, selectionRect: DOMRect): boolean {
        // 检查是否包含选中区域
        if (!this.containsSelection(containerRect, selectionRect)) {
            return false
        }

        // 检查大小比例
        const areaRatio = (containerRect.width * containerRect.height) /
            (selectionRect.width * selectionRect.height)

        return areaRatio >= this.config.minAreaRatio && areaRatio <= this.config.maxAreaRatio
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
     * 检查是否有视觉边界
     */
    private hasVisualBoundaries(element: Element): boolean {
        const style = window.getComputedStyle(element)

        return (
            style.border !== 'none' ||
            style.borderRadius !== '0px' ||
            style.boxShadow !== 'none' ||
            style.backgroundColor !== 'rgba(0, 0, 0, 0)' ||
            style.backgroundImage !== 'none' ||
            style.outline !== 'none'
        )
    }

    /**
     * 计算视觉评分
     */
    private calculateVisualScore(element: Element): number {
        const style = window.getComputedStyle(element)
        let score = 0

        // 边框加分
        if (style.border !== 'none') score += 20
        if (style.borderRadius !== '0px') score += 15
        if (style.boxShadow !== 'none') score += 25

        // 背景加分
        if (style.backgroundColor !== 'rgba(0, 0, 0, 0)') score += 10
        if (style.backgroundImage !== 'none') score += 15

        // 其他视觉属性
        if (style.outline !== 'none') score += 5

        return score
    }

    /**
     * 计算文本相关性
     */
    private calculateTextRelevance(selectedText: string, containerText: string): number {
        if (!selectedText || !containerText) return 0

        const selectedWords = selectedText.toLowerCase().split(/\s+/)
        const containerWords = containerText.toLowerCase().split(/\s+/)

        let matches = 0
        for (const word of selectedWords) {
            if (containerWords.includes(word)) {
                matches++
            }
        }

        return matches / selectedWords.length
    }

    /**
     * 计算语义评分
     */
    private calculateSemanticScore(element: Element, selectedText: string): number {
        let score = 0

        // 标签名评分
        const tagName = element.tagName.toLowerCase()
        if (this.config.semanticTags.includes(tagName)) {
            score += 30
        }

        // 类名评分
        const className = element.className.toLowerCase()
        for (const cls of this.config.semanticClasses) {
            if (className.includes(cls)) {
                score += 20
                break
            }
        }

        // 文本相关性评分
        const relevance = this.calculateTextRelevance(selectedText, element.textContent || '')
        score += relevance * 50

        return score
    }

    /**
     * 分析页面布局模式
     */
    private analyzeLayoutPattern(): string {
        // 简化的布局模式识别
        const articles = document.querySelectorAll('article').length
        const cards = document.querySelectorAll('[class*="card"]').length
        const lists = document.querySelectorAll('ul, ol, [class*="list"]').length
        const grids = document.querySelectorAll('[class*="grid"], [class*="flex"]').length

        if (articles > 0) return 'article'
        if (cards > 2) return 'card'
        if (lists > 1) return 'list'
        if (grids > 1) return 'grid'

        return 'generic'
    }

    /**
     * 检测文章布局
     */
    private async detectArticleLayout(selectionRect: DOMRect): Promise<CaptureArea[]> {
        const areas: CaptureArea[] = []
        const articles = document.querySelectorAll('article, [class*="article"], [class*="content"]')

        for (const article of articles) {
            const rect = article.getBoundingClientRect()
            if (this.isValidContainer(rect, selectionRect)) {
                areas.push({
                    x: rect.x,
                    y: rect.y,
                    width: rect.width,
                    height: rect.height,
                    element: article
                })
            }
        }

        return areas
    }

    /**
     * 检测卡片布局
     */
    private async detectCardLayout(selectionRect: DOMRect): Promise<CaptureArea[]> {
        const areas: CaptureArea[] = []
        const cards = document.querySelectorAll('[class*="card"], [class*="item"], [class*="block"]')

        for (const card of cards) {
            const rect = card.getBoundingClientRect()
            if (this.isValidContainer(rect, selectionRect)) {
                areas.push({
                    x: rect.x,
                    y: rect.y,
                    width: rect.width,
                    height: rect.height,
                    element: card
                })
            }
        }

        return areas
    }

    /**
     * 检测列表布局
     */
    private async detectListLayout(selectionRect: DOMRect): Promise<CaptureArea[]> {
        const areas: CaptureArea[] = []
        const lists = document.querySelectorAll('li, [class*="list-item"], [class*="item"]')

        for (const item of lists) {
            const rect = item.getBoundingClientRect()
            if (this.isValidContainer(rect, selectionRect)) {
                areas.push({
                    x: rect.x,
                    y: rect.y,
                    width: rect.width,
                    height: rect.height,
                    element: item
                })
            }
        }

        return areas
    }

    /**
     * 检测网格布局
     */
    private async detectGridLayout(selectionRect: DOMRect): Promise<CaptureArea[]> {
        const areas: CaptureArea[] = []
        const gridItems = document.querySelectorAll('[class*="grid"] > *, [class*="flex"] > *')

        for (const item of gridItems) {
            const rect = item.getBoundingClientRect()
            if (this.isValidContainer(rect, selectionRect)) {
                areas.push({
                    x: rect.x,
                    y: rect.y,
                    width: rect.width,
                    height: rect.height,
                    element: item
                })
            }
        }

        return areas
    }

    /**
     * 检测通用布局
     */
    private async detectGenericLayout(selectionRect: DOMRect): Promise<CaptureArea[]> {
        const areas: CaptureArea[] = []
        const containers = document.querySelectorAll('div, section, main')

        for (const container of containers) {
            const rect = container.getBoundingClientRect()
            if (this.isValidContainer(rect, selectionRect)) {
                areas.push({
                    x: rect.x,
                    y: rect.y,
                    width: rect.width,
                    height: rect.height,
                    element: container
                })
            }
        }

        return areas.slice(0, 3) // 限制数量
    }
} 