import { TextOperationCenter } from '../../lib/core/text-operation-center'
import { TranslationPlugin } from './translation-plugin'
import { NotesPlugin } from './notes-plugin'
import { SharingPlugin } from './sharing-plugin'
import { errorUtils } from '../../lib/helpers'

/**
 * 插件管理器
 * 负责所有插件的注册、初始化和管理
 */
export class PluginManager {
    private static instance: PluginManager | null = null
    private textOperationCenter: TextOperationCenter | null = null
    private plugins: Map<string, any> = new Map()
    private isInitialized = false

    private constructor() { }

    /**
     * 获取单例实例
     */
    static getInstance(): PluginManager {
        if (!PluginManager.instance) {
            PluginManager.instance = new PluginManager()
        }
        return PluginManager.instance
    }

    /**
     * 初始化插件管理器
     */
    async initialize(center: TextOperationCenter): Promise<void> {
        if (this.isInitialized) {
            console.warn('[PluginManager] Already initialized')
            return
        }

        try {
            console.log('[PluginManager] Initializing plugin system...')

            this.textOperationCenter = center

            // 注册核心插件
            await this.registerCorePlugins()

            this.isInitialized = true
            console.log('[PluginManager] Plugin system initialized successfully')

        } catch (error) {
            errorUtils.log(error as Error, 'PluginManager.initialize')
            throw error
        }
    }

    /**
     * 销毁插件管理器
     */
    destroy(): void {
        console.log('[PluginManager] Destroying plugin system...')

        // 卸载所有插件
        this.plugins.forEach((plugin, name) => {
            try {
                if (this.textOperationCenter) {
                    this.textOperationCenter.unregisterPlugin(name)
                }
            } catch (error) {
                errorUtils.log(error as Error, `PluginManager.destroy.${name}`)
            }
        })

        // 清理状态
        this.plugins.clear()
        this.textOperationCenter = null
        this.isInitialized = false

        PluginManager.instance = null
    }

    /**
     * 获取插件
     */
    getPlugin(name: string): any | null {
        return this.plugins.get(name) || null
    }

    /**
     * 获取所有插件
     */
    getAllPlugins(): Record<string, any> {
        const result: Record<string, any> = {}
        this.plugins.forEach((plugin, name) => {
            result[name] = plugin
        })
        return result
    }

    /**
     * 检查插件是否已注册
     */
    isPluginRegistered(name: string): boolean {
        return this.plugins.has(name)
    }

    /**
     * 获取插件状态
     */
    getPluginStatus(): Record<string, any> {
        const status: Record<string, any> = {}

        this.plugins.forEach((plugin, name) => {
            status[name] = {
                name: plugin.name,
                version: plugin.version,
                description: plugin.description,
                isAvailable: plugin.isAvailable(),
                config: plugin.getConfig()
            }
        })

        return status
    }

    /**
     * 重新加载插件
     */
    async reloadPlugin(name: string): Promise<void> {
        if (!this.textOperationCenter) {
            throw new Error('Plugin manager not initialized')
        }

        try {
            // 卸载现有插件
            if (this.plugins.has(name)) {
                this.textOperationCenter.unregisterPlugin(name)
                this.plugins.delete(name)
            }

            // 重新注册插件
            await this.registerPlugin(name)

            console.log(`[PluginManager] Plugin ${name} reloaded successfully`)

        } catch (error) {
            errorUtils.log(error as Error, `PluginManager.reloadPlugin.${name}`)
            throw error
        }
    }

    // ===================
    // 私有方法
    // ===================

    /**
     * 注册核心插件
     */
    private async registerCorePlugins(): Promise<void> {
        const corePlugins = [
            'translation',
            'notes',
            'sharing'
        ]

        for (const pluginName of corePlugins) {
            try {
                await this.registerPlugin(pluginName)
            } catch (error) {
                console.error(`[PluginManager] Failed to register ${pluginName} plugin:`, error)
                // 继续注册其他插件，不因单个插件失败而中断
            }
        }
    }

    /**
     * 注册单个插件
     */
    private async registerPlugin(name: string): Promise<void> {
        if (!this.textOperationCenter) {
            throw new Error('TextOperationCenter not available')
        }

        let plugin: any

        // 创建插件实例
        switch (name) {
            case 'translation':
                plugin = new TranslationPlugin()
                break
            case 'notes':
                plugin = new NotesPlugin()
                break
            case 'sharing':
                plugin = new SharingPlugin()
                break
            default:
                throw new Error(`Unknown plugin: ${name}`)
        }

        // 注册到文本操作中心
        this.textOperationCenter.registerPlugin(plugin)

        // 保存插件引用
        this.plugins.set(name, plugin)

        console.log(`[PluginManager] Plugin ${name} registered successfully`)
    }
} 