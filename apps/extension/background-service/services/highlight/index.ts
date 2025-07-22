import { HighlightStorage } from './highlight-storage'
import { HighlightRecord, HighlightQuery } from '../../../types/highlight'
import { IService } from '../../service-manager'
import { ResponseMessage } from '../../../types/messages'
import { messageHandlers } from './message-handles'
import { Logger } from '../../../utils/logger'

/**
 * 高亮服务
 * 整合存储和DOM管理功能，提供完整的高亮功能
 */
export class HighlightService implements IService {
    readonly name = 'highlight' as const
    private static instance: HighlightService | null = null
    private storage: HighlightStorage
    private initialized = false

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
        if (this.initialized) {
            Logger.info('[HighlightService] Already initialized, skipping...')
            return
        }

        try {
            Logger.info('[HighlightService] Initializing highlight service...')
            
            // 初始化存储
            await this.storage.initialize()

            this.initialized = true
            Logger.info('[HighlightService] Highlight service initialized successfully')
        } catch (error) {
            Logger.error('[HighlightService] Failed to initialize:', error)
            throw error
        }
    }

    /**
     * 获取消息处理器
     */
    getMessageHandlers(): Record<string, (message: any, sender: chrome.runtime.MessageSender) => Promise<ResponseMessage>> {
        return messageHandlers
    }

    /**
     * 检查服务是否已初始化
     */
    isInitialized(): boolean {
        return this.initialized
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

    /**
     * 清理资源
     */
    async cleanup(): Promise<void> {
        this.initialized = false
        Logger.info('[HighlightService] Cleaned up successfully')
    }
}
