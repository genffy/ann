import { ConfigManager, messageHandlers as configMessageHandlers } from '../../modules/services/config'
import { TranslationService, messageHandlers as translationMessageHandlers } from '../../modules/services/translation'
import { HighlightService, messageHandlers as highlightMessageHandlers } from '../../modules/services/highlight'
import { Logger } from '../../utils/logger'
import { ServiceContext } from '../../utils/service-context'
import { ANN_SELECTION_KEY } from '../../constants'
import MessageUtils from '../../utils/helpers/message-utils'

export default defineBackground(() => {
  Logger.info('Translation extension background loaded', { id: browser.runtime.id })

  // 获取服务上下文管理器
  const serviceContext = ServiceContext.getInstance()

  // 添加 PING 消息处理器（用于检测 service worker 状态）
  // TODO 
  browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'PING') {
      Logger.info('Received PING, service worker is active')
      sendResponse({
        success: true,
        ...serviceContext.getDetailedStatus()
      })
      return true
    }
    // 不处理其他消息，让其他处理器处理
  })

  // 立即初始化服务（Service Worker 启动时）
  initializeServices().catch(error => {
    Logger.error('Failed to initialize services on startup:', error)
  })

  // 初始化扩展
  browser.runtime.onInstalled.addListener(async () => {
    try {
      Logger.info('Extension installed, initializing...')
      await initializeServices()
      Logger.info('Extension initialization completed successfully')
    } catch (error) {
      Logger.error('Extension initialization failed:', error)
    }
  })

  // 初始化服务
  async function initializeServices(): Promise<void> {
    try {
      // 开始初始化
      serviceContext.startInitialization()

      // 初始化配置
      Logger.info('Initializing configuration...')
      await ConfigManager.initialize()
      serviceContext.markServiceInitialized('config')

      // 初始化翻译服务
      Logger.info('Initializing translation service...')
      await TranslationService.getInstance().initialize()
      serviceContext.markServiceInitialized('translation')

      // 初始化高亮服务
      Logger.info('Initializing highlight service...')
      await HighlightService.getInstance().initialize()
      serviceContext.markServiceInitialized('highlight')

      Logger.info('Service initialization process completed')

      // register message handlers
      browser.runtime.onMessage.addListener(
        MessageUtils.createMessageHandler({
          ...configMessageHandlers,
          ...translationMessageHandlers,
          ...highlightMessageHandlers,
        })
      )
    } catch (error) {
      Logger.error('Service initialization failed:', error)
      serviceContext.markInitializationFailed(error instanceof Error ? error : new Error(String(error)))
      throw error
    }
  }

  // 处理快捷键命令
  browser.commands.onCommand.addListener(async (command) => {
    Logger.info('Command received:', command)

    try {
      if (command === ANN_SELECTION_KEY) {
        // 获取当前活动标签页
        const [tab] = await browser.tabs.query({ active: true, currentWindow: true })

        if (!tab?.id) {
          Logger.error('No active tab found')
          return
        }

        Logger.info('Triggering screenshot for tab:', tab.id)

        // 向 content script 发送截图命令
        try {
          await browser.tabs.sendMessage(tab.id, {
            type: 'TRIGGER_SCREENSHOT',
            command: command
          })
          Logger.info('Screenshot command sent to content script')
        } catch (error) {
          Logger.error('Failed to send message to content script:', error)

          // 尝试注入 content script（如果还没有注入）
          try {
            await browser.scripting.executeScript({
              target: { tabId: tab.id },
              func: () => {
                // 通知页面截图命令
                window.dispatchEvent(new CustomEvent('ann-screenshot-trigger', {
                  detail: { command: 'capture-screenshot' }
                }))
              }
            })
            Logger.info('Screenshot event dispatched via script injection')
          } catch (injectionError) {
            Logger.error('Failed to inject script:', injectionError)
          }
        }
      }
    } catch (error) {
      Logger.error('Command handling failed:', error)
    }
  })

  // 处理侧边栏操作
  browser.action.onClicked.addListener(async (tab) => {
    try {
      Logger.info('Extension icon clicked, opening sidebar')

      // 打开侧边栏 - WXT会自动处理sidepanel entrypoint
      if (tab.id) {
        // 对于支持sidePanel API的浏览器
        if (browser.sidePanel && browser.sidePanel.open) {
          await browser.sidePanel.open({ tabId: tab.id })
          Logger.info('Sidebar opened successfully')
        } else {
          // 回退到弹出窗口
          Logger.warn('SidePanel API not supported, falling back to popup')
          throw new Error('SidePanel not supported')
        }
      }
    } catch (error) {
      Logger.error('Failed to open sidebar:', error)

      // 如果侧边栏不支持，则设置并打开popup
      try {
        await browser.action.setPopup({ popup: 'popup/index.html' })
        Logger.info('Fallback to popup mode')
      } catch (popupError) {
        Logger.error('Failed to fallback to popup:', popupError)
      }
    }
  })

  // 处理扩展启动（浏览器启动时）
  browser.runtime.onStartup.addListener(async () => {
    try {
      Logger.info('Browser startup detected, re-initializing extension services...')

      // 检查当前状态
      const currentStatus = serviceContext.getStatus()
      Logger.info('Current service status on startup:', currentStatus.status)

      if (!serviceContext.isReady()) {
        Logger.info('Services not ready, starting initialization...')
        serviceContext.startRestart() // 标记为重启状态
        await initializeServices()
      } else {
        Logger.info('Services already ready, skipping initialization')
      }

      Logger.info('Browser startup initialization completed')
    } catch (error) {
      Logger.error('Browser startup initialization failed:', error)
      serviceContext.markInitializationFailed(error instanceof Error ? error : new Error(String(error)))
    }
  })

  // 处理扩展安装和更新
  browser.runtime.onInstalled.addListener(async (details) => {
    try {
      Logger.info('Extension installed/updated, details:', details)

      switch (details.reason) {
        case 'install':
          Logger.info('Extension first installation detected')
          await handleFirstInstallation()
          break

        case 'update':
          Logger.info('Extension update detected, checking for migration...')
          await handleVersionUpdate(details.previousVersion)
          break

        case 'chrome_update':
          Logger.info('Chrome browser update detected')
          // Chrome 更新通常不需要特殊处理，但可以记录日志
          break

        case 'shared_module_update':
          Logger.info('Shared module update detected')
          // 可能需要重新初始化相关服务
          await initializeServices()
          break

        default:
          Logger.info('Unknown installation reason:', details.reason)
      }

      Logger.info('Installation/update handling completed successfully')
    } catch (error) {
      Logger.error('Installation/update handling failed:', error)
      serviceContext.markInitializationFailed(error instanceof Error ? error : new Error(String(error)))
    }
  })

  /**
   * 处理首次安装
   */
  async function handleFirstInstallation(): Promise<void> {
    Logger.info('Handling first installation setup...')

    try {
      // 设置默认配置
      await ConfigManager.initialize()

      // 初始化所有服务
      await initializeServices()

      // 可以在这里添加首次安装的特殊逻辑
      // 例如：显示欢迎页面、设置默认快捷键等
      Logger.info('First installation setup completed successfully')

    } catch (error) {
      Logger.error('First installation setup failed:', error)
      throw error
    }
  }

  /**
   * 处理版本更新
   * @param previousVersion 之前的版本号
   */
  async function handleVersionUpdate(previousVersion?: string): Promise<void> {
    if (!previousVersion) {
      Logger.info('No previous version information available')
      return
    }

    Logger.info(`Updating from version ${previousVersion} to current version`)

    try {
      // 这里可以添加具体的版本迁移逻辑
      // 根据不同的版本范围执行不同的迁移策略

      // 示例：从 1.x 到 2.x 的迁移
      if (previousVersion.startsWith('1.')) {
        Logger.info('Performing migration from version 1.x to 2.x')
        await migrateFromV1ToV2()
      }

      // 确保配置是最新的
      await ConfigManager.initialize()

      // 重新初始化服务以应用更新
      await initializeServices()

      Logger.info('Version update migration completed successfully')

    } catch (error) {
      Logger.error('Version update migration failed:', error)
      throw error
    }
  }

  /**
   * 从版本 1.x 迁移到 2.x
   */
  async function migrateFromV1ToV2(): Promise<void> {
    Logger.info('Starting V1 to V2 migration...')

    // 这里添加具体的迁移逻辑
    // 例如：数据格式转换、配置键重命名等

    // 示例迁移步骤：
    // 1. 备份旧配置
    // 2. 转换数据格式
    // 3. 清理废弃的存储项
    // 4. 更新配置结构

    Logger.info('V1 to V2 migration completed')
  }

  // 错误处理
  browser.runtime.onConnect.addListener((port) => {
    port.onDisconnect.addListener(() => {
      if (browser.runtime.lastError) {
        Logger.error('Port disconnected with error:', browser.runtime.lastError)
      }
    })
  })

  // 全局错误处理
  self.addEventListener('error', (event) => {
    Logger.error('Global error:', event.error)
  })

  self.addEventListener('unhandledrejection', (event) => {
    Logger.error('Unhandled promise rejection:', event.reason)
  })

  Logger.info('Background script setup completed')
})
