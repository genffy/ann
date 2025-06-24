import { useAppStore } from './store'
import { NotesPlugin } from '../modules/plugins/notes-plugin'
import { TranslationPlugin } from '../modules/plugins/translation-plugin'
import { SharingPlugin } from '../modules/plugins/sharing-plugin'

/**
 * UI事件处理器
 * 连接UI组件与插件系统
 */
export class UIEventHandlers {
    private static instance: UIEventHandlers | null = null
    private notesPlugin: NotesPlugin | null = null
    private translationPlugin: TranslationPlugin | null = null
    private sharingPlugin: SharingPlugin | null = null
    private isInitialized = false

    private constructor() { }

    static getInstance(): UIEventHandlers {
        if (!UIEventHandlers.instance) {
            UIEventHandlers.instance = new UIEventHandlers()
        }
        return UIEventHandlers.instance
    }

    /**
     * 初始化事件处理器
     */
    initialize(plugins: {
        notes?: NotesPlugin
        translation?: TranslationPlugin
        sharing?: SharingPlugin
    }): void {
        if (this.isInitialized) return

        this.notesPlugin = plugins.notes || null
        this.translationPlugin = plugins.translation || null
        this.sharingPlugin = plugins.sharing || null

        this.setupEventListeners()
        this.isInitialized = true

        console.log('[UIEventHandlers] Event handlers initialized')
    }

    /**
     * 销毁事件处理器
     */
    destroy(): void {
        this.removeEventListeners()
        this.isInitialized = false
        UIEventHandlers.instance = null
    }

    /**
     * 设置事件监听器
     */
    private setupEventListeners(): void {
        // 备注相关事件
        document.addEventListener('ann:create-note', this.handleCreateNote.bind(this))
        document.addEventListener('ann:save-note-comment', this.handleSaveNoteComment.bind(this))
        document.addEventListener('ann:delete-note', this.handleDeleteNote.bind(this))
        document.addEventListener('ann:show-note-details', this.handleShowNoteDetails.bind(this))

        // 翻译相关事件
        document.addEventListener('ann:translate-text', this.handleTranslateText.bind(this))

        // 分享相关事件
        document.addEventListener('ann:share-text', this.handleShareText.bind(this))

        // 文本选择事件
        document.addEventListener('selectionchange', this.handleSelectionChange.bind(this))
    }

    /**
     * 移除事件监听器
     */
    private removeEventListeners(): void {
        document.removeEventListener('ann:create-note', this.handleCreateNote.bind(this))
        document.removeEventListener('ann:save-note-comment', this.handleSaveNoteComment.bind(this))
        document.removeEventListener('ann:delete-note', this.handleDeleteNote.bind(this))
        document.removeEventListener('ann:show-note-details', this.handleShowNoteDetails.bind(this))
        document.removeEventListener('ann:translate-text', this.handleTranslateText.bind(this))
        document.removeEventListener('ann:share-text', this.handleShareText.bind(this))
        document.removeEventListener('selectionchange', this.handleSelectionChange.bind(this))
    }

    /**
 * 处理创建备注事件
 */
    private async handleCreateNote(event: Event): Promise<void> {
        if (!this.notesPlugin) {
            console.warn('[UIEventHandlers] Notes plugin not available')
            return
        }

        try {
            const customEvent = event as CustomEvent
            const { text, selection } = customEvent.detail
            console.log('[UIEventHandlers] Creating note for text:', text.substring(0, 50))

            // 更新当前选择状态
            const store = useAppStore.getState()
            store.setCurrentSelection({
                text,
                range: selection.range,
                boundingRect: selection.boundingRect,
                timestamp: Date.now()
            })

            // 执行备注插件
            await this.notesPlugin.execute()

            // 显示备注面板
            store.setNotesPanelVisible(true)

        } catch (error) {
            console.error('[UIEventHandlers] Failed to create note:', error)
            const store = useAppStore.getState()
            store.setNotesError(error instanceof Error ? error.message : '创建备注失败')
        }
    }

    /**
     * 处理保存备注评论事件
     */
    private async handleSaveNoteComment(event: CustomEvent): Promise<void> {
        if (!this.notesPlugin) {
            console.warn('[UIEventHandlers] Notes plugin not available')
            return
        }

        try {
            const { noteId, comment } = event.detail
            console.log('[UIEventHandlers] Saving comment for note:', noteId)

            await this.notesPlugin.saveUserComment(comment)

        } catch (error) {
            console.error('[UIEventHandlers] Failed to save comment:', error)
            const store = useAppStore.getState()
            store.setNotesError(error instanceof Error ? error.message : '保存评论失败')
        }
    }

    /**
     * 处理删除备注事件
     */
    private async handleDeleteNote(event: CustomEvent): Promise<void> {
        if (!this.notesPlugin) {
            console.warn('[UIEventHandlers] Notes plugin not available')
            return
        }

        try {
            const { noteId } = event.detail
            console.log('[UIEventHandlers] Deleting note:', noteId)

            await this.notesPlugin.deleteCurrentNote()

        } catch (error) {
            console.error('[UIEventHandlers] Failed to delete note:', error)
            const store = useAppStore.getState()
            store.setNotesError(error instanceof Error ? error.message : '删除备注失败')
        }
    }

    /**
     * 处理显示备注详情事件
     */
    private handleShowNoteDetails(event: CustomEvent): void {
        try {
            const { note } = event.detail
            console.log('[UIEventHandlers] Showing note details:', note.id)

            const store = useAppStore.getState()
            store.setCurrentNote(note)
            store.setSelectedNoteId(note.id)
            store.setNotesPanelVisible(true)

        } catch (error) {
            console.error('[UIEventHandlers] Failed to show note details:', error)
        }
    }

    /**
     * 处理翻译文本事件
     */
    private async handleTranslateText(event: CustomEvent): Promise<void> {
        if (!this.translationPlugin) {
            console.warn('[UIEventHandlers] Translation plugin not available')
            return
        }

        try {
            const { text, selection } = event.detail
            console.log('[UIEventHandlers] Translating text:', text.substring(0, 50))

            // 更新当前选择状态
            const store = useAppStore.getState()
            store.setCurrentSelection({
                text,
                range: selection.range,
                boundingRect: selection.boundingRect,
                timestamp: Date.now()
            })

            // 执行翻译插件
            await this.translationPlugin.execute()

        } catch (error) {
            console.error('[UIEventHandlers] Failed to translate text:', error)
            const store = useAppStore.getState()
            store.setTranslationError(error instanceof Error ? error.message : '翻译失败')
        }
    }

    /**
     * 处理分享文本事件
     */
    private async handleShareText(event: CustomEvent): Promise<void> {
        if (!this.sharingPlugin) {
            console.warn('[UIEventHandlers] Sharing plugin not available')
            return
        }

        try {
            const { text, selection } = event.detail
            console.log('[UIEventHandlers] Sharing text:', text.substring(0, 50))

            // 更新当前选择状态
            const store = useAppStore.getState()
            store.setCurrentSelection({
                text,
                range: selection.range,
                boundingRect: selection.boundingRect,
                timestamp: Date.now()
            })

            // 执行分享插件
            await this.sharingPlugin.execute()

        } catch (error) {
            console.error('[UIEventHandlers] Failed to share text:', error)
            const store = useAppStore.getState()
            store.setSharingError(error instanceof Error ? error.message : '分享失败')
        }
    }

    /**
     * 处理文本选择变化事件
     */
    private handleSelectionChange(): void {
        const selection = window.getSelection()
        const store = useAppStore.getState()

        if (!selection || selection.isCollapsed || !selection.toString().trim()) {
            // 没有选择文本，隐藏工具栏
            store.setToolbarVisible(false)
            store.setCurrentSelection(null)
            store.setActiveFeature(null)
            return
        }

        const selectedText = selection.toString().trim()
        if (selectedText.length < 2) {
            // 选择文本太短，不显示工具栏
            return
        }

        try {
            // 获取选择范围的边界矩形
            const range = selection.getRangeAt(0)
            const boundingRect = range.getBoundingClientRect()

            // 计算工具栏位置
            const toolbarWidth = 280
            const toolbarHeight = 40
            const position = this.calculateToolbarPosition(boundingRect, toolbarWidth, toolbarHeight)

            // 更新状态
            store.setCurrentSelection({
                text: selectedText,
                range: range,
                boundingRect: boundingRect,
                timestamp: Date.now()
            })

            store.setToolbarPosition(position)

            // 延迟显示工具栏，避免意外选择
            setTimeout(() => {
                const currentSelection = useAppStore.getState().currentSelection
                if (currentSelection && currentSelection.text === selectedText) {
                    store.setToolbarVisible(true)
                }
            }, 200)

        } catch (error) {
            console.error('[UIEventHandlers] Failed to handle selection change:', error)
        }
    }

    /**
     * 计算工具栏最佳位置
     */
    private calculateToolbarPosition(
        selectionRect: DOMRect,
        toolbarWidth: number,
        toolbarHeight: number
    ): { x: number; y: number } {
        const viewport = {
            width: window.innerWidth,
            height: window.innerHeight,
            scrollX: window.scrollX,
            scrollY: window.scrollY
        }

        // 默认位置：选择区域上方居中
        let x = selectionRect.left + viewport.scrollX + (selectionRect.width - toolbarWidth) / 2
        let y = selectionRect.top + viewport.scrollY - toolbarHeight - 10

        // 边界检测和调整
        if (x < viewport.scrollX + 10) {
            x = viewport.scrollX + 10
        }
        if (x + toolbarWidth > viewport.scrollX + viewport.width - 10) {
            x = viewport.scrollX + viewport.width - toolbarWidth - 10
        }

        // 如果上方空间不足，放到下方
        if (y < viewport.scrollY + 10) {
            y = selectionRect.bottom + viewport.scrollY + 10
        }

        return { x, y }
    }

    /**
     * 获取插件实例
     */
    getPlugin(type: 'notes' | 'translation' | 'sharing'): any {
        switch (type) {
            case 'notes':
                return this.notesPlugin
            case 'translation':
                return this.translationPlugin
            case 'sharing':
                return this.sharingPlugin
            default:
                return null
        }
    }
} 