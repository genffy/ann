import { Logger } from '../../utils/logger'
import { ServiceContext } from '../service-context'
import { CommandHandler } from './command-handler'
import { InstallationHandler } from './installation-handler'
import { RuntimeHandler } from './runtime-handler'

/**
 * 事件处理器管理器
 * 统一管理所有扩展事件的监听和处理
 */
export class EventHandlerManager {
  private static instance: EventHandlerManager
  private serviceContext: ServiceContext
  private commandHandler: CommandHandler
  private installationHandler: InstallationHandler
  private runtimeHandler: RuntimeHandler
  private listenersRegistered = false

  private constructor() {
    this.serviceContext = ServiceContext.getInstance()
    this.commandHandler = new CommandHandler()
    this.installationHandler = new InstallationHandler()
    this.runtimeHandler = new RuntimeHandler()
  }

  static getInstance(): EventHandlerManager {
    if (!EventHandlerManager.instance) {
      EventHandlerManager.instance = new EventHandlerManager()
    }
    return EventHandlerManager.instance
  }

  /**
   * 注册所有事件监听器
   */
  registerEventListeners(): void {
    if (this.listenersRegistered) {
      Logger.info('[EventHandlerManager] Event listeners already registered, skipping...')
      return
    }

    try {
      Logger.info('[EventHandlerManager] Registering event listeners...')

      // 注册运行时事件监听器
      this.runtimeHandler.registerListeners()

      // 注册命令事件监听器
      this.commandHandler.registerListeners()

      // 注册安装/更新事件监听器
      this.installationHandler.registerListeners()

      // 全局错误处理
      this.registerGlobalErrorHandlers()

      this.listenersRegistered = true
      Logger.info('[EventHandlerManager] All event listeners registered successfully')
    } catch (error) {
      Logger.error('[EventHandlerManager] Failed to register event listeners:', error)
      throw error
    }
  }

  /**
   * 注册全局错误处理器
   */
  private registerGlobalErrorHandlers(): void {
    // 连接断开错误处理
    browser.runtime.onConnect.addListener((port) => {
      port.onDisconnect.addListener(() => {
        if (browser.runtime.lastError) {
          Logger.error('[EventHandlerManager] Port disconnected with error:', browser.runtime.lastError)
        }
      })
    })

    // 全局错误处理
    self.addEventListener('error', (event) => {
      Logger.error('[EventHandlerManager] Global error:', event.error)
    })

    // 未处理的 Promise 错误
    self.addEventListener('unhandledrejection', (event) => {
      Logger.error('[EventHandlerManager] Unhandled promise rejection:', event.reason)
    })

    Logger.info('[EventHandlerManager] Global error handlers registered')
  }

  /**
   * 移除所有事件监听器（用于清理）
   */
  removeEventListeners(): void {
    if (!this.listenersRegistered) {
      return
    }

    try {
      Logger.info('[EventHandlerManager] Removing event listeners...')

      // 移除各个处理器的监听器
      this.runtimeHandler.removeListeners()
      this.commandHandler.removeListeners()
      this.installationHandler.removeListeners()

      this.listenersRegistered = false
      Logger.info('[EventHandlerManager] All event listeners removed successfully')
    } catch (error) {
      Logger.error('[EventHandlerManager] Failed to remove event listeners:', error)
    }
  }
} 