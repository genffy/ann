import { Logger } from '../../utils/logger'
import { ServiceContext } from '../service-context'

/**
 * 安装事件处理器
 * 处理扩展安装、更新等生命周期事件
 */
export class InstallationHandler {
  private serviceContext: ServiceContext
  private installedListener?: (details: chrome.runtime.InstalledDetails) => void

  constructor() {
    this.serviceContext = ServiceContext.getInstance()
  }

  /**
   * 注册安装事件监听器
   */
  registerListeners(): void {
    Logger.info('[InstallationHandler] Registering installation listeners...')

    this.installedListener = async (details: chrome.runtime.InstalledDetails) => {
      try {
        Logger.info('[InstallationHandler] Extension installed/updated, details:', details)

        switch (details.reason) {
          case 'install':
            Logger.info('[InstallationHandler] Extension first installation detected')
            await this.handleFirstInstallation()
            break

          case 'update':
            Logger.info('[InstallationHandler] Extension update detected, checking for migration...')
            await this.handleVersionUpdate(details.previousVersion)
            break

          case 'chrome_update':
            Logger.info('[InstallationHandler] Chrome browser update detected')
            // Chrome 更新通常不需要特殊处理，但可以记录日志
            break

          case 'shared_module_update':
            Logger.info('[InstallationHandler] Shared module update detected')
            // 可能需要重新初始化相关服务，但这会由 ServiceManager 处理
            break

          default:
            Logger.info('[InstallationHandler] Unknown installation reason:', details.reason)
        }

        Logger.info('[InstallationHandler] Installation/update handling completed successfully')
      } catch (error) {
        Logger.error('[InstallationHandler] Installation/update handling failed:', error)
        this.serviceContext.markInitializationFailed(error instanceof Error ? error : new Error(String(error)))
      }
    }

    browser.runtime.onInstalled.addListener(this.installedListener)
    Logger.info('[InstallationHandler] Installation listeners registered successfully')
  }

  /**
   * 处理首次安装
   */
  private async handleFirstInstallation(): Promise<void> {
    Logger.info('[InstallationHandler] Handling first installation setup...')

    try {
      // 首次安装时，ServiceManager 会处理所有服务的初始化
      // 这里可以添加首次安装的特殊逻辑
      // 例如：显示欢迎页面、设置默认快捷键等

      // 示例：可以打开选项页面
      // await browser.runtime.openOptionsPage()

      Logger.info('[InstallationHandler] First installation setup completed successfully')
    } catch (error) {
      Logger.error('[InstallationHandler] First installation setup failed:', error)
      throw error
    }
  }

  /**
   * 处理版本更新
   * @param previousVersion 之前的版本号
   */
  private async handleVersionUpdate(previousVersion?: string): Promise<void> {
    if (!previousVersion) {
      Logger.info('[InstallationHandler] No previous version information available')
      return
    }

    Logger.info(`[InstallationHandler] Updating from version ${previousVersion} to current version`)

    try {
      // 这里可以添加具体的版本迁移逻辑
      // 根据不同的版本范围执行不同的迁移策略

      // 示例：从 1.x 到 2.x 的迁移
      if (previousVersion.startsWith('1.')) {
        Logger.info('[InstallationHandler] Performing migration from version 1.x to 2.x')
        await this.migrateFromV1ToV2()
      }

      // 版本更新后，ServiceManager 会重新初始化所有服务

      Logger.info('[InstallationHandler] Version update migration completed successfully')
    } catch (error) {
      Logger.error('[InstallationHandler] Version update migration failed:', error)
      throw error
    }
  }

  /**
   * 从版本 1.x 迁移到 2.x
   */
  private async migrateFromV1ToV2(): Promise<void> {
    Logger.info('[InstallationHandler] Starting V1 to V2 migration...')

    // 这里添加具体的迁移逻辑
    // 例如：数据格式转换、配置键重命名等

    // 示例迁移步骤：
    // 1. 备份旧配置
    // 2. 转换数据格式
    // 3. 清理废弃的存储项
    // 4. 更新配置结构

    try {
      // 示例：迁移存储数据格式
      const oldData = await browser.storage.sync.get()
      const newData: Record<string, any> = {}

      // 转换配置格式（示例）
      if (oldData.oldTranslationConfig) {
        newData.translationConfig = {
          ...oldData.oldTranslationConfig,
          // 添加新的默认字段
          version: '0.1.0'
        }
        // 删除旧配置
        await browser.storage.sync.remove('oldTranslationConfig')
      }

      // 保存新配置
      if (Object.keys(newData).length > 0) {
        await browser.storage.sync.set(newData)
      }

      Logger.info('[InstallationHandler] V1 to V2 migration completed')
    } catch (error) {
      Logger.error('[InstallationHandler] V1 to V2 migration failed:', error)
      throw error
    }
  }

  /**
   * 移除安装事件监听器
   */
  removeListeners(): void {
    Logger.info('[InstallationHandler] Removing installation listeners...')

    if (this.installedListener) {
      browser.runtime.onInstalled.removeListener(this.installedListener)
      this.installedListener = undefined
    }

    Logger.info('[InstallationHandler] Installation listeners removed successfully')
  }
} 