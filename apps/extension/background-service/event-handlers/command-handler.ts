import { Logger } from '../../utils/logger'
import { ANN_SELECTION_KEY } from '../../constants'

/**
 * 命令事件处理器
 * 处理快捷键命令事件
 */
export class CommandHandler {
  private commandListener?: (command: string) => void

  constructor() {}

  /**
   * 注册命令事件监听器
   */
  registerListeners(): void {
    Logger.info('[CommandHandler] Registering command listeners...')

    this.commandListener = async (command: string) => {
      Logger.info('[CommandHandler] Command received:', command)

      try {
        if (command === ANN_SELECTION_KEY) {
          await this.handleScreenshotCommand()
        } else {
          Logger.warn('[CommandHandler] Unknown command:', command)
        }
      } catch (error) {
        Logger.error('[CommandHandler] Command handling failed:', error)
      }
    }

    browser.commands.onCommand.addListener(this.commandListener)
    Logger.info('[CommandHandler] Command listeners registered successfully')
  }

  /**
   * 处理截图命令
   */
  private async handleScreenshotCommand(): Promise<void> {
    try {
      // 获取当前活动标签页
      const [tab] = await browser.tabs.query({ active: true, currentWindow: true })

      if (!tab?.id) {
        Logger.error('[CommandHandler] No active tab found')
        return
      }

      Logger.info('[CommandHandler] Triggering screenshot for tab:', tab.id)

      // 向内容脚本发送截图命令
      try {
        await browser.tabs.sendMessage(tab.id, {
          type: 'TRIGGER_SCREENSHOT',
          command: ANN_SELECTION_KEY
        })
        Logger.info('[CommandHandler] Screenshot command sent to content script')
      } catch (error) {
        Logger.error('[CommandHandler] Failed to send message to content script:', error)

        // 尝试注入内容脚本（如果还未注入）
        try {
          await browser.scripting.executeScript({
            target: { tabId: tab.id },
            func: () => {
              // 通知页面触发截图
              window.dispatchEvent(new CustomEvent('ann-screenshot-trigger', {
                detail: { command: 'capture-screenshot' }
              }))
            }
          })
          Logger.info('[CommandHandler] Screenshot event dispatched via script injection')
        } catch (injectionError) {
          Logger.error('[CommandHandler] Failed to inject script:', injectionError)
        }
      }
    } catch (error) {
      Logger.error('[CommandHandler] Screenshot command handling failed:', error)
      throw error
    }
  }

  /**
   * 移除命令事件监听器
   */
  removeListeners(): void {
    Logger.info('[CommandHandler] Removing command listeners...')

    if (this.commandListener) {
      browser.commands.onCommand.removeListener(this.commandListener)
      this.commandListener = undefined
    }

    Logger.info('[CommandHandler] Command listeners removed successfully')
  }
} 