import { MixedSelectionContent } from "@/types/dom"

// DOM 操作工具
export const domUtils = {
    // 获取元素相对于视口的位置
    getElementPosition: (element: Element): DOMRect => {
        return element.getBoundingClientRect()
    },

    // 获取文本选择的边界矩形
    getSelectionBounds: (selection: Selection): DOMRect | null => {
        if (selection.rangeCount === 0) return null
        const range = selection.getRangeAt(0)
        return range.getBoundingClientRect()
    },

    // 计算工具栏最佳位置
    calculateToolbarPosition: (
        selectionRect: DOMRect,
        toolbarWidth: number,
        toolbarHeight: number
    ): { x: number; y: number } => {
        const viewport = {
            width: window.innerWidth,
            height: window.innerHeight
        }

        // 默认位置：选择区域上方居中
        let x = selectionRect.left + (selectionRect.width - toolbarWidth) / 2
        let y = selectionRect.top - toolbarHeight - 10

        // 边界检测和调整
        if (x < 10) x = 10
        if (x + toolbarWidth > viewport.width - 10) {
            x = viewport.width - toolbarWidth - 10
        }

        // 如果上方空间不足，放到下方
        if (y < 10) {
            y = selectionRect.bottom + 10
        }

        return { x, y }
    },

    // 创建并插入样式
    injectStyles: (css: string, id?: string): HTMLStyleElement => {
        const style = document.createElement('style')
        style.textContent = css
        if (id) style.id = id
        document.head.appendChild(style)
        return style
    },

    // 移除元素
    removeElement: (selector: string): void => {
        const element = document.querySelector(selector)
        if (element) element.remove()
    },

    // 检测元素是否在视口内
    isInViewport: (element: Element): boolean => {
        const rect = element.getBoundingClientRect()
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= window.innerHeight &&
            rect.right <= window.innerWidth
        )
    },

    // 检测选择内容是否包含图片以及提取混合内容
    extractMixedSelectionContent: (selection: Selection): MixedSelectionContent => {
        const result: MixedSelectionContent = {
            text: '',
            images: [],
            hasText: false,
            hasImages: false,
            totalElements: 0
        }

        if (!selection || selection.rangeCount === 0) {
            return result
        }

        const range = selection.getRangeAt(0)
        const text = selection.toString().trim()

        // 获取文本内容
        if (text && text.length > 0) {
            result.text = text
            result.hasText = true
        }

        // 使用Set来追踪已添加的图片（通过src去重）
        const addedImageSrcs = new Set<string>()

        // 方法1：检查选择范围内所有图片元素（使用原始DOM，避免克隆问题）
        try {
            const rangeRect = range.getBoundingClientRect()
            const allImages = document.querySelectorAll('img')

            allImages.forEach(img => {
                const imgRect = img.getBoundingClientRect()

                // 检查图片是否与选择范围重叠或包含在内
                if (domUtils.isRectOverlapping(imgRect, rangeRect) ||
                    domUtils.isRectContained(imgRect, rangeRect)) {

                    const imgSrc = img.src || img.dataset.src || ''
                    const imgKey = `${imgSrc}-${img.alt}-${Math.round(imgRect.x)}-${Math.round(imgRect.y)}`

                    // 使用更精确的去重标识
                    if (!addedImageSrcs.has(imgKey)) {
                        addedImageSrcs.add(imgKey)
                        result.images.push({
                            element: img,
                            src: imgSrc,
                            alt: img.alt || '',
                            rect: imgRect
                        })
                        result.hasImages = true
                    }
                }
            })
        } catch (error) {
            console.warn('Error checking image overlap:', error)
        }

        // 方法2：通过Range直接检查包含的节点（作为补充）
        try {
            const container = range.commonAncestorContainer
            const walker = document.createTreeWalker(
                container,
                NodeFilter.SHOW_ELEMENT,
                {
                    acceptNode: (node) => {
                        // 只接受在选择范围内的节点
                        try {
                            if (range.intersectsNode && range.intersectsNode(node)) {
                                return NodeFilter.FILTER_ACCEPT
                            }
                            return NodeFilter.FILTER_SKIP
                        } catch {
                            return NodeFilter.FILTER_SKIP
                        }
                    }
                }
            )

            let node: Element | null
            while (node = walker.nextNode() as Element) {
                result.totalElements++

                if (node.tagName === 'IMG') {
                    const img = node as HTMLImageElement
                    const imgRect = img.getBoundingClientRect()
                    const imgSrc = img.src || img.dataset.src || ''
                    const imgKey = `${imgSrc}-${img.alt}-${Math.round(imgRect.x)}-${Math.round(imgRect.y)}`

                    if (!addedImageSrcs.has(imgKey)) {
                        addedImageSrcs.add(imgKey)
                        result.images.push({
                            element: img,
                            src: imgSrc,
                            alt: img.alt || '',
                            rect: imgRect
                        })
                        result.hasImages = true
                    }
                }
            }
        } catch (error) {
            console.warn('Error traversing selection nodes:', error)
        }

        return result
    },

    // 检查两个矩形是否重叠
    isRectOverlapping: (rect1: DOMRect, rect2: DOMRect): boolean => {
        return !(rect1.right < rect2.left ||
            rect1.left > rect2.right ||
            rect1.bottom < rect2.top ||
            rect1.top > rect2.bottom)
    },

    // 检查rect1是否完全包含在rect2内
    isRectContained: (rect1: DOMRect, rect2: DOMRect): boolean => {
        return rect1.left >= rect2.left &&
            rect1.right <= rect2.right &&
            rect1.top >= rect2.top &&
            rect1.bottom <= rect2.bottom
    },

    // 判断选择内容是否包含图片
    selectionContainsImages: (selection: Selection): boolean => {
        const content = domUtils.extractMixedSelectionContent(selection)
        return content.hasImages
    },

    // 获取选择内容的完整信息
    getSelectionInfo: (selection: Selection): {
        text: string
        hasText: boolean
        hasImages: boolean
        imageCount: number
        mixedContent: MixedSelectionContent
    } => {
        const mixedContent = domUtils.extractMixedSelectionContent(selection)

        return {
            text: mixedContent.text,
            hasText: mixedContent.hasText,
            hasImages: mixedContent.hasImages,
            imageCount: mixedContent.images.length,
            mixedContent
        }
    }
}