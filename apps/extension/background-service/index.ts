import { Logger } from '../utils/logger'
import { ServiceManager, type IService } from './service-manager'
import { EventHandlerManager } from './event-handlers'
import { ServiceContext } from './service-context'
import { ConfigService } from './services/config'
import { TranslationService } from './services/translation'
import { HighlightService } from './services/highlight'

/**
 * 后台服务主管理器
 * 统一管理所有服务和事件处理器
 */
export class BackgroundServiceManager {
  private static instance: BackgroundServiceManager
  private serviceManager: ServiceManager
  private eventHandlerManager: EventHandlerManager
  private serviceContext: ServiceContext
  private isInitialized = false

  private constructor() {
    this.serviceManager = ServiceManager.getInstance()
    this.eventHandlerManager = EventHandlerManager.getInstance()
    this.serviceContext = ServiceContext.getInstance()
  }

  static getInstance(): BackgroundServiceManager {
    if (!BackgroundServiceManager.instance) {
      BackgroundServiceManager.instance = new BackgroundServiceManager()
    }
    return BackgroundServiceManager.instance
  }

  /**
   * 初始化所有后台服务
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      Logger.info('[BackgroundServiceManager] Already initialized, skipping...')
      return
    }

    try {
      Logger.info('[BackgroundServiceManager] Starting background service initialization...')

      // 注册所有服务
      this.registerServices()

      // 注册事件监听器
      this.eventHandlerManager.registerEventListeners()

      // 初始化所有服务
      await this.serviceManager.initializeServices()

      this.isInitialized = true
      Logger.info('[BackgroundServiceManager] Background service initialization completed successfully')
    } catch (error) {
      Logger.error('[BackgroundServiceManager] Background service initialization failed:', error)
      throw error
    }
  }

  /**
   * 注册所有服务
   */
  private registerServices(): void {
    Logger.info('[BackgroundServiceManager] Registering services...')

    const services: IService[] = [
      ConfigService.getInstance(),
      TranslationService.getInstance(),
      HighlightService.getInstance()
    ]

    this.serviceManager.registerServices(services)
    Logger.info(`[BackgroundServiceManager] Registered ${services.length} services`)
  }

  /**
   * 重启所有服务
   */
  async restart(): Promise<void> {
    try {
      Logger.info('[BackgroundServiceManager] Restarting all services...')
      
      await this.serviceManager.restartServices()
      
      Logger.info('[BackgroundServiceManager] All services restarted successfully')
    } catch (error) {
      Logger.error('[BackgroundServiceManager] Service restart failed:', error)
      throw error
    }
  }

  /**
   * 获取服务管理器
   */
  getServiceManager(): ServiceManager {
    return this.serviceManager
  }

  /**
   * 获取事件处理器管理器
   */
  getEventHandlerManager(): EventHandlerManager {
    return this.eventHandlerManager
  }

  /**
   * 获取服务上下文
   */
  getServiceContext(): ServiceContext {
    return this.serviceContext
  }

  /**
   * 获取服务状态
   */
  getStatus() {
    return {
      initialized: this.isInitialized,
      serviceContext: this.serviceContext.getDetailedStatus(),
      serviceManager: this.serviceManager.getServiceStatus(),
      allReady: this.serviceManager.isAllServicesReady()
    }
  }

  /**
   * 检查是否所有服务都已就绪
   */
  isReady(): boolean {
    return this.isInitialized && this.serviceManager.isAllServicesReady()
  }

  /**
   * 清理所有资源
   */
  async cleanup(): Promise<void> {
    try {
      Logger.info('[BackgroundServiceManager] Cleaning up all resources...')

      // 移除事件监听器
      this.eventHandlerManager.removeEventListeners()

      // 清理所有服务
      await this.serviceManager.cleanup()

      this.isInitialized = false
      Logger.info('[BackgroundServiceManager] All resources cleaned up successfully')
    } catch (error) {
      Logger.error('[BackgroundServiceManager] Cleanup failed:', error)
    }
  }
}

// 导出主要的类和接口
export { ServiceManager } from './service-manager'
export type { IService } from './service-manager'
export { EventHandlerManager } from './event-handlers'
export { ServiceContext } from './service-context'
export { ConfigService } from './services/config'
export { TranslationService } from './services/translation'
export { HighlightService } from './services/highlight'

// 默认导出背景服务管理器实例
export default BackgroundServiceManager.getInstance() 