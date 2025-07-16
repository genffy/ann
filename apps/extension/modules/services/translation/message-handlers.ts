import MessageUtils from "../../../utils/helpers/message-utils"
import { ResponseMessage, TranslateTextMessage, TranslateResponse } from "../../../types/messages"
import { TranslationService } from "./index"
import { Logger } from '../../../utils/logger'

export const messageHandlers = {
    // 翻译相关
    TRANSLATE_TEXT: async (message: TranslateTextMessage): Promise<ResponseMessage<TranslateResponse>> => {
        try {
            const translatedText = await TranslationService.getInstance().translateText(
                message.text,
                message.targetLanguage || 'auto'
            )
            const result: TranslateResponse = {
                translatedText,
                sourceLanguage: message.sourceLanguage || 'auto',
                targetLanguage: message.targetLanguage || 'zh-CN',
                provider: 'google'
            }
            return MessageUtils.createResponse(true, result)
        } catch (error) {
            return MessageUtils.createResponse<TranslateResponse>(false, undefined, error instanceof Error ? error.message : 'Unknown error')
        }
    },


    // 截图相关（保留原有逻辑）
    CAPTURE_VISIBLE_TAB: async (message: any, sender: chrome.runtime.MessageSender): Promise<ResponseMessage> => {
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

            return MessageUtils.createResponse(true, { dataUrl })
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

            return MessageUtils.createResponse(false, undefined, error instanceof Error ? error.message : String(error))
        }
    },
}