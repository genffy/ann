import { Logger } from '../utils/logger'

/**
 * 服务状态枚举
 */
export enum ServiceStatus {
    IDLE = 'idle',           // 空闲/未初始化
    INITIALIZING = 'initializing', // 初始化中
    READY = 'ready',         // 就绪
    ERROR = 'error',         // 错误状态
    RESTARTING = 'restarting' // 重启中
}

/**
 * 支持的服务类型
 */
export type SupportedServices = 'config' | 'translation' | 'highlight'

/**
 * 服务上下文接口
 */
export interface IServiceContext {
    status: ServiceStatus
    initialized: boolean
    error: Error | null
    initStartTime: number | null
    initEndTime: number | null
    version: string
    startupTime: number
    services: Record<SupportedServices, boolean>
}

/**
 * 服务上下文管理器
 * 统一管理所有服务的初始化状态和错误信息
 */
export class ServiceContext {
    private static instance: ServiceContext
    private context: IServiceContext

    private constructor() {
        this.context = {
            status: ServiceStatus.IDLE,
            initialized: false,
            error: null,
            initStartTime: null,
            initEndTime: null,
            version: '2.0.0', // 从 manifest.json 读取
            startupTime: Date.now(),
            services: {
                config: false,
                translation: false,
                highlight: false
            }
        }
    }

    static getInstance(): ServiceContext {
        if (!ServiceContext.instance) {
            ServiceContext.instance = new ServiceContext()
        }
        return ServiceContext.instance
    }

    /**
     * 开始初始化
     */
    startInitialization(): void {
        Logger.info('[ServiceContext] Starting service initialization')
        this.context.status = ServiceStatus.INITIALIZING
        this.context.initialized = false
        this.context.error = null
        this.context.initStartTime = Date.now()
        this.context.initEndTime = null

        // 重置服务状态
        Object.keys(this.context.services).forEach(key => {
            this.context.services[key as SupportedServices] = false
        })
    }

    /**
     * 标记某个服务已初始化
     */
    markServiceInitialized(serviceName: SupportedServices): void {
        this.context.services[serviceName] = true
        Logger.info(`[ServiceContext] Service ${serviceName} initialized`)

        // 检查是否所有服务都已初始化
        const allServicesReady = Object.values(this.context.services).every(status => status)
        if (allServicesReady && this.context.status === ServiceStatus.INITIALIZING) {
            this.markInitializationComplete()
        }
    }

    /**
     * 完成初始化
     */
    private markInitializationComplete(): void {
        this.context.status = ServiceStatus.READY
        this.context.initialized = true
        this.context.initEndTime = Date.now()
        this.context.error = null

        const initDuration = this.context.initEndTime! - this.context.initStartTime!
        Logger.info(`[ServiceContext] All services initialized successfully in ${initDuration}ms`)
    }

    /**
     * 标记初始化失败
     */
    markInitializationFailed(error: Error): void {
        Logger.error('[ServiceContext] Service initialization failed:', error)
        this.context.status = ServiceStatus.ERROR
        this.context.initialized = false
        this.context.error = error
        this.context.initEndTime = Date.now()
    }

    /**
     * 开始重启
     */
    startRestart(): void {
        Logger.info('[ServiceContext] Starting service restart')
        this.context.status = ServiceStatus.RESTARTING
        this.context.error = null
        // 保持其他状态，但重置服务状态
        Object.keys(this.context.services).forEach(key => {
            this.context.services[key as SupportedServices] = false
        })
    }

    /**
     * 获取当前状态
     */
    getStatus(): IServiceContext {
        return { ...this.context }
    }

    /**
     * 获取详细状态信息（用于 PING 响应）
     */
    getDetailedStatus() {
        const now = Date.now()
        const uptime = now - this.context.startupTime
        const initDuration = this.context.initEndTime && this.context.initStartTime
            ? this.context.initEndTime - this.context.initStartTime
            : null

        return {
            status: this.context.status,
            initialized: this.context.initialized,
            version: this.context.version,
            uptime,
            startupTime: this.context.startupTime,
            initDuration,
            services: { ...this.context.services },
            error: this.context.error ? {
                name: this.context.error.name,
                message: this.context.error.message
            } : null,
            timestamp: now
        }
    }

    /**
     * 检查是否已就绪
     */
    isReady(): boolean {
        return this.context.status === ServiceStatus.READY && this.context.initialized
    }

    /**
     * 检查是否在初始化中
     */
    isInitializing(): boolean {
        return this.context.status === ServiceStatus.INITIALIZING
    }

    /**
     * 检查是否有错误
     */
    hasError(): boolean {
        return this.context.status === ServiceStatus.ERROR
    }

    /**
     * 获取错误信息
     */
    getError(): Error | null {
        return this.context.error
    }
} 