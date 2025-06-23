import { ConfigManager } from '../../modules/config/config-manager'
import { TranslationService } from '../../modules/services/translation/translation-service'
import { MessageRouter } from '../../modules/handlers/message-router'
import { ContextMenuManager } from '../../modules/services/menu/context-menu'
import { Logger } from '../../modules/utils/helpers'

export default defineBackground(() => {
  Logger.info('Translation extension background loaded', { id: browser.runtime.id })

  // 服务实例
  const translationService = TranslationService.getInstance()
  const messageRouter = MessageRouter.getInstance()
  const contextMenuManager = ContextMenuManager.getInstance()

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

      // 初始化上下文菜单
      await contextMenuManager.initialize()
      Logger.info('Context menu initialized')

      // 初始化消息路由
      messageRouter.initialize()
      Logger.info('Message router initialized')

      Logger.info('Extension initialization completed successfully')
    } catch (error) {
      Logger.error('Extension initialization failed:', error)
    }
  })

  // 处理扩展启动（浏览器启动时）
  browser.runtime.onStartup.addListener(async () => {
    try {
      Logger.info('Extension startup, re-initializing services...')

      // 重新初始化服务
      await translationService.initialize()
      await contextMenuManager.initialize()
      messageRouter.initialize()

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
    await contextMenuManager.recreateMenu()
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
