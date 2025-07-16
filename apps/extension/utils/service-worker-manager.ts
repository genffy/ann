import { Logger } from './logger'

export interface ServiceWorkerStatus {
    isAlive: boolean
    lastActiveTime: number
    isInitialized: boolean
}

/**
 * Service Worker 生命周期管理器
 * 用于在 Manifest V3 中管理 service worker 的状态和唤醒
 */
export class ServiceWorkerManager {
    private static instance: ServiceWorkerManager
    private lastPingTime: number = Date.now()
    private checkInterval: number | null = null

    static getInstance(): ServiceWorkerManager {
        if (!ServiceWorkerManager.instance) {
            ServiceWorkerManager.instance = new ServiceWorkerManager()
        }
        return ServiceWorkerManager.instance
    }

    /**
     * 检查 service worker 是否活跃
     */
    async isServiceWorkerAlive(): Promise<boolean> {
        try {
            // 发送一个简单的 ping 消息来检查 service worker
            const response = await chrome.runtime.sendMessage({
                type: 'PING',
                timestamp: Date.now()
            })

            this.lastPingTime = Date.now()
            return !!response
        } catch (error) {
            Logger.warn('Service worker ping failed:', error)
            return false
        }
    }

    /**
     * 等待 service worker 变为活跃状态
     * @param maxWaitTime 最大等待时间（毫秒）
     * @param checkInterval 检查间隔（毫秒）
     */
    async waitForServiceWorker(maxWaitTime: number = 10000, checkInterval: number = 500): Promise<boolean> {
        const startTime = Date.now()

        while (Date.now() - startTime < maxWaitTime) {
            if (await this.isServiceWorkerAlive()) {
                Logger.info('Service worker is now active')
                return true
            }

            Logger.info('Waiting for service worker to become active...')
            await this.delay(checkInterval)
        }

        Logger.error('Service worker failed to become active within timeout')
        return false
    }

    /**
 * 发送消息并在必要时等待 service worker 唤醒
 * @param message 要发送的消息
 * @param options 配置选项
 */
    async sendMessageWithRetry<T = any>(
        message: any,
        options: {
            maxRetries?: number
            retryDelay?: number
            timeout?: number
            waitForServiceWorker?: boolean
        } = {}
    ): Promise<T | null> {
        const {
            maxRetries = 3,
            retryDelay = 1000,
            timeout = 10000, // 默认 10 秒超时
            waitForServiceWorker = true
        } = options

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                Logger.info(`Sending message attempt ${attempt}/${maxRetries}:`, message.type)

                // 创建超时Promise
                const timeoutPromise = new Promise<never>((_, reject) => {
                    setTimeout(() => {
                        reject(new Error(`Message send timeout after ${timeout}ms`))
                    }, timeout)
                })

                // 发送消息
                const sendPromise = chrome.runtime.sendMessage(message)

                // 使用Promise.race实现超时控制
                const response = await Promise.race([sendPromise, timeoutPromise])

                if (response) {
                    Logger.info(`Message sent successfully on attempt ${attempt}`)
                    return response
                }

                throw new Error('No response received')

            } catch (error) {
                Logger.warn(`Message send failed on attempt ${attempt}:`, error)

                if (attempt === maxRetries) {
                    Logger.error(`All ${maxRetries} attempts failed`)
                    return null
                }

                // 如果启用了 service worker 等待，尝试等待其唤醒
                if (waitForServiceWorker) {
                    Logger.info('Waiting for service worker to wake up...')
                    await this.waitForServiceWorker(5000, 200)
                }

                // 延迟后重试
                await this.delay(retryDelay * attempt)
            }
        }

        return null
    }

    /**
     * 获取 service worker 状态
     */
    async getStatus(): Promise<ServiceWorkerStatus> {
        const isAlive = await this.isServiceWorkerAlive()

        return {
            isAlive,
            lastActiveTime: this.lastPingTime,
            isInitialized: isAlive // 简化判断，实际应该检查服务是否初始化完成
        }
    }

    /**
     * 开始定期检查 service worker 状态（主要用于调试）
     */
    startHealthCheck(interval: number = 30000): void {
        if (this.checkInterval) {
            clearInterval(this.checkInterval)
        }

        this.checkInterval = setInterval(async () => {
            const status = await this.getStatus()
            Logger.info('Service worker health check:', status)
        }, interval) as any
    }

    /**
     * 停止健康检查
     */
    stopHealthCheck(): void {
        if (this.checkInterval) {
            clearInterval(this.checkInterval)
            this.checkInterval = null
        }
    }

    /**
     * 延迟函数
     */
    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms))
    }
} 