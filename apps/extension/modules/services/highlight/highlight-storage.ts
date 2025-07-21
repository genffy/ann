import { openDB, DBSchema, IDBPDatabase } from 'idb'
import CryptoJS from 'crypto-js'
import type { HighlightRecord, HighlightQuery, HighlightResult } from '../../../types/highlight'

// 数据库模式定义
interface HighlightDB extends DBSchema {
    highlights: {
        key: string
        value: HighlightRecord
        indexes: {
            'by-url': string
            'by-domain': string
            'by-status': string
            'by-timestamp': number
        }
    }
}

/**
 * 高亮存储服务
 * 负责高亮数据的持久化存储和检索
 */
export class HighlightStorage {
    private static instance: HighlightStorage | null = null
    private db: IDBPDatabase<HighlightDB> | null = null
    private readonly DB_NAME = 'ann-highlights-db'
    private readonly DB_VERSION = 1

    private constructor() { }

    static getInstance(): HighlightStorage {
        if (!HighlightStorage.instance) {
            HighlightStorage.instance = new HighlightStorage()
        }
        return HighlightStorage.instance
    }

    /**
     * 初始化数据库
     */
    async initialize(): Promise<void> {
        if (this.db) return

        try {
            this.db = await openDB<HighlightDB>(this.DB_NAME, this.DB_VERSION, {
                upgrade(db) {
                    // 创建高亮表
                    const highlightStore = db.createObjectStore('highlights', {
                        keyPath: 'id'
                    })

                    // 创建索引
                    highlightStore.createIndex('by-url', 'url')
                    highlightStore.createIndex('by-domain', 'domain')
                    highlightStore.createIndex('by-status', 'status')
                    highlightStore.createIndex('by-timestamp', 'timestamp')
                }
            })

            console.log('[HighlightStorage] Database initialized successfully')
        } catch (error) {
            console.error('[HighlightStorage] Failed to initialize database:', error)
            throw error
        }
    }
    /**
     * 保存高亮
     */
    async saveHighlight(
        highlight: HighlightRecord
    ): Promise<HighlightResult> {
        if (!this.db) {
            await this.initialize()
        }

        try {
            await this.db!.add('highlights', highlight)

            console.log('[HighlightStorage] Highlight saved:', highlight.id)
            return { success: true, data: highlight }

        } catch (error) {
            console.error('[HighlightStorage] Failed to save highlight:', error)
            return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
        }
    }

    /**
     * 获取高亮列表
     */
    async getHighlights(query: HighlightQuery = {}): Promise<HighlightRecord[]> {
        if (!this.db) {
            await this.initialize()
        }

        try {
            const tx = this.db!.transaction('highlights', 'readonly')
            const store = tx.objectStore('highlights')

            let highlights: HighlightRecord[] = []
            console.log('getHighlights query', query)
            if (query.url) {
                highlights = await store.index('by-url').getAll(query.url)
            } else if (query.domain) {
                highlights = await store.index('by-domain').getAll(query.domain)
            } else {
                highlights = await store.getAll()
            }
            console.log('getHighlights highlights', highlights)
            // 过滤状态
            if (query.status) {
                highlights = highlights.filter(h => h.status === query.status)
            }

            // 排序（按时间戳降序）
            highlights.sort((a, b) => b.timestamp - a.timestamp)

            // 分页
            if (query.limit) {
                const offset = query.offset || 0
                highlights = highlights.slice(offset, offset + query.limit)
            }

            return highlights

        } catch (error) {
            console.error('[HighlightStorage] Failed to get highlights:', error)
            return []
        }
    }

    /**
     * 获取当前页面的高亮
     */
    async getCurrentPageHighlights(url: string): Promise<HighlightRecord[]> {
        return this.getHighlights({
            url: url,
            status: 'active'
        })
    }

    /**
     * 更新高亮
     */
    async updateHighlight(id: string, updates: Partial<HighlightRecord>): Promise<HighlightResult> {
        if (!this.db) {
            await this.initialize()
        }

        try {
            const tx = this.db!.transaction('highlights', 'readwrite')
            const store = tx.objectStore('highlights')

            const existing = await store.get(id)
            if (!existing) {
                return { success: false, error: 'Highlight not found' }
            }

            const updated = {
                ...existing,
                ...updates,
                lastModified: Date.now()
            }

            await store.put(updated)
            await tx.done

            console.log('[HighlightStorage] Highlight updated:', id)
            return { success: true, data: updated }

        } catch (error) {
            console.error('[HighlightStorage] Failed to update highlight:', error)
            return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
        }
    }

    /**
     * 删除高亮
     */
    async deleteHighlight(id: string): Promise<HighlightResult> {
        if (!this.db) {
            await this.initialize()
        }

        try {
            const tx = this.db!.transaction('highlights', 'readwrite')
            const store = tx.objectStore('highlights')

            const existing = await store.get(id)
            if (!existing) {
                return { success: false, error: 'Highlight not found' }
            }

            await store.delete(id)
            await tx.done

            console.log('[HighlightStorage] Highlight deleted:', id)
            return { success: true, data: existing }

        } catch (error) {
            console.error('[HighlightStorage] Failed to delete highlight:', error)
            return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
        }
    }

    /**
     * 清空所有高亮
     */
    async clearAllHighlights(): Promise<void> {
        if (!this.db) {
            await this.initialize()
        }

        try {
            const tx = this.db!.transaction('highlights', 'readwrite')
            const store = tx.objectStore('highlights')
            await store.clear()
            await tx.done

            console.log('[HighlightStorage] All highlights cleared')
        } catch (error) {
            console.error('[HighlightStorage] Failed to clear highlights:', error)
            throw error
        }
    }

    /**
     * 获取统计信息
     */
    async getStats(): Promise<{
        total: number
        active: number
        archived: number
        deleted: number
    }> {
        if (!this.db) {
            await this.initialize()
        }

        try {
            const highlights = await this.getHighlights()

            return {
                total: highlights.length,
                active: highlights.filter(h => h.status === 'active').length,
                archived: highlights.filter(h => h.status === 'archived').length,
                deleted: highlights.filter(h => h.status === 'deleted').length
            }
        } catch (error) {
            console.error('[HighlightStorage] Failed to get stats:', error)
            return { total: 0, active: 0, archived: 0, deleted: 0 }
        }
    }
} 