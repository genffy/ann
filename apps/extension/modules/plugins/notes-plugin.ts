import { PluginBase } from '../../lib/core/plugin-base'
import { useAppStore } from '../../lib/store'
import { errorUtils, textUtils, storageUtils, NoteRecord } from '../../lib/helpers'
import { EVENT_TYPES, NOTES_CONFIG } from '../../lib/constants'
import { NotesDataService } from '../services/notes/notes-data-service'
import { NotesHighlightingService } from '../services/notes/notes-highlighting-service'

/**
 * 备注插件
 * 负责处理文本摘要和备注功能
 */
export class NotesPlugin extends PluginBase {
  readonly name = 'notes'
  readonly version = '1.0.0'
  readonly description = '文本备注和摘要功能插件'

  private isProcessing = false
  private notesDataService: NotesDataService | null = null
  private highlightingService: NotesHighlightingService | null = null

  /**
   * 初始化插件
   */
  initialize(center: any): void {
    super.initialize(center)

    // 初始化数据服务
    this.initializeDataService()

    // 初始化回显服务
    this.initializeHighlightingService()

    // 监听备注相关事件
    this.center?.on(EVENT_TYPES.NOTES_SAVE, this.handleNotesSave.bind(this))

    // 监听自定义事件
    this.setupCustomEventListeners()

    console.log('[NotesPlugin] Notes service initialized')
  }

  /**
   * 初始化数据服务
   */
  private async initializeDataService(): Promise<void> {
    try {
      this.notesDataService = NotesDataService.getInstance()
      await this.notesDataService.initialize()

      // 加载当前页面的备注到状态管理
      await this.loadNotesToStore()

      console.log('[NotesPlugin] Data service initialized successfully')
    } catch (error) {
      console.error('[NotesPlugin] Failed to initialize data service:', error)
      errorUtils.log(error as Error, 'NotesPlugin.initializeDataService')
    }
  }

  /**
   * 初始化回显服务
   */
  private async initializeHighlightingService(): Promise<void> {
    try {
      this.highlightingService = NotesHighlightingService.getInstance()
      await this.highlightingService.initialize()
      console.log('[NotesPlugin] Highlighting service initialized successfully')
    } catch (error) {
      console.error('[NotesPlugin] Failed to initialize highlighting service:', error)
      errorUtils.log(error as Error, 'NotesPlugin.initializeHighlightingService')
    }
  }

  /**
   * 加载备注到状态管理
   */
  private async loadNotesToStore(): Promise<void> {
    if (!this.notesDataService) return

    try {
      const currentPageNotes = await this.notesDataService.getNotesForCurrentPage()
      const store = useAppStore.getState()

      // 更新备注列表
      store.setNotesList(currentPageNotes)
      store.updateNotesCount()
      store.applyNotesFilter()

      console.log(`[NotesPlugin] Loaded ${currentPageNotes.length} notes to store`)
    } catch (error) {
      console.error('[NotesPlugin] Failed to load notes to store:', error)
      errorUtils.log(error as Error, 'NotesPlugin.loadNotesToStore')
    }
  }

  /**
   * 设置自定义事件监听
   */
  private setupCustomEventListeners(): void {
    // 监听显示备注详情事件
    document.addEventListener('ann:show-note-details', (event: any) => {
      const note = event.detail?.note
      if (note) {
        this.loadExistingNote(note)
      }
    })
  }

  /**
   * 销毁插件
   */
  destroy(): void {
    if (this.center) {
      this.center.off(EVENT_TYPES.NOTES_SAVE, this.handleNotesSave.bind(this))
    }

    // 销毁回显服务
    if (this.highlightingService) {
      this.highlightingService.destroy()
      this.highlightingService = null
    }

    super.destroy()
  }

  /**
   * 执行备注功能
   */
  async execute(): Promise<void> {
    if (!this.isAvailable() || this.isProcessing) {
      console.warn('[NotesPlugin] Plugin not available or already processing')
      return
    }

    try {
      const currentSelection = useAppStore.getState().currentSelection
      if (!currentSelection?.text) {
        console.warn('[NotesPlugin] No text selected for notes')
        return
      }

      this.isProcessing = true
      const store = useAppStore.getState()

      // 更新UI状态
      store.setNotesLoading(true)
      store.setNotesError(null)

      console.log(`[NotesPlugin] Processing notes for: "${currentSelection.text.substring(0, 50)}..."`)

      // 检查是否已存在备注
      const existingNote = await this.findExistingNote(currentSelection.text)

      if (existingNote) {
        // 加载现有备注
        await this.loadExistingNote(existingNote)
      } else {
        // 创建新备注
        await this.createNewNote(currentSelection)
      }

    } catch (error) {
      console.error('[NotesPlugin] Notes processing failed:', error)

      const errorMessage = error instanceof Error ? error.message : '备注处理失败，请重试'
      useAppStore.getState().setNotesError(errorMessage)

      // 记录错误
      errorUtils.log(error as Error, 'NotesPlugin.execute')

    } finally {
      this.isProcessing = false
      useAppStore.getState().setNotesLoading(false)
    }
  }

  /**
   * 保存用户评论
   */
  async saveUserComment(comment: string): Promise<void> {
    const store = useAppStore.getState()
    const currentNote = store.notes.currentNote

    if (!this.notesDataService || !currentNote) {
      throw new Error('No active note to save comment')
    }

    try {
      // 更新数据库中的备注
      const updatedNote = await this.notesDataService.updateNote(currentNote.id, {
        userComment: comment
      })

      // 更新状态管理
      store.setCurrentNote(updatedNote)
      store.updateNote(updatedNote.id, { userComment: comment })
      store.setNotesComment(comment)

      console.log('[NotesPlugin] User comment saved successfully')

      // 触发保存事件
      this.center?.emit(EVENT_TYPES.NOTES_SAVE, {
        noteData: updatedNote,
        action: 'comment_updated'
      })

    } catch (error) {
      console.error('[NotesPlugin] Failed to save user comment:', error)
      throw error
    }
  }

  /**
   * 删除当前备注
   */
  async deleteCurrentNote(): Promise<void> {
    const store = useAppStore.getState()
    const currentNote = store.notes.currentNote

    if (!this.notesDataService || !currentNote) {
      throw new Error('No active note to delete')
    }

    try {
      await this.notesDataService.deleteNote(currentNote.id)

      // 更新状态管理
      store.setCurrentNote(null)
      store.removeNote(currentNote.id)
      store.setNotesSummary(null)
      store.setNotesComment('')
      store.updateNotesCount()
      store.applyNotesFilter()

      console.log('[NotesPlugin] Note deleted successfully')

    } catch (error) {
      console.error('[NotesPlugin] Failed to delete note:', error)
      throw error
    }
  }

  /**
   * 获取当前备注
   */
  getCurrentNote(): NoteRecord | null {
    return useAppStore.getState().notes.currentNote
  }

  /**
   * 切换备注面板显示
   */
  toggleNotesPanel(): void {
    const store = useAppStore.getState()
    store.setNotesPanelVisible(!store.notes.isNotesPanelVisible)
  }

  /**
   * 切换备注列表显示
   */
  toggleNotesList(): void {
    const store = useAppStore.getState()
    store.setNotesListVisible(!store.notes.isNotesListVisible)
  }

  /**
   * 搜索备注
   */
  async searchNotes(query: string): Promise<void> {
    const store = useAppStore.getState()
    store.setSearchQuery(query)
    store.applyNotesFilter()
  }

  /**
   * 按状态过滤备注
   */
  filterNotesByStatus(status: 'all' | 'active' | 'archived' | 'deleted'): void {
    const store = useAppStore.getState()
    store.setFilterStatus(status)
    store.applyNotesFilter()
  }

  /**
   * 按标签过滤备注
   */
  filterNotesByTags(tags: string[]): void {
    const store = useAppStore.getState()
    store.setFilterTags(tags)
    store.applyNotesFilter()
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
        maxSummaryLength: NOTES_CONFIG.maxSummaryLength,
        maxCommentLength: NOTES_CONFIG.maxCommentLength,
        summaryEnabled: NOTES_CONFIG.summary.enabled
      }
    }
  }

  /**
   * 更新插件配置
   */
  updateConfig(config: Record<string, any>): void {
    console.log('[NotesPlugin] Configuration updated:', config)
  }

  // ===================
  // 私有方法
  // ===================

  /**
   * 查找现有备注
   */
  private async findExistingNote(text: string): Promise<NoteRecord | null> {
    if (!this.notesDataService) return null

    try {
      const textHash = textUtils.hash(text)
      const notes = await this.notesDataService.searchNotes({
        url: window.location.href,
        status: 'active'
      })

      // 查找匹配的备注
      return notes.find(note => note.textHash === textHash) || null

    } catch (error) {
      errorUtils.log(error as Error, 'NotesPlugin.findExistingNote')
      return null
    }
  }

  /**
   * 加载现有备注
   */
  private async loadExistingNote(note: NoteRecord): Promise<void> {
    const store = useAppStore.getState()

    // 更新状态管理
    store.setCurrentNote(note)
    store.setNotesSummary(note.summary)
    store.setNotesComment(note.userComment)
    store.setSelectedNoteId(note.id)

    console.log('[NotesPlugin] Existing note loaded:', note.id)
  }

  /**
   * 创建新备注
   */
  private async createNewNote(selection: any): Promise<void> {
    if (!this.notesDataService) {
      throw new Error('Data service not available')
    }

    // 生成摘要
    const summary = await this.generateSummary(selection.text)

    // 获取上下文
    const context = this.extractContext(selection)

    // 创建备注数据
    const noteData: Partial<NoteRecord> = {
      originalText: selection.text,
      summary: summary || '',
      position: {
        x: selection.boundingRect?.x || 0,
        y: selection.boundingRect?.y || 0
      },
      context: context,
      selector: this.generateSelector(selection.range),
      userComment: '',
      tags: [],
      type: 'manual'
    }

    try {
      // 保存到数据库
      const createdNote = await this.notesDataService.createNote(noteData)

      const store = useAppStore.getState()

      // 更新状态管理
      store.setCurrentNote(createdNote)
      store.addNote(createdNote)
      store.setNotesSummary(createdNote.summary)
      store.setNotesComment('')
      store.updateNotesCount()
      store.applyNotesFilter()

      console.log('[NotesPlugin] New note created:', createdNote.id)

      // 触发保存事件
      this.center?.emit(EVENT_TYPES.NOTES_SAVE, {
        noteData: createdNote,
        action: 'note_created'
      })

    } catch (error) {
      console.error('[NotesPlugin] Failed to create note:', error)
      throw error
    }
  }

  /**
   * 生成文本摘要（改进版）
   */
  private async generateSummary(text: string): Promise<string | null> {
    try {
      // 清理文本
      const cleanText = textUtils.clean(text)

      if (cleanText.length < NOTES_CONFIG.summary.minLength) {
        return cleanText
      }

      // 改进的摘要算法
      const sentences = cleanText.split(/[.!?。！？]+/).filter(s => s.trim().length > 0)
      const maxLength = NOTES_CONFIG.summary.maxLength

      if (sentences.length === 0) return null

      // 如果只有一句话，直接返回（可能需要截断）
      if (sentences.length === 1) {
        return textUtils.truncate(cleanText, maxLength)
      }

      // 多句话的情况：选择最重要的句子
      let summary = ''
      const sortedSentences = sentences
        .map(sentence => ({
          text: sentence.trim(),
          score: this.calculateSentenceScore(sentence.trim(), cleanText)
        }))
        .sort((a, b) => b.score - a.score)

      // 按重要性添加句子，直到达到长度限制
      for (const sentence of sortedSentences) {
        const potentialSummary = summary + (summary ? '. ' : '') + sentence.text + '.'
        if (potentialSummary.length <= maxLength) {
          summary = potentialSummary
        } else {
          break
        }
      }

      // 如果摘要太短，使用前几句
      if (summary.length < NOTES_CONFIG.summary.minLength) {
        summary = sentences.slice(0, 2).join('. ') + '.'
      }

      return textUtils.truncate(summary, maxLength)

    } catch (error) {
      errorUtils.log(error as Error, 'NotesPlugin.generateSummary')
      return textUtils.truncate(text, NOTES_CONFIG.summary.maxLength)
    }
  }

  /**
   * 计算句子重要性分数
   */
  private calculateSentenceScore(sentence: string, fullText: string): number {
    let score = 0

    // 长度因子：中等长度的句子更重要
    const idealLength = 50
    const lengthScore = Math.max(0, 1 - Math.abs(sentence.length - idealLength) / idealLength)
    score += lengthScore * 0.3

    // 位置因子：开头和结尾的句子更重要
    const sentences = fullText.split(/[.!?。！？]+/).filter(s => s.trim().length > 0)
    const index = sentences.findIndex(s => s.trim() === sentence)
    const positionScore = index === 0 || index === sentences.length - 1 ? 1 : 0.5
    score += positionScore * 0.2

    // 关键词因子：包含重要关键词的句子更重要
    const keywords = ['重要', '关键', '核心', '主要', '总结', '结论', 'important', 'key', 'main', 'conclusion']
    const keywordScore = keywords.some(keyword =>
      sentence.toLowerCase().includes(keyword.toLowerCase())
    ) ? 1 : 0
    score += keywordScore * 0.3

    // 标点符号因子：包含特殊标点的句子可能更重要
    const hasSpecialPunctuation = /[!?：:；;]/.test(sentence)
    score += hasSpecialPunctuation ? 0.2 : 0

    return score
  }

  /**
   * 提取上下文信息
   */
  private extractContext(selection: any): { before: string; after: string } {
    try {
      const range = selection.range
      if (!range || !range.commonAncestorContainer) {
        return { before: '', after: '' }
      }

      const container = range.commonAncestorContainer
      const fullText = container.textContent || ''
      const selectedText = selection.text

      const startIndex = fullText.indexOf(selectedText)
      if (startIndex === -1) {
        return { before: '', after: '' }
      }

      const contextLength = 50
      const beforeStart = Math.max(0, startIndex - contextLength)
      const afterEnd = Math.min(fullText.length, startIndex + selectedText.length + contextLength)

      const before = fullText.substring(beforeStart, startIndex).trim()
      const after = fullText.substring(startIndex + selectedText.length, afterEnd).trim()

      return { before, after }

    } catch (error) {
      errorUtils.log(error as Error, 'NotesPlugin.extractContext')
      return { before: '', after: '' }
    }
  }

  /**
   * 生成CSS选择器
   */
  private generateSelector(range: Range | null): string {
    if (!range || !range.commonAncestorContainer) {
      return ''
    }

    try {
      const element = range.commonAncestorContainer.nodeType === Node.ELEMENT_NODE
        ? range.commonAncestorContainer as Element
        : range.commonAncestorContainer.parentElement

      if (!element) return ''

      // 简单的选择器生成
      const tagName = element.tagName?.toLowerCase() || ''
      const className = element.className ? `.${element.className.split(' ').join('.')}` : ''
      const id = element.id ? `#${element.id}` : ''

      return `${tagName}${id}${className}`.substring(0, 100)

    } catch (error) {
      errorUtils.log(error as Error, 'NotesPlugin.generateSelector')
      return ''
    }
  }

  /**
   * 处理备注保存事件
   */
  private handleNotesSave(data: any): void {
    console.log('[NotesPlugin] Note saved:', data.noteData?.id, 'Action:', data.action)
  }
}
