import { ConfigManager } from '../../modules/config/config-manager'
import { TranslationService } from '../../modules/services/translation/translation-service'
import { Logger } from '../../lib/logger'
import { ANN_SELECTION_KEY } from '../../constants'

export default defineBackground(() => {
  Logger.info('Translation extension background loaded', { id: browser.runtime.id })

  // 服务实例
  const translationService = TranslationService.getInstance()

  // 初始化扩展
  browser.runtime.onInstalled.addListener(async () => {
    try {
      Logger.info('Extension installed, initializing...')

      // 初始化配置
      await ConfigManager.initializeConfig()
      Logger.info('Configuration initialized')

      // 初始化翻译服务
      await translationService.initialize()
      Logger.info('Translation service initialized')

      Logger.info('Extension initialization completed successfully')
    } catch (error) {
      Logger.error('Extension initialization failed:', error)
    }
  })

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

  // 处理来自 content script 的截图请求
  browser.runtime.onMessage.addListener(async (message, sender) => {
    if (message.type === 'CAPTURE_VISIBLE_TAB') {
      try {
        Logger.info('Capturing visible tab...')

        const tab = sender.tab
        if (!tab?.windowId) {
          throw new Error('No valid tab found')
        }

        // 捕获可见标签页
        const dataUrl = await browser.tabs.captureVisibleTab(tab.windowId, {
          format: 'png',
          quality: 90
        })

        Logger.info('Tab captured successfully')

        // 将截图数据发送回 content script
        if (tab.id) {
          await browser.tabs.sendMessage(tab.id, {
            type: 'SCREENSHOT_CAPTURED',
            dataUrl: dataUrl,
            requestId: message.requestId
          })
        }

        return { success: true }
      } catch (error) {
        Logger.error('Screenshot capture failed:', error)

        // 发送错误信息
        if (sender.tab?.id) {
          await browser.tabs.sendMessage(sender.tab.id, {
            type: 'SCREENSHOT_ERROR',
            error: error instanceof Error ? error.message : String(error),
            requestId: message.requestId
          })
        }

        return { success: false, error: error instanceof Error ? error.message : String(error) }
      }
    }

    return undefined
  })

  // 处理扩展启动（浏览器启动时）
  browser.runtime.onStartup.addListener(async () => {
    try {
      Logger.info('Extension startup, re-initializing services...')

      // 重新初始化服务
      await translationService.initialize()

      Logger.info('Extension startup initialization completed')
    } catch (error) {
      Logger.error('Extension startup initialization failed:', error)
    }
  })

  // 处理扩展更新
  browser.runtime.onInstalled.addListener(async (details) => {
    if (details.reason === 'update') {
      Logger.info('Extension updated, checking for migration...')

      try {
        // 这里可以添加版本迁移逻辑
        await handleVersionUpdate(details.previousVersion)
        Logger.info('Extension update handled successfully')
      } catch (error) {
        Logger.error('Extension update handling failed:', error)
      }
    }
  })

  /**
   * 处理版本更新
   * @param previousVersion 之前的版本号
   */
  async function handleVersionUpdate(previousVersion?: string): Promise<void> {
    if (!previousVersion) {
      return
    }

    Logger.info(`Updating from version ${previousVersion}`)

    // 这里可以添加具体的迁移逻辑
    // 例如：配置格式更新、数据迁移等

    // 更新配置（确保新字段存在）
    await ConfigManager.initializeConfig()

    // 重新初始化服务
    await translationService.updateConfig()
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
