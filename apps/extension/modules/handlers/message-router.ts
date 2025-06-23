import { ConfigManager } from '../config/config-manager'
import { TranslationService } from '../services/translation/translation-service'
import { TranslationRulesChecker } from '../services/translation/rules/translation-rules'
import { WhitelistManager } from '../services/domain/whitelist-manager'

export class MessageRouter {
    private static instance: MessageRouter
    private translationService: TranslationService
    private rulesChecker: TranslationRulesChecker
    private whitelistManager: WhitelistManager

    private constructor() {
        this.translationService = TranslationService.getInstance()
        this.rulesChecker = TranslationRulesChecker.getInstance()
        this.whitelistManager = WhitelistManager.getInstance()
    }

    static getInstance(): MessageRouter {
        if (!MessageRouter.instance) {
            MessageRouter.instance = new MessageRouter()
        }
        return MessageRouter.instance
    }

    /**
     * 初始化消息路由
     */
    initialize(): void {
        browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
            this.handleMessage(message, sender, sendResponse)
            return true // 表示异步响应
        })
    }

    /**
     * 处理收到的消息
     * @param message 消息对象
     * @param sender 发送者信息
     * @param sendResponse 响应函数
     */
    private async handleMessage(message: any, sender: any, sendResponse: Function): Promise<void> {
        try {
            switch (message.type) {
                case 'GET_TRANSLATION_CONFIG':
                    await this.handleGetTranslationConfig(sendResponse)
                    break

                case 'SET_TRANSLATION_CONFIG':
                    await this.handleSetTranslationConfig(message, sendResponse)
                    break

                case 'GET_TRANSLATION_RULES':
                    await this.handleGetTranslationRules(sendResponse)
                    break

                case 'SET_TRANSLATION_RULES':
                    await this.handleSetTranslationRules(message, sendResponse)
                    break

                case 'CHECK_TRANSLATION_RULES':
                    await this.handleCheckTranslationRules(message, sendResponse)
                    break

                case 'CHECK_DOMAIN_WHITELIST':
                    await this.handleCheckDomainWhitelist(message, sendResponse)
                    break

                case 'TRANSLATE_TEXT':
                    await this.handleTranslateText(message, sendResponse)
                    break

                default:
                    console.warn('Unknown message type:', message.type)
                    sendResponse({ success: false, error: 'Unknown message type' })
            }
        } catch (error) {
            console.error('Error handling message:', error)
            sendResponse({ success: false, error: error instanceof Error ? error.message : String(error) })
        }
    }

    /**
     * 处理获取翻译配置请求
     */
    private async handleGetTranslationConfig(sendResponse: Function): Promise<void> {
        const config = await ConfigManager.getTranslationConfig()
        sendResponse(config)
    }

    /**
     * 处理设置翻译配置请求
     */
    private async handleSetTranslationConfig(message: any, sendResponse: Function): Promise<void> {
        await ConfigManager.setTranslationConfig(message.config)
        // 更新翻译服务配置
        await this.translationService.updateConfig()
        sendResponse({ success: true })
    }

    /**
     * 处理获取翻译规则请求
     */
    private async handleGetTranslationRules(sendResponse: Function): Promise<void> {
        const rules = await ConfigManager.getTranslationRules()
        sendResponse(rules)
    }

    /**
     * 处理设置翻译规则请求
     */
    private async handleSetTranslationRules(message: any, sendResponse: Function): Promise<void> {
        await ConfigManager.setTranslationRules(message.rules)
        sendResponse({ success: true })
    }

    /**
     * 处理检查翻译规则请求
     */
    private async handleCheckTranslationRules(message: any, sendResponse: Function): Promise<void> {
        try {
            const shouldTranslate = await this.rulesChecker.shouldTranslate(message.text)
            sendResponse({ shouldTranslate })
        } catch (error) {
            console.error('Error checking translation rules:', error)
            sendResponse({ shouldTranslate: true }) // 出错时默认翻译
        }
    }

    /**
     * 处理检查域名白名单请求
     */
    private async handleCheckDomainWhitelist(message: any, sendResponse: Function): Promise<void> {
        try {
            const isAllowed = await this.whitelistManager.isDomainAllowed(message.domain)
            sendResponse({ isAllowed })
        } catch (error) {
            console.error('Error checking domain whitelist:', error)
            sendResponse({ isAllowed: false }) // 出错时默认不允许
        }
    }

    /**
     * 处理翻译文本请求
     */
    private async handleTranslateText(message: any, sendResponse: Function): Promise<void> {
        try {
            const result = await this.translationService.translateText(message.text, message.provider)
            sendResponse({ success: true, result })
        } catch (error) {
            console.error('Background translation error:', error)
            sendResponse({ success: false, error: error instanceof Error ? error.message : String(error) })
        }
    }
} 