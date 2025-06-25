import { nanoid } from 'nanoid'

// ID 生成工具
export const generateId = (prefix?: string): string => {
    const id = nanoid(12)
    return prefix ? `${prefix}_${id}` : id
}

// 防抖函数
export const debounce = <T extends (...args: any[]) => any>(
    func: T,
    delay: number
): ((...args: Parameters<T>) => void) => {
    let timeoutId: NodeJS.Timeout

    return (...args: Parameters<T>) => {
        clearTimeout(timeoutId)
        timeoutId = setTimeout(() => func(...args), delay)
    }
}

// 节流函数
export const throttle = <T extends (...args: any[]) => any>(
    func: T,
    delay: number
): ((...args: Parameters<T>) => void) => {
    let lastCall = 0

    return (...args: Parameters<T>) => {
        const now = Date.now()
        if (now - lastCall >= delay) {
            lastCall = now
            func(...args)
        }
    }
}

/**
 * check if the text is empty or only contains whitespace
 * @param text the text to check
 * @returns if the text is empty
 */
export function isEmpty(text: string): boolean {
    return !text || text.trim().length === 0
}

/**
 * check if the text length is within the specified range
 * @param text the text to check
 * @param min the minimum length
 * @param max the maximum length
 * @returns if the text length is within the specified range
 */
export function isTextLengthValid(text: string, min: number = 1, max: number = 5000): boolean {
    const length = text.trim().length
    return length >= min && length <= max
}

/**
 * safe json parse
 * @param jsonString the json string to parse
 * @param defaultValue the default value
 * @returns the parsed result or the default value
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
 * delay function
 * @param ms the delay time in milliseconds
 * @returns a promise that resolves after the delay
 */
export function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * retry function
 * @param fn the function to retry
 * @param retries the number of retries
 * @param delayMs the delay time in milliseconds
 * @returns a promise that resolves after the retries
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
 * get a random string
 * @param length the length of the string
 * @returns a random string
 */
export function getRandomString(length: number = 8): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let result = ''
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
}

// 导出DOM工具
export { domUtils } from './dom'
