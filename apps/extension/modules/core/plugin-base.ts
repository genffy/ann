import type { TextOperationCenter } from './text-operation-center'

/**
 * 插件基类接口
 * 所有功能插件都必须实现这个接口
 */
export abstract class PluginBase {
    abstract readonly name: string
    abstract readonly version: string
    abstract readonly description: string

    protected center: TextOperationCenter | null = null
    protected isInitialized = false

    /**
     * 初始化插件
     */
    initialize(center: TextOperationCenter): void {
        this.center = center
        this.isInitialized = true
        console.log(`[Plugin:${this.name}] Initialized`)
    }

    /**
     * 销毁插件
     */
    destroy(): void {
        this.center = null
        this.isInitialized = false
        console.log(`[Plugin:${this.name}] Destroyed`)
    }

    /**
     * 执行插件功能
     */
    abstract execute(): Promise<void>

    /**
     * 检查插件是否可用
     */
    isAvailable(): boolean {
        return this.isInitialized && this.center !== null
    }

    /**
     * 获取插件配置
     */
    abstract getConfig(): Record<string, any>

    /**
     * 更新插件配置
     */
    abstract updateConfig(config: Record<string, any>): void
} 