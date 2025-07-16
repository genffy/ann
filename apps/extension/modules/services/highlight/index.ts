import { HighlightStorage } from './highlight-storage'
import { HighlightRecord, HighlightQuery } from '../../../types/highlight'
export { messageHandlers } from './message-handles'

/**
 * 高亮服务
 * 整合存储和DOM管理功能，提供完整的高亮功能
 */
export class HighlightService {
    private static instance: HighlightService | null = null
    private storage: HighlightStorage
    private isInitialized = false

    private constructor() {
        this.storage = HighlightStorage.getInstance()
    }

    static getInstance(): HighlightService {
        if (!HighlightService.instance) {
            HighlightService.instance = new HighlightService()
        }
        return HighlightService.instance
    }

    /**
     * 初始化服务
     */
    async initialize(): Promise<void> {
        if (this.isInitialized) return

        try {
            // 初始化存储
            await this.storage.initialize()

            // 恢复页面高亮
            // await this.restorePageHighlights()
            // register message handlers
            // allow to get `this` context in message handlers
            // browser.runtime.onMessage.addListener(
            //     MessageUtils.createMessageHandler(messageHandlers)
            // )

            this.isInitialized = true
            console.log('[HighlightService] Initialized successfully')
        } catch (error) {
            console.error('[HighlightService] Failed to initialize:', error)
            throw error
        }
    }
    /**
     * 获取当前页面高亮
     */
    async getCurrentPageHighlights(url: string): Promise<HighlightRecord[]> {
        return this.storage.getCurrentPageHighlights(url)
    }

    /**
     * 获取高亮记录
     */
    async getHighlights(query?: HighlightQuery): Promise<HighlightRecord[]> {
        return this.storage.getHighlights(query)
    }

    /**
     * 获取高亮总数
     */
    async getHighlightsCount(query?: Omit<HighlightQuery, 'limit' | 'offset'>): Promise<number> {
        const highlights = await this.storage.getHighlights(query)
        return highlights.length
    }
} 
