import { NoteRecord, NoteSearchOptions, generateId, textUtils } from '../../../lib/helpers'
import { NOTES_CONFIG, NOTE_STATUS, NOTE_TYPES } from '../../../lib/constants'

/**
 * 备注数据服务类
 * 负责处理备注数据的持久化存储和检索
 */
export class NotesDataService {
    private static instance: NotesDataService | null = null
    private db: IDBDatabase | null = null
    private isInitialized = false

    private constructor() { }

    /**
     * 获取单例实例
     */
    static getInstance(): NotesDataService {
        if (!NotesDataService.instance) {
            NotesDataService.instance = new NotesDataService()
        }
        return NotesDataService.instance
    }

    /**
     * 初始化数据库
     */
    async initialize(): Promise<void> {
        if (this.isInitialized) return

        return new Promise((resolve, reject) => {
            const request = indexedDB.open(
                NOTES_CONFIG.database.name,
                NOTES_CONFIG.database.version
            )

            request.onerror = () => {
                console.error('[NotesDataService] Database initialization failed:', request.error)
                reject(request.error)
            }

            request.onsuccess = () => {
                this.db = request.result
                this.isInitialized = true
                console.log('[NotesDataService] Database initialized successfully')
                resolve()
            }

            request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
                const db = (event.target as IDBOpenDBRequest).result

                // 创建备注存储
                if (!db.objectStoreNames.contains(NOTES_CONFIG.database.stores.notes)) {
                    const notesStore = db.createObjectStore(
                        NOTES_CONFIG.database.stores.notes,
                        { keyPath: 'id' }
                    )

                    // 创建索引
                    notesStore.createIndex('url', 'url', { unique: false })
                    notesStore.createIndex('domain', 'domain', { unique: false })
                    notesStore.createIndex('textHash', 'textHash', { unique: false })
                    notesStore.createIndex('timestamp', 'timestamp', { unique: false })
                    notesStore.createIndex('status', 'status', { unique: false })
                }

                // 创建设置存储
                if (!db.objectStoreNames.contains(NOTES_CONFIG.database.stores.settings)) {
                    db.createObjectStore(
                        NOTES_CONFIG.database.stores.settings,
                        { keyPath: 'key' }
                    )
                }
            }
        })
    }

    /**
     * 创建新备注
     */
    async createNote(noteData: Partial<NoteRecord>): Promise<NoteRecord> {
        if (!this.isInitialized || !this.db) {
            throw new Error('Database not initialized')
        }

        const now = Date.now()
        const note: NoteRecord = {
            id: generateId('note'),
            url: noteData.url || window.location.href,
            domain: noteData.domain || window.location.hostname,
            selector: noteData.selector || '',
            originalText: noteData.originalText || '',
            textHash: textUtils.hash(noteData.originalText || ''),
            summary: noteData.summary || '',
            userComment: noteData.userComment || '',
            timestamp: now,
            lastModified: now,
            position: noteData.position || { x: 0, y: 0 },
            context: noteData.context || { before: '', after: '' },
            status: NOTE_STATUS.ACTIVE,
            type: noteData.type || NOTE_TYPES.MANUAL,
            tags: noteData.tags || [],
            metadata: {
                pageTitle: document.title,
                pageUrl: window.location.href,
                ...noteData.metadata
            }
        }

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([NOTES_CONFIG.database.stores.notes], 'readwrite')
            const store = transaction.objectStore(NOTES_CONFIG.database.stores.notes)
            const request = store.add(note)

            request.onerror = () => {
                console.error('[NotesDataService] Failed to create note:', request.error)
                reject(request.error)
            }

            request.onsuccess = () => {
                console.log('[NotesDataService] Note created successfully:', note.id)
                resolve(note)
            }
        })
    }

    /**
     * 获取备注
     */
    async getNote(id: string): Promise<NoteRecord | null> {
        if (!this.isInitialized || !this.db) {
            throw new Error('Database not initialized')
        }

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([NOTES_CONFIG.database.stores.notes], 'readonly')
            const store = transaction.objectStore(NOTES_CONFIG.database.stores.notes)
            const request = store.get(id)

            request.onerror = () => {
                console.error('[NotesDataService] Failed to get note:', request.error)
                reject(request.error)
            }

            request.onsuccess = () => {
                resolve(request.result || null)
            }
        })
    }

    /**
     * 更新备注
     */
    async updateNote(id: string, updates: Partial<NoteRecord>): Promise<NoteRecord> {
        if (!this.isInitialized || !this.db) {
            throw new Error('Database not initialized')
        }

        const existingNote = await this.getNote(id)
        if (!existingNote) {
            throw new Error(`Note with id ${id} not found`)
        }

        const updatedNote: NoteRecord = {
            ...existingNote,
            ...updates,
            id, // 确保ID不变
            lastModified: Date.now()
        }

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([NOTES_CONFIG.database.stores.notes], 'readwrite')
            const store = transaction.objectStore(NOTES_CONFIG.database.stores.notes)
            const request = store.put(updatedNote)

            request.onerror = () => {
                console.error('[NotesDataService] Failed to update note:', request.error)
                reject(request.error)
            }

            request.onsuccess = () => {
                console.log('[NotesDataService] Note updated successfully:', id)
                resolve(updatedNote)
            }
        })
    }

    /**
     * 删除备注
     */
    async deleteNote(id: string): Promise<void> {
        if (!this.isInitialized || !this.db) {
            throw new Error('Database not initialized')
        }

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([NOTES_CONFIG.database.stores.notes], 'readwrite')
            const store = transaction.objectStore(NOTES_CONFIG.database.stores.notes)
            const request = store.delete(id)

            request.onerror = () => {
                console.error('[NotesDataService] Failed to delete note:', request.error)
                reject(request.error)
            }

            request.onsuccess = () => {
                console.log('[NotesDataService] Note deleted successfully:', id)
                resolve()
            }
        })
    }

    /**
     * 搜索备注
     */
    async searchNotes(options: NoteSearchOptions = {}): Promise<NoteRecord[]> {
        if (!this.isInitialized || !this.db) {
            throw new Error('Database not initialized')
        }

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([NOTES_CONFIG.database.stores.notes], 'readonly')
            const store = transaction.objectStore(NOTES_CONFIG.database.stores.notes)

            let request: IDBRequest

            // 基于不同条件选择索引
            if (options.url) {
                const index = store.index('url')
                request = index.getAll(options.url)
            } else if (options.domain) {
                const index = store.index('domain')
                request = index.getAll(options.domain)
            } else {
                request = store.getAll()
            }

            request.onerror = () => {
                console.error('[NotesDataService] Failed to search notes:', request.error)
                reject(request.error)
            }

            request.onsuccess = () => {
                let results: NoteRecord[] = request.result || []

                // 应用过滤条件
                if (options.status) {
                    results = results.filter(note => note.status === options.status)
                }

                if (options.text) {
                    const searchText = options.text.toLowerCase()
                    results = results.filter(note =>
                        note.originalText.toLowerCase().includes(searchText) ||
                        note.summary.toLowerCase().includes(searchText) ||
                        note.userComment.toLowerCase().includes(searchText)
                    )
                }

                if (options.tags && options.tags.length > 0) {
                    results = results.filter(note =>
                        options.tags!.some(tag => note.tags.includes(tag))
                    )
                }

                // 排序
                const sortBy = options.sortBy || 'timestamp'
                const sortOrder = options.sortOrder || 'desc'

                results.sort((a, b) => {
                    const aVal = a[sortBy as keyof NoteRecord] as number
                    const bVal = b[sortBy as keyof NoteRecord] as number

                    if (sortOrder === 'asc') {
                        return aVal - bVal
                    } else {
                        return bVal - aVal
                    }
                })

                // 分页
                if (options.offset || options.limit) {
                    const offset = options.offset || 0
                    const limit = options.limit || results.length
                    results = results.slice(offset, offset + limit)
                }

                resolve(results)
            }
        })
    }

    /**
     * 获取当前页面的备注
     */
    async getNotesForCurrentPage(): Promise<NoteRecord[]> {
        return this.searchNotes({
            url: window.location.href,
            status: NOTE_STATUS.ACTIVE
        })
    }

    /**
     * 获取当前域名的备注
     */
    async getNotesForCurrentDomain(): Promise<NoteRecord[]> {
        return this.searchNotes({
            domain: window.location.hostname,
            status: NOTE_STATUS.ACTIVE
        })
    }

    /**
     * 清理过期备注
     */
    async cleanupExpiredNotes(): Promise<void> {
        // 这里可以实现清理逻辑，比如删除过期的备注
        // 暂时留空，后续可以根据需要实现
        console.log('[NotesDataService] Cleanup expired notes (placeholder)')
    }

    /**
     * 销毁服务
     */
    destroy(): void {
        if (this.db) {
            this.db.close()
            this.db = null
        }
        this.isInitialized = false
        NotesDataService.instance = null
    }
} 