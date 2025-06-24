import { TextOperationCenter } from './core/text-operation-center'
import { PluginManager } from '../modules/plugins/plugin-manager'
import { UIEventHandlers } from './ui-event-handlers'
import { errorUtils } from './helpers'

/**
 * Content Script 新架构集成
 * 负责在内容页面中初始化和管理新的文本操作架构
 */
export class ContentIntegration {
    private static instance: ContentIntegration | null = null
    private textOperationCenter: TextOperationCenter | null = null
    private pluginManager: PluginManager | null = null
    private uiEventHandlers: UIEventHandlers | null = null
    private isInitialized = false

    private constructor() { }

    /**
     * 获取单例实例
     */
    static getInstance(): ContentIntegration {
        if (!ContentIntegration.instance) {
            ContentIntegration.instance = new ContentIntegration()
        }
        return ContentIntegration.instance
    }

    /**
     * 初始化新架构
     */
    async initialize(): Promise<void> {
        if (this.isInitialized) {
            console.warn('[ContentIntegration] Already initialized')
            return
        }

        try {
            console.log('[ContentIntegration] Initializing new architecture...')

            // 初始化TextOperationCenter
            this.textOperationCenter = TextOperationCenter.getInstance()
            await this.textOperationCenter.initialize()

            // 初始化插件管理器
            this.pluginManager = PluginManager.getInstance()
            await this.pluginManager.initialize(this.textOperationCenter)

            // 初始化UI事件处理器
            await this.initializeUIEventHandlers()

            // 设置页面清理监听
            this.setupPageCleanup()

            this.isInitialized = true
            console.log('[ContentIntegration] New architecture initialized successfully')

            // 触发初始化完成事件
            this.dispatchInitializedEvent()

        } catch (error) {
            console.error('[ContentIntegration] Failed to initialize:', error)
            errorUtils.log(error as Error, 'ContentIntegration.initialize')
            throw error
        }
    }

    /**
     * 初始化UI事件处理器
     */
    private async initializeUIEventHandlers(): Promise<void> {
        try {
            this.uiEventHandlers = UIEventHandlers.getInstance()

            // 获取插件实例
            const notesPlugin = this.pluginManager?.getPlugin('notes')
            const translationPlugin = this.pluginManager?.getPlugin('translation')
            const sharingPlugin = this.pluginManager?.getPlugin('sharing')

            // 初始化事件处理器
            this.uiEventHandlers.initialize({
                notes: notesPlugin,
                translation: translationPlugin,
                sharing: sharingPlugin
            })

            console.log('[ContentIntegration] UI event handlers initialized')

        } catch (error) {
            console.error('[ContentIntegration] Failed to initialize UI event handlers:', error)
            errorUtils.log(error as Error, 'ContentIntegration.initializeUIEventHandlers')
        }
    }

    /**
     * 销毁新架构
     */
    destroy(): void {
        console.log('[ContentIntegration] Destroying new architecture...')

        try {
            // 销毁UI事件处理器
            if (this.uiEventHandlers) {
                this.uiEventHandlers.destroy()
                this.uiEventHandlers = null
            }

            // 销毁插件管理器
            if (this.pluginManager) {
                this.pluginManager.destroy()
                this.pluginManager = null
            }

            // 销毁TextOperationCenter
            if (this.textOperationCenter) {
                this.textOperationCenter.destroy()
                this.textOperationCenter = null
            }

            // 重置状态
            this.isInitialized = false

            console.log('[ContentIntegration] Architecture destroyed successfully')

        } catch (error) {
            console.error('[ContentIntegration] Failed to destroy architecture:', error)
            errorUtils.log(error as Error, 'ContentIntegration.destroy')
        }

        ContentIntegration.instance = null
    }

    /**
     * 检查是否已初始化
     */
    isReady(): boolean {
        return this.isInitialized &&
            this.textOperationCenter !== null &&
            this.pluginManager !== null &&
            this.uiEventHandlers !== null
    }

    /**
     * 获取TextOperationCenter实例
     */
    getTextOperationCenter(): TextOperationCenter | null {
        return this.textOperationCenter
    }

    /**
     * 获取PluginManager实例
     */
    getPluginManager(): PluginManager | null {
        return this.pluginManager
    }

    /**
     * 获取UIEventHandlers实例
     */
    getUIEventHandlers(): UIEventHandlers | null {
        return this.uiEventHandlers
    }

    /**
     * 获取插件实例
     */
    getPlugin(name: string): any | null {
        return this.pluginManager?.getPlugin(name) || null
    }

    /**
     * 执行指定功能
     */
    async executeFeature(featureName: 'translation' | 'notes' | 'sharing'): Promise<void> {
        if (!this.isReady()) {
            console.warn('[ContentIntegration] Architecture not ready')
            return
        }

        try {
            await this.textOperationCenter!.activateFeature(featureName)
        } catch (error) {
            errorUtils.log(error as Error, `ContentIntegration.executeFeature.${featureName}`)
        }
    }

    /**
     * 获取架构状态
     */
    getStatus(): Record<string, any> {
        return {
            isInitialized: this.isInitialized,
            isReady: this.isReady(),
            textOperationCenterExists: this.textOperationCenter !== null,
            pluginManagerExists: this.pluginManager !== null,
            uiEventHandlersExists: this.uiEventHandlers !== null,
            pluginStatus: this.pluginManager?.getPluginStatus() || {}
        }
    }

    // ===================
    // 私有方法
    // ===================

    /**
     * 设置页面清理监听
     */
    private setupPageCleanup(): void {
        // 监听页面卸载
        window.addEventListener('beforeunload', () => {
            this.destroy()
        })

        // 监听页面隐藏（用户切换标签页等）
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden') {
                // 可以在这里暂停某些功能以节省资源
                console.log('[ContentIntegration] Page hidden, architecture remains active')
            } else if (document.visibilityState === 'visible') {
                // 页面重新可见时可以恢复功能
                console.log('[ContentIntegration] Page visible, architecture ready')
            }
        })
    }

    /**
     * 触发初始化完成事件
     */
    private dispatchInitializedEvent(): void {
        const event = new CustomEvent('ann:architecture:initialized', {
            detail: {
                timestamp: Date.now(),
                status: this.getStatus()
            }
        })

        document.dispatchEvent(event)
    }
}

/**
 * 全局初始化函数
 * 可以在content script中直接调用
 */
export async function initializeANNArchitecture(): Promise<ContentIntegration> {
    const integration = ContentIntegration.getInstance()
    await integration.initialize()
    return integration
}

/**
 * 全局销毁函数
 */
export function destroyANNArchitecture(): void {
    const integration = ContentIntegration.getInstance()
    integration.destroy()
}

/**
 * 获取当前架构实例
 */
export function getANNArchitecture(): ContentIntegration {
    return ContentIntegration.getInstance()
}

// ContentIntegration 类已经在上面导出，这里不需要重复导出类型 