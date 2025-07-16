import { MixedSelectionContent } from "../../types/dom"

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
/**
 * 范围选择转换工具
 * 在content script和background script之间传递Range对象
 */
export class RangeUtils {
    /**
     * 将Range对象转换为可序列化的对象
     * @param range Range对象
     * @returns 序列化的范围对象
     */
    static serializeRange(range: Range): {
        startOffset: number
        endOffset: number
        startContainerPath: string
        endContainerPath: string
    } {
        return {
            startOffset: range.startOffset,
            endOffset: range.endOffset,
            startContainerPath: this.getNodePath(range.startContainer),
            endContainerPath: this.getNodePath(range.endContainer)
        }
    }

    /**
     * 从序列化对象恢复Range对象
     * @param serialized 序列化的范围对象
     * @returns Range对象
     */
    static deserializeRange(serialized: {
        startOffset: number
        endOffset: number
        startContainerPath: string
        endContainerPath: string
    }): Range | null {
        try {
            const startContainer = this.getNodeFromPath(serialized.startContainerPath)
            const endContainer = this.getNodeFromPath(serialized.endContainerPath)

            if (!startContainer || !endContainer) {
                return null
            }

            const range = document.createRange()
            range.setStart(startContainer, serialized.startOffset)
            range.setEnd(endContainer, serialized.endOffset)

            return range
        } catch (error) {
            console.error('Failed to deserialize range:', error)
            return null
        }
    }

    /**
     * 获取节点路径
     * @param node 节点
     * @returns 路径字符串
     */
    private static getNodePath(node: Node): string {
        const path: number[] = []
        let current = node

        while (current && current.parentNode) {
            const parent = current.parentNode
            const siblings = Array.from(parent.childNodes)
            const index = siblings.indexOf(current as ChildNode)
            path.unshift(index)
            current = parent
        }

        return path.join('/')
    }

    /**
     * 从路径获取节点
     * @param path 路径字符串
     * @returns 节点
     */
    private static getNodeFromPath(path: string): Node | null {
        const indices = path.split('/').map(Number)
        let current: Node = document

        for (const index of indices) {
            if (!current.childNodes[index]) {
                return null
            }
            current = current.childNodes[index]
        }

        return current
    }

    /**
     * 生成CSS选择器
     */
    static generateSelector(range: Range): string {
        const container = range.commonAncestorContainer
        const element = container.nodeType === Node.TEXT_NODE
            ? container.parentElement
            : container as Element

        if (!element) return ''

        // 生成简单的选择器
        let selector = element.tagName.toLowerCase()

        if (element.id) {
            selector += `#${element.id}`
        } else if (element.className) {
            const classes = element.className.split(' ').filter(c => c.trim())
            if (classes.length > 0) {
                selector += `.${classes.join('.')}`
            }
        }

        return selector
    }
    /**
     * 获取文本上下文
     */
    static getTextContext(range: Range, contextLength: number = 50): { before: string; after: string } {
        const container = range.commonAncestorContainer
        const fullText = container.textContent || ''
        const startOffset = range.startOffset
        const endOffset = range.endOffset

        const before = fullText.substring(Math.max(0, startOffset - contextLength), startOffset)
        const after = fullText.substring(endOffset, Math.min(fullText.length, endOffset + contextLength))

        return { before, after }
    }
}

/**
 * 页面信息工具
 */
export class PageInfoUtils {
    /**
     * 获取当前页面信息
     * @returns 页面信息
     */
    static getCurrentPageInfo(): {
        url: string
        title: string
        domain: string
    } {
        return {
            url: window.location.href,
            title: document.title,
            domain: window.location.hostname
        }
    }

    /**
     * 检查页面是否准备就绪
     * @returns 是否准备就绪
     */
    static isPageReady(): boolean {
        return document.readyState === 'complete' || document.readyState === 'interactive'
    }

    /**
     * 等待页面准备就绪
     * @returns Promise
     */
    static waitForPageReady(): Promise<void> {
        return new Promise((resolve) => {
            if (this.isPageReady()) {
                resolve()
            } else {
                const handler = () => {
                    if (this.isPageReady()) {
                        document.removeEventListener('readystatechange', handler)
                        resolve()
                    }
                }
                document.addEventListener('readystatechange', handler)
            }
        })
    }
} 