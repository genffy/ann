import { UIToBackgroundMessage, ResponseMessage, BaseMessage } from '../../types/messages'
import { ServiceWorkerManager } from './service-worker-manager'

/**
 * 消息工具库
 * 提供消息发送和处理的工具函数
 */
export default class MessageUtils {
    private static serviceWorkerManager = ServiceWorkerManager.getInstance()
    /**
     * 发送消息到background script（带重试机制）
     * @param message 消息对象
     * @param retryCount 重试次数（默认3次）
     * @returns 响应Promise
     */
    static async sendMessage<T = any>(message: UIToBackgroundMessage, retryCount: number = 3): Promise<ResponseMessage<T>> {
        const messageWithMeta = {
            ...message,
            requestId: this.generateRequestId(),
            timestamp: Date.now()
        }

        for (let attempt = 1; attempt <= retryCount; attempt++) {
            try {
                console.log(`[MessageUtils] Sending message (attempt ${attempt}/${retryCount}):`, message.type)

                const response = await chrome.runtime.sendMessage(messageWithMeta)

                if (!response) {
                    throw new Error('No response received from background script')
                }

                console.log(`[MessageUtils] Message sent successfully on attempt ${attempt}`)
                return response

            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error'
                console.warn(`[MessageUtils] Message send failed on attempt ${attempt}:`, errorMessage)

                // 如果是最后一次尝试，返回错误
                if (attempt === retryCount) {
                    console.error(`[MessageUtils] All ${retryCount} attempts failed for message:`, message.type)
                    return this.createResponse<T>(false, undefined, `Failed after ${retryCount} attempts: ${errorMessage}`)
                }

                // 等待一段时间再重试（指数退避）
                const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000)
                console.log(`[MessageUtils] Retrying in ${delay}ms...`)
                await this.delay(delay)
            }
        }

        // 理论上不会执行到这里，但为了类型安全
        return this.createResponse<T>(false, undefined, 'Unexpected error in retry loop')
    }

    /**
 * 使用 ServiceWorker 管理器发送消息（推荐使用）
 * 这个方法会自动处理 service worker 的唤醒和重试逻辑
 * @param message 消息对象
 * @param options 配置选项
 * @returns 响应Promise
 */
    static async sendMessageWithServiceWorkerSupport<T = any>(
        message: UIToBackgroundMessage,
        options: {
            maxRetries?: number
            retryDelay?: number
            timeout?: number
            waitForServiceWorker?: boolean
        } = {}
    ): Promise<ResponseMessage<T>> {
        try {
            const messageWithMeta = {
                ...message,
                requestId: this.generateRequestId(),
                timestamp: Date.now()
            }

            console.log('[MessageUtils] Sending message with service worker support:', message.type)

            // 如果设置了超时，使用Promise.race来实现超时控制
            const sendPromise = this.serviceWorkerManager.sendMessageWithRetry<ResponseMessage<T>>(
                messageWithMeta,
                {
                    maxRetries: options.maxRetries || 3,
                    retryDelay: options.retryDelay || 1000,
                    waitForServiceWorker: options.waitForServiceWorker !== false
                }
            )

            let response: ResponseMessage<T> | null

            if (options.timeout && options.timeout > 0) {
                // 使用超时控制
                const timeoutPromise = new Promise<null>((_, reject) => {
                    setTimeout(() => {
                        reject(new Error(`Message timeout after ${options.timeout}ms`))
                    }, options.timeout)
                })

                response = await Promise.race([sendPromise, timeoutPromise])
            } else {
                // 不使用超时
                response = await sendPromise
            }

            if (!response) {
                return this.createResponse<T>(false, undefined, 'Failed to get response from background script')
            }

            return response

        } catch (error) {
            console.error('[MessageUtils] Failed to send message with service worker support:', error)

            // 特别处理超时错误
            if (error instanceof Error && error.message.includes('timeout')) {
                return this.createResponse<T>(false, undefined, `Request timeout: ${error.message}`)
            }

            return this.createResponse<T>(false, undefined, error instanceof Error ? error.message : 'Unknown error')
        }
    }

    /**
     * 检查 service worker 状态
     */
    static async checkServiceWorkerStatus() {
        return await this.serviceWorkerManager.getStatus()
    }

    /**
     * 延迟函数
     * @param ms 延迟毫秒数
     */
    static delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms))
    }

    /**
     * 创建响应消息
     * @param success 是否成功
     * @param data 数据
     * @param error 错误信息
     * @returns 响应消息
     */
    static createResponse<T = any>(success: boolean, data?: T, error?: string): ResponseMessage<T> {
        return {
            type: 'RESPONSE',
            success,
            data,
            error,
            timestamp: Date.now()
        }
    }

    /**
     * 生成唯一请求ID
     * @returns 请求ID
     */
    static generateRequestId(): string {
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    }

    /**
     * 检查是否为有效消息
     * @param message 消息对象
     * @returns 是否有效
     */
    static isValidMessage(message: any): message is BaseMessage {
        return message && typeof message === 'object' && typeof message.type === 'string'
    }

    /**
 * 检查是否为响应消息
 * @param message 消息对象
 * @returns 是否为响应消息
 */
    static isResponseMessage(message: any): message is ResponseMessage {
        return message && typeof message === 'object' &&
            typeof message.type === 'string' &&
            typeof message.success === 'boolean'
    }

    /**
     * 包装异步消息处理器
     * @param handler 处理器函数
     * @returns 包装后的处理器
     */
    static wrapAsyncHandler<T extends BaseMessage = BaseMessage>(
        handler: (message: T, sender: chrome.runtime.MessageSender) => Promise<ResponseMessage>
    ) {
        return (message: T, sender: chrome.runtime.MessageSender, sendResponse: (response: ResponseMessage) => void) => {
            handler(message, sender)
                .then(response => sendResponse(response))
                .catch(error => {
                    console.error('Message handler error:', error)
                    sendResponse(this.createResponse(false, undefined, error instanceof Error ? error.message : 'Unknown error'))
                })
            return true // 保持消息通道开放
        }
    }

    /**
     * 创建消息处理器映射
     * @param handlers 处理器映射
     * @returns 处理器函数
     */
    static createMessageHandler(handlers: Record<string, (message: any, sender: chrome.runtime.MessageSender) => Promise<ResponseMessage>>) {
        console.log('createMessageHandler', handlers)
        return this.wrapAsyncHandler(async (message: BaseMessage, sender: chrome.runtime.MessageSender) => {
            const handler = handlers[message.type]
            console.log(message, handlers)
            if (!handler) {
                return this.createResponse(false, undefined, `Unknown message type: ${message.type}`)
            }
            return handler(message, sender)
        })
    }
}
