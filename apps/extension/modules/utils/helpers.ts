/**
 * 简单的MD5实现（用于百度翻译签名）
 * 注意：这是一个简化的实现，实际使用中应该使用完整的MD5算法
 * @param str 待加密的字符串
 * @returns MD5哈希值
 */
export function generateMD5(str: string): string {
    // 这里应该实现真正的MD5算法
    // 为了简化，暂时返回一个固定值
    // 在实际使用中，需要导入crypto库或MD5实现
    return 'placeholder_md5_hash'
}

/**
 * 防抖函数
 * @param func 要防抖的函数
 * @param delay 延迟时间
 * @returns 防抖后的函数
 */
export function debounce<T extends (...args: any[]) => any>(
    func: T,
    delay: number
): (...args: Parameters<T>) => void {
    let timeoutId: ReturnType<typeof setTimeout>
    return (...args: Parameters<T>) => {
        clearTimeout(timeoutId)
        timeoutId = setTimeout(() => func(...args), delay)
    }
}

/**
 * 节流函数
 * @param func 要节流的函数
 * @param limit 时间限制
 * @returns 节流后的函数
 */
export function throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number
): (...args: Parameters<T>) => void {
    let inThrottle: boolean
    return (...args: Parameters<T>) => {
        if (!inThrottle) {
            func(...args)
            inThrottle = true
            setTimeout(() => inThrottle = false, limit)
        }
    }
}

/**
 * 检查URL是否有效
 * @param url 待检查的URL
 * @returns 是否有效
 */
export function isValidUrl(url: string): boolean {
    try {
        new URL(url)
        return true
    } catch {
        return false
    }
}

/**
 * 从URL中提取域名
 * @param url URL字符串
 * @returns 域名或null
 */
export function extractDomain(url: string): string | null {
    try {
        const urlObj = new URL(url)
        return urlObj.hostname
    } catch {
        return null
    }
}

/**
 * 检查文本是否为空或仅包含空白字符
 * @param text 待检查的文本
 * @returns 是否为空
 */
export function isEmpty(text: string): boolean {
    return !text || text.trim().length === 0
}

/**
 * 检查文本长度是否在指定范围内
 * @param text 待检查的文本
 * @param min 最小长度
 * @param max 最大长度
 * @returns 是否在范围内
 */
export function isTextLengthValid(text: string, min: number = 1, max: number = 5000): boolean {
    const length = text.trim().length
    return length >= min && length <= max
}

/**
 * 安全的JSON解析
 * @param jsonString JSON字符串
 * @param defaultValue 默认值
 * @returns 解析结果或默认值
 */
export function safeJsonParse<T>(jsonString: string, defaultValue: T): T {
    try {
        return JSON.parse(jsonString)
    } catch (error) {
        console.warn('JSON parse error:', error)
        return defaultValue
    }
}

/**
 * 延迟执行
 * @param ms 延迟毫秒数
 * @returns Promise
 */
export function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * 重试函数
 * @param fn 要重试的函数
 * @param retries 重试次数
 * @param delayMs 重试间隔
 * @returns Promise
 */
export async function retry<T>(
    fn: () => Promise<T>,
    retries: number = 3,
    delayMs: number = 1000
): Promise<T> {
    for (let i = 0; i < retries; i++) {
        try {
            return await fn()
        } catch (error) {
            if (i === retries - 1) {
                throw error
            }
            await delay(delayMs)
        }
    }
    throw new Error('Retry failed')
}

/**
 * 获取随机字符串
 * @param length 字符串长度
 * @returns 随机字符串
 */
export function getRandomString(length: number = 8): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let result = ''
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
}

/**
 * 简单的日志记录器
 */
export class Logger {
    private static prefix = '[Translation Extension]'

    static info(message: string, ...args: any[]): void {
        console.log(`${this.prefix} [INFO]`, message, ...args)
    }

    static warn(message: string, ...args: any[]): void {
        console.warn(`${this.prefix} [WARN]`, message, ...args)
    }

    static error(message: string, ...args: any[]): void {
        console.error(`${this.prefix} [ERROR]`, message, ...args)
    }

    static debug(message: string, ...args: any[]): void {
        if (process.env.NODE_ENV === 'development') {
            console.debug(`${this.prefix} [DEBUG]`, message, ...args)
        }
    }
} 