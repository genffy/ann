import { NoteRecord, NoteMatchResult, textUtils } from '../../../lib/helpers'
import { NOTES_CONFIG, MATCH_ALGORITHMS } from '../../../lib/constants'
import { NotesDataService } from './notes-data-service'
import { useAppStore } from '../../../lib/store'

/**
 * 备注高亮显示服务
 * 负责在页面上显示现有备注的标记
 */
export class NotesHighlightingService {
    private static instance: NotesHighlightingService | null = null
    private notesDataService: NotesDataService | null = null
    private highlightedElements: Map<string, Element> = new Map()
    private observer: MutationObserver | null = null
    private isInitialized = false
    private checkTimer: number | null = null

    private constructor() { }

    /**
     * 获取单例实例
     */
    static getInstance(): NotesHighlightingService {
        if (!NotesHighlightingService.instance) {
            NotesHighlightingService.instance = new NotesHighlightingService()
        }
        return NotesHighlightingService.instance
    }

    /**
     * 初始化服务
     */
    async initialize(): Promise<void> {
        if (this.isInitialized) return

        try {
            // 初始化数据服务
            this.notesDataService = NotesDataService.getInstance()
            await this.notesDataService.initialize()

            // 设置DOM变化监听
            this.setupMutationObserver()

            // 开始检查现有备注
            await this.checkAndHighlightNotes()

            // 设置定期检查
            this.startPeriodicCheck()

            this.isInitialized = true
            console.log('[NotesHighlightingService] Service initialized successfully')

        } catch (error) {
            console.error('[NotesHighlightingService] Failed to initialize:', error)
            throw error
        }
    }

    /**
     * 销毁服务
     */
    destroy(): void {
        // 停止定期检查
        if (this.checkTimer) {
            clearInterval(this.checkTimer)
            this.checkTimer = null
        }

        // 停止DOM监听
        if (this.observer) {
            this.observer.disconnect()
            this.observer = null
        }

        // 清除所有高亮
        this.clearAllHighlights()

        this.isInitialized = false
        NotesHighlightingService.instance = null
    }

    /**
     * 检查并高亮显示备注
     */
    async checkAndHighlightNotes(): Promise<void> {
        const store = useAppStore.getState()

        if (!this.notesDataService || !store.notes.isHighlightingEnabled) {
            return
        }

        try {
            // 获取当前页面的备注
            const notes = await this.notesDataService.getNotesForCurrentPage()

            if (notes.length === 0) {
                console.log('[NotesHighlightingService] No notes found for current page')
                return
            }

            console.log(`[NotesHighlightingService] Found ${notes.length} notes for current page`)

            // 处理每个备注
            for (const note of notes) {
                await this.highlightNote(note)
            }

        } catch (error) {
            console.error('[NotesHighlightingService] Failed to check and highlight notes:', error)
        }
    }

    /**
     * 高亮显示单个备注
     */
    private async highlightNote(note: NoteRecord): Promise<void> {
        try {
            // 如果已经高亮过，跳过
            if (this.highlightedElements.has(note.id)) {
                return
            }

            // 尝试匹配文本位置
            const matchResult = await this.findTextMatch(note)

            if (matchResult && matchResult.element) {
                // 创建高亮标记
                this.createHighlightMarker(note, matchResult)

                // 更新状态管理
                const store = useAppStore.getState()
                store.setNoteHighlighted(note.id, true)

                console.log(`[NotesHighlightingService] Note highlighted: ${note.id}`)
            } else {
                console.warn(`[NotesHighlightingService] Failed to find match for note: ${note.id}`)
            }

        } catch (error) {
            console.error(`[NotesHighlightingService] Failed to highlight note ${note.id}:`, error)
        }
    }

    /**
     * 移除备注高亮
     */
    removeNoteHighlight(noteId: string): void {
        const element = this.highlightedElements.get(noteId)
        if (element) {
            try {
                const parent = element.parentNode
                if (parent) {
                    // 恢复原始内容
                    const originalElement = element.firstChild
                    if (originalElement) {
                        parent.insertBefore(originalElement, element)
                    }
                    parent.removeChild(element)
                }

                this.highlightedElements.delete(noteId)

                // 更新状态管理
                const store = useAppStore.getState()
                store.setNoteHighlighted(noteId, false)

                console.log(`[NotesHighlightingService] Note highlight removed: ${noteId}`)
            } catch (error) {
                console.error(`[NotesHighlightingService] Failed to remove highlight for note ${noteId}:`, error)
            }
        }
    }

    /**
     * 切换高亮显示开关
     */
    toggleHighlighting(enabled: boolean): void {
        const store = useAppStore.getState()
        store.setHighlightingEnabled(enabled)

        if (!enabled) {
            // 如果禁用高亮，清除所有现有高亮
            this.clearAllHighlights()
        } else {
            // 如果启用高亮，重新检查并高亮
            this.checkAndHighlightNotes()
        }
    }

    /**
     * 查找文本匹配
     */
    private async findTextMatch(note: NoteRecord): Promise<NoteMatchResult | null> {
        // 尝试多种匹配策略
        const algorithms = [
            MATCH_ALGORITHMS.EXACT,
            MATCH_ALGORITHMS.FUZZY,
            MATCH_ALGORITHMS.CONTEXT
        ]

        for (const algorithm of algorithms) {
            const result = await this.tryMatchWithAlgorithm(note, algorithm)
            if (result && result.confidence > 0.7) {
                return result
            }
        }

        return null
    }

    /**
     * 使用指定算法尝试匹配
     */
    private async tryMatchWithAlgorithm(note: NoteRecord, algorithm: string): Promise<NoteMatchResult | null> {
        switch (algorithm) {
            case MATCH_ALGORITHMS.EXACT:
                return this.exactMatch(note)
            case MATCH_ALGORITHMS.FUZZY:
                return this.fuzzyMatch(note)
            case MATCH_ALGORITHMS.CONTEXT:
                return this.contextMatch(note)
            default:
                return null
        }
    }

    /**
     * 精确匹配
     */
    private exactMatch(note: NoteRecord): NoteMatchResult | null {
        const elements = this.getAllTextElements()

        for (const element of elements) {
            const textContent = element.textContent || ''

            if (textContent.includes(note.originalText)) {
                return {
                    note,
                    confidence: 1.0,
                    matchType: 'exact',
                    element,
                    position: element.getBoundingClientRect()
                }
            }
        }

        return null
    }

    /**
     * 模糊匹配
     */
    private fuzzyMatch(note: NoteRecord): NoteMatchResult | null {
        const elements = this.getAllTextElements()
        const cleanOriginalText = textUtils.clean(note.originalText)

        let bestMatch: NoteMatchResult | null = null
        let highestScore = 0

        for (const element of elements) {
            const textContent = textUtils.clean(element.textContent || '')

            if (textContent.length < cleanOriginalText.length * 0.5) {
                continue
            }

            const score = this.calculateSimilarity(cleanOriginalText, textContent)

            if (score > highestScore && score > 0.7) {
                highestScore = score
                bestMatch = {
                    note,
                    confidence: score,
                    matchType: 'fuzzy',
                    element,
                    position: element.getBoundingClientRect()
                }
            }
        }

        return bestMatch
    }

    /**
     * 上下文匹配
     */
    private contextMatch(note: NoteRecord): NoteMatchResult | null {
        if (!note.context.before && !note.context.after) {
            return null
        }

        const elements = this.getAllTextElements()

        for (const element of elements) {
            const textContent = element.textContent || ''

            // 检查上下文是否匹配
            const beforeMatch = !note.context.before || textContent.includes(note.context.before)
            const afterMatch = !note.context.after || textContent.includes(note.context.after)

            if (beforeMatch && afterMatch) {
                // 尝试在上下文中找到原始文本
                const contextText = note.context.before + note.originalText + note.context.after
                const similarity = this.calculateSimilarity(contextText, textContent)

                if (similarity > 0.6) {
                    return {
                        note,
                        confidence: similarity,
                        matchType: 'context',
                        element,
                        position: element.getBoundingClientRect()
                    }
                }
            }
        }

        return null
    }

    /**
     * 创建高亮标记
     */
    private createHighlightMarker(note: NoteRecord, matchResult: NoteMatchResult): void {
        try {
            const element = matchResult.element
            if (!element) return

            // 创建高亮包装器
            const highlightWrapper = document.createElement('span')
            highlightWrapper.className = NOTES_CONFIG.highlighting.className
            highlightWrapper.style.cssText = `
                background-color: rgba(255, 255, 0, 0.3);
                border-bottom: 2px solid #ffa500;
                cursor: pointer;
                position: relative;
            `

            // 添加数据属性
            highlightWrapper.setAttribute('data-note-id', note.id)
            highlightWrapper.setAttribute('data-note-summary', note.summary)
            highlightWrapper.setAttribute('data-note-comment', note.userComment)

            // 创建悬浮提示
            const tooltip = document.createElement('div')
            tooltip.className = 'ann-note-tooltip'
            tooltip.style.cssText = `
                position: absolute;
                background: #333;
                color: white;
                padding: 8px 12px;
                border-radius: 4px;
                font-size: 12px;
                max-width: 200px;
                z-index: 1000;
                display: none;
                top: -40px;
                left: 0;
                box-shadow: 0 2px 8px rgba(0,0,0,0.2);
            `
            tooltip.textContent = note.summary || note.originalText.substring(0, 50) + '...'

            // 包装原始内容
            const parent = element.parentNode
            if (parent) {
                parent.insertBefore(highlightWrapper, element)
                highlightWrapper.appendChild(element)
                highlightWrapper.appendChild(tooltip)

                // 添加交互事件
                this.addHighlightInteractions(highlightWrapper, note, tooltip)

                // 记录高亮元素
                this.highlightedElements.set(note.id, highlightWrapper)
            }

        } catch (error) {
            console.error('[NotesHighlightingService] Failed to create highlight marker:', error)
        }
    }

    /**
     * 添加高亮交互功能
     */
    private addHighlightInteractions(wrapper: Element, note: NoteRecord, tooltip: Element): void {
        // 鼠标悬停显示提示
        wrapper.addEventListener('mouseenter', () => {
            (tooltip as HTMLElement).style.display = 'block'
        })

        wrapper.addEventListener('mouseleave', () => {
            (tooltip as HTMLElement).style.display = 'none'
        })

        // 点击显示详细信息
        wrapper.addEventListener('click', (event) => {
            event.preventDefault()
            this.showNoteDetails(note)
        })
    }

    /**
     * 显示备注详情
     */
    private showNoteDetails(note: NoteRecord): void {
        console.log('[NotesHighlightingService] Show note details:', note.id)

        // 更新状态管理
        const store = useAppStore.getState()
        store.setCurrentNote(note)
        store.setSelectedNoteId(note.id)
        store.setNotesPanelVisible(true)

        // 可以通过事件系统通知其他组件
        const event = new CustomEvent('ann:show-note-details', {
            detail: { note }
        })
        document.dispatchEvent(event)
    }

    /**
     * 获取所有文本元素
     */
    private getAllTextElements(): Element[] {
        const selector = 'p, div, span, h1, h2, h3, h4, h5, h6, article, section, main, aside'
        const elements = document.querySelectorAll(selector)

        return Array.from(elements).filter(element => {
            const text = element.textContent?.trim()
            return text && text.length > 10 // 只处理有意义的文本内容
        })
    }

    /**
     * 计算文本相似度
     */
    private calculateSimilarity(text1: string, text2: string): number {
        const longer = text1.length > text2.length ? text1 : text2
        const shorter = text1.length > text2.length ? text2 : text1

        if (longer.length === 0) return 1.0

        // 简单的Levenshtein距离计算
        const editDistance = this.levenshteinDistance(longer, shorter)
        return (longer.length - editDistance) / longer.length
    }

    /**
     * 计算Levenshtein距离
     */
    private levenshteinDistance(str1: string, str2: string): number {
        const matrix = []

        for (let i = 0; i <= str2.length; i++) {
            matrix[i] = [i]
        }

        for (let j = 0; j <= str1.length; j++) {
            matrix[0][j] = j
        }

        for (let i = 1; i <= str2.length; i++) {
            for (let j = 1; j <= str1.length; j++) {
                if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1]
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    )
                }
            }
        }

        return matrix[str2.length][str1.length]
    }

    /**
     * 清除所有高亮
     */
    private clearAllHighlights(): void {
        for (const [noteId, element] of this.highlightedElements) {
            try {
                const parent = element.parentNode
                if (parent) {
                    // 恢复原始内容
                    const originalElement = element.firstChild
                    if (originalElement) {
                        parent.insertBefore(originalElement, element)
                    }
                    parent.removeChild(element)
                }
            } catch (error) {
                console.error(`[NotesHighlightingService] Failed to remove highlight for note ${noteId}:`, error)
            }
        }

        this.highlightedElements.clear()

        // 更新状态管理
        const store = useAppStore.getState()
        store.clearAllHighlights()
    }

    /**
     * 设置DOM变化监听
     */
    private setupMutationObserver(): void {
        this.observer = new MutationObserver((mutations) => {
            let shouldRecheck = false

            for (const mutation of mutations) {
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    // 检查是否有新的文本内容添加
                    for (const node of mutation.addedNodes) {
                        if (node.nodeType === Node.ELEMENT_NODE || node.nodeType === Node.TEXT_NODE) {
                            shouldRecheck = true
                            break
                        }
                    }
                }
            }

            if (shouldRecheck) {
                // 延迟重新检查，避免频繁执行
                setTimeout(() => {
                    this.checkAndHighlightNotes()
                }, 1000)
            }
        })

        this.observer.observe(document.body, {
            childList: true,
            subtree: true
        })
    }

    /**
     * 开始定期检查
     */
    private startPeriodicCheck(): void {
        if (NOTES_CONFIG.highlighting.checkInterval > 0) {
            this.checkTimer = window.setInterval(() => {
                this.checkAndHighlightNotes()
            }, NOTES_CONFIG.highlighting.checkInterval)
        }
    }
} 