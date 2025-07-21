import { Logger } from '../utils/logger'
import { ServiceContext, SupportedServices } from './service-context'
import MessageUtils from '../utils/message'
import { ResponseMessage } from '../types/messages'

/**
 * 服务接口
 * 所有服务都应该实现这个接口
 */
export interface IService {
  /**
   * 服务名称（用于在 ServiceContext 中标识）
   */
  readonly name: SupportedServices
  
  /**
   * 初始化服务
   */
  initialize(): Promise<void>
  
  /**
   * 获取消息处理器
   */
  getMessageHandlers(): Record<string, (message: any, sender: chrome.runtime.MessageSender) => Promise<ResponseMessage>>
  
  /**
   * 获取服务状态
   */
  isInitialized(): boolean
  
  /**
   * 清理资源（可选）
   */
  cleanup?(): Promise<void>
}

/**
 * 服务管理器
 * 统一管理所有服务的初始化、消息处理和生命周期
 */
export class ServiceManager {
  private static instance: ServiceManager
  private services: Map<string, IService> = new Map()
  private serviceContext: ServiceContext
  private messageHandlersRegistered = false

  private constructor() {
    this.serviceContext = ServiceContext.getInstance()
  }

  static getInstance(): ServiceManager {
    if (!ServiceManager.instance) {
      ServiceManager.instance = new ServiceManager()
    }
    return ServiceManager.instance
  }

  /**
   * 注册服务
   */
  registerService(service: IService): void {
    if (this.services.has(service.name)) {
      Logger.warn(`[ServiceManager] Service ${service.name} is already registered, replacing...`)
    }
    
    this.services.set(service.name, service)
    Logger.info(`[ServiceManager] Service ${service.name} registered`)
  }

  /**
   * 批量注册服务
   */
  registerServices(services: IService[]): void {
    services.forEach(service => this.registerService(service))
  }

  /**
   * 获取服务
   */
  getService<T extends IService>(name: string): T | undefined {
    return this.services.get(name) as T
  }

  /**
   * 初始化所有服务
   */
  async initializeServices(): Promise<void> {
    if (this.services.size === 0) {
      Logger.warn('[ServiceManager] No services registered for initialization')
      return
    }

    try {
      this.serviceContext.startInitialization()
      Logger.info(`[ServiceManager] Starting initialization of ${this.services.size} services`)

      // 按服务依赖顺序初始化（config -> translation -> highlight）
      const initOrder = ['config', 'translation', 'highlight']
      
      for (const serviceName of initOrder) {
        const service = this.services.get(serviceName)
        if (service) {
          await this.initializeService(service)
        }
      }

      // 初始化其他未在顺序中的服务
      for (const [name, service] of this.services) {
        if (!initOrder.includes(name)) {
          await this.initializeService(service)
        }
      }

      // 注册消息处理器
      this.registerMessageHandlers()

      Logger.info('[ServiceManager] All services initialized successfully')
    } catch (error) {
      Logger.error('[ServiceManager] Service initialization failed:', error)
      this.serviceContext.markInitializationFailed(error instanceof Error ? error : new Error(String(error)))
      throw error
    }
  }

  /**
   * 初始化单个服务
   */
  private async initializeService(service: IService): Promise<void> {
    try {
      Logger.info(`[ServiceManager] Initializing service: ${service.name}`)
      
      if (service.isInitialized()) {
        Logger.info(`[ServiceManager] Service ${service.name} is already initialized, skipping...`)
        this.serviceContext.markServiceInitialized(service.name)
        return
      }

      await service.initialize()
      this.serviceContext.markServiceInitialized(service.name)
      Logger.info(`[ServiceManager] Service ${service.name} initialized successfully`)
    } catch (error) {
      Logger.error(`[ServiceManager] Failed to initialize service ${service.name}:`, error)
      throw error
    }
  }

  /**
   * 注册所有服务的消息处理器
   */
  private registerMessageHandlers(): void {
    if (this.messageHandlersRegistered) {
      Logger.info('[ServiceManager] Message handlers already registered, skipping...')
      return
    }

         try {
       const allHandlers: Record<string, (message: any, sender: chrome.runtime.MessageSender) => Promise<ResponseMessage>> = {}

       // 收集所有服务的消息处理器
       for (const [serviceName, service] of this.services) {
         const handlers = service.getMessageHandlers()
         Object.assign(allHandlers, handlers)
         Logger.info(`[ServiceManager] Collected ${Object.keys(handlers).length} message handlers from service ${serviceName}`)
       }

      // 注册统一的消息处理器
      browser.runtime.onMessage.addListener(
        MessageUtils.createMessageHandler(allHandlers)
      )

      this.messageHandlersRegistered = true
      Logger.info(`[ServiceManager] Registered ${Object.keys(allHandlers).length} total message handlers`)
    } catch (error) {
      Logger.error('[ServiceManager] Failed to register message handlers:', error)
      throw error
    }
  }

  /**
   * 重新初始化所有服务
   */
  async restartServices(): Promise<void> {
    try {
      Logger.info('[ServiceManager] Restarting all services...')
      this.serviceContext.startRestart()
      
      await this.initializeServices()
      
      Logger.info('[ServiceManager] All services restarted successfully')
    } catch (error) {
      Logger.error('[ServiceManager] Service restart failed:', error)
      throw error
    }
  }

  /**
   * 清理所有服务
   */
  async cleanup(): Promise<void> {
    Logger.info('[ServiceManager] Cleaning up all services...')
    
    for (const [name, service] of this.services) {
      try {
        if (service.cleanup) {
          await service.cleanup()
          Logger.info(`[ServiceManager] Service ${name} cleaned up successfully`)
        }
      } catch (error) {
        Logger.error(`[ServiceManager] Failed to cleanup service ${name}:`, error)
      }
    }
  }

  /**
   * 获取服务状态
   */
  getServiceStatus(): Record<string, boolean> {
    const status: Record<string, boolean> = {}
    for (const [name, service] of this.services) {
      status[name] = service.isInitialized()
    }
    return status
  }

  /**
   * 检查是否所有服务都已就绪
   */
  isAllServicesReady(): boolean {
    return this.serviceContext.isReady() && 
           Array.from(this.services.values()).every(service => service.isInitialized())
  }
} 