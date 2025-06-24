import { nanoid } from 'nanoid'
import CryptoJS from 'crypto-js'
import { TRANSLATION_CONFIG, NOTES_CONFIG, SHARING_CONFIG } from './constants'

// ID 生成工具
export const generateId = (prefix?: string): string => {
    const id = nanoid(12)
    return prefix ? `${prefix}_${id}` : id
}

// 文本处理工具
export const textUtils = {
    // 清理文本，移除多余空格和换行
    clean: (text: string): string => {
        return text.trim().replace(/\s+/g, ' ')
    },

    // 截断文本
    truncate: (text: string, maxLength: number, suffix = '...'): string => {
        if (text.length <= maxLength) return text
        return text.slice(0, maxLength - suffix.length) + suffix
    },

    // 计算文本hash
    hash: (text: string): string => {
        return CryptoJS.MD5(text).toString()
    },

    // 验证文本是否适合翻译
    isValidForTranslation: (text: string): boolean => {
        const cleanText = textUtils.clean(text)
        return cleanText.length >= TRANSLATION_CONFIG.minTextLength &&
            cleanText.length <= TRANSLATION_CONFIG.maxTextLength
    },

    // 检测文本主要语言
    detectLanguage: (text: string): string => {
        // 简单的语言检测
        const chinese = /[\u4e00-\u9fa5]/g
        const japanese = /[\u3040-\u309f\u30a0-\u30ff]/g
        const korean = /[\uac00-\ud7af]/g

        if (chinese.test(text)) return 'zh'
        if (japanese.test(text)) return 'ja'
        if (korean.test(text)) return 'ko'
        return 'en'
    },

    // 生成摘要（简单版本）
    generateSummary: (text: string): string => {
        const sentences = text.split(/[.!?。！？]+/).filter(s => s.trim())
        if (sentences.length <= 2) return textUtils.clean(text)

        // 取前两句作为摘要
        const summary = sentences.slice(0, 2).join('. ').trim()
        return textUtils.truncate(summary, NOTES_CONFIG.summary.maxLength)
    }
}

// DOM 操作工具
export const domUtils = {
    // 获取元素相对于视口的位置
    getElementPosition: (element: Element): DOMRect => {
        return element.getBoundingClientRect()
    },

    // 获取文本选择的边界矩形
    getSelectionBounds: (selection: Selection): DOMRect | null => {
        if (selection.rangeCount === 0) return null
        const range = selection.getRangeAt(0)
        return range.getBoundingClientRect()
    },

    // 计算工具栏最佳位置
    calculateToolbarPosition: (
        selectionRect: DOMRect,
        toolbarWidth: number,
        toolbarHeight: number
    ): { x: number; y: number } => {
        const viewport = {
            width: window.innerWidth,
            height: window.innerHeight
        }

        // 默认位置：选择区域上方居中
        let x = selectionRect.left + (selectionRect.width - toolbarWidth) / 2
        let y = selectionRect.top - toolbarHeight - 10

        // 边界检测和调整
        if (x < 10) x = 10
        if (x + toolbarWidth > viewport.width - 10) {
            x = viewport.width - toolbarWidth - 10
        }

        // 如果上方空间不足，放到下方
        if (y < 10) {
            y = selectionRect.bottom + 10
        }

        return { x, y }
    },

    // 创建并插入样式
    injectStyles: (css: string, id?: string): HTMLStyleElement => {
        const style = document.createElement('style')
        style.textContent = css
        if (id) style.id = id
        document.head.appendChild(style)
        return style
    },

    // 移除元素
    removeElement: (selector: string): void => {
        const element = document.querySelector(selector)
        if (element) element.remove()
    },

    // 检测元素是否在视口内
    isInViewport: (element: Element): boolean => {
        const rect = element.getBoundingClientRect()
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= window.innerHeight &&
            rect.right <= window.innerWidth
        )
    }
}

// 时间工具
export const timeUtils = {
    // 格式化时间戳
    format: (timestamp: number, format = 'YYYY-MM-DD HH:mm:ss'): string => {
        const date = new Date(timestamp)
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        const hours = String(date.getHours()).padStart(2, '0')
        const minutes = String(date.getMinutes()).padStart(2, '0')
        const seconds = String(date.getSeconds()).padStart(2, '0')

        return format
            .replace('YYYY', year.toString())
            .replace('MM', month)
            .replace('DD', day)
            .replace('HH', hours)
            .replace('mm', minutes)
            .replace('ss', seconds)
    },

    // 获取相对时间描述
    getRelativeTime: (timestamp: number): string => {
        const now = Date.now()
        const diff = now - timestamp

        const minute = 60 * 1000
        const hour = 60 * minute
        const day = 24 * hour
        const week = 7 * day

        if (diff < minute) return '刚刚'
        if (diff < hour) return `${Math.floor(diff / minute)}分钟前`
        if (diff < day) return `${Math.floor(diff / hour)}小时前`
        if (diff < week) return `${Math.floor(diff / day)}天前`

        return timeUtils.format(timestamp, 'YYYY-MM-DD')
    }
}

// 存储工具
export const storageUtils = {
    // 设置存储数据
    set: async (key: string, value: any): Promise<void> => {
        try {
            await chrome.storage.local.set({ [key]: value })
        } catch (error) {
            console.error('Storage set error:', error)
            throw error
        }
    },

    // 获取存储数据
    get: async <T>(key: string, defaultValue?: T): Promise<T> => {
        try {
            const result = await chrome.storage.local.get(key)
            return result[key] ?? defaultValue
        } catch (error) {
            console.error('Storage get error:', error)
            return defaultValue as T
        }
    },

    // 移除存储数据
    remove: async (key: string): Promise<void> => {
        try {
            await chrome.storage.local.remove(key)
        } catch (error) {
            console.error('Storage remove error:', error)
            throw error
        }
    },

    // 清空所有数据
    clear: async (): Promise<void> => {
        try {
            await chrome.storage.local.clear()
        } catch (error) {
            console.error('Storage clear error:', error)
            throw error
        }
    }
}

// 文件工具
export const fileUtils = {
    // 下载文件
    download: (blob: Blob, filename: string): void => {
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = filename
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
    },

    // 将 canvas 转换为 Blob
    canvasToBlob: (canvas: HTMLCanvasElement, format = 'image/png', quality = 0.9): Promise<Blob> => {
        return new Promise((resolve, reject) => {
            canvas.toBlob(
                (blob) => {
                    if (blob) resolve(blob)
                    else reject(new Error('Canvas to blob conversion failed'))
                },
                format,
                quality
            )
        })
    },

    // 图片 URL 转 Blob
    urlToBlob: async (url: string): Promise<Blob> => {
        const response = await fetch(url)
        return response.blob()
    }
}

// 错误处理工具
export const errorUtils = {
    // 创建标准错误对象
    create: (type: string, message: string, details?: any) => {
        const error = new Error(message)
        error.name = type
        if (details) (error as any).details = details
        return error
    },

    // 错误日志记录
    log: (error: Error, context?: string): void => {
        console.error(`[ANN Error]${context ? ` ${context}:` : ''}`, error)
    },

    // 用户友好的错误消息
    getUserMessage: (error: Error): string => {
        switch (error.name) {
            case 'NetworkError':
                return '网络连接失败，请检查网络设置'
            case 'PermissionError':
                return '权限不足，请检查扩展权限设置'
            case 'ValidationError':
                return '输入数据无效，请检查输入内容'
            default:
                return '操作失败，请稍后重试'
        }
    }
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

// URL 工具
export const urlUtils = {
    // 获取当前页面信息
    getCurrentPageInfo: () => ({
        url: window.location.href,
        title: document.title,
        domain: window.location.hostname,
        timestamp: Date.now()
    }),

    // 生成 Twitter 分享链接
    getTwitterShareUrl: (text: string, url?: string): string => {
        const params = new URLSearchParams()
        params.set('text', text)
        if (url) params.set('url', url)
        return `https://twitter.com/intent/tweet?${params.toString()}`
    }
}

// 类型定义
export interface NoteRecord {
    id: string
    url: string
    domain: string
    selector: string
    originalText: string
    textHash: string
    summary: string
    userComment: string
    timestamp: number
    lastModified: number
    position: { x: number; y: number }
    context: {
        before: string
        after: string
    }
    status: 'active' | 'archived' | 'deleted'
    type: 'manual' | 'auto'
    tags: string[]
    metadata: {
        pageTitle: string
        pageUrl: string
        userId?: string
    }
}

export interface NoteSearchOptions {
    url?: string
    domain?: string
    text?: string
    tags?: string[]
    status?: 'active' | 'archived' | 'deleted'
    limit?: number
    offset?: number
    sortBy?: 'timestamp' | 'lastModified' | 'relevance'
    sortOrder?: 'asc' | 'desc'
}

export interface NoteMatchResult {
    note: NoteRecord
    confidence: number
    matchType: 'exact' | 'fuzzy' | 'context'
    element: Element | null
    position: DOMRect | null
}

// 备注功能错误处理
export const notesErrorUtils = {
    /**
     * 记录备注相关错误
     */
    logNotesError: (error: Error, context: string, noteData?: any) => {
        const errorInfo = {
            message: error.message,
            stack: error.stack,
            context: `Notes.${context}`,
            timestamp: Date.now(),
            noteData: noteData ? {
                id: noteData.id,
                url: noteData.url,
                textLength: noteData.originalText?.length
            } : null
        }

        console.error('[ANN Notes Error]', errorInfo)

        // 发送错误到background script进行统计
        try {
            if (typeof chrome !== 'undefined' && chrome.runtime) {
                chrome.runtime.sendMessage({
                    type: 'LOG_ERROR',
                    error: errorInfo
                }).catch(() => {
                    // 忽略发送失败，避免无限循环
                })
            }
        } catch (e) {
            // 忽略发送失败
        }
    },

    /**
     * 创建备注特定错误
     */
    createNotesError: (type: string, message: string, originalError?: Error): Error => {
        const error = new Error(`[Notes ${type}] ${message}`)
        if (originalError) {
            error.stack = originalError.stack
        }
        return error
    },

    /**
     * 安全执行备注操作
     */
    safeExecute: async <T>(
        operation: () => Promise<T>,
        context: string,
        fallbackValue?: T
    ): Promise<T | null> => {
        try {
            return await operation()
        } catch (error) {
            notesErrorUtils.logNotesError(error as Error, context)
            return fallbackValue ?? null
        }
    },

    /**
     * 验证备注数据
     */
    validateNoteData: (data: any): { isValid: boolean; errors: string[] } => {
        const errors: string[] = []

        if (!data) {
            errors.push('备注数据不能为空')
            return { isValid: false, errors }
        }

        if (!data.originalText || typeof data.originalText !== 'string') {
            errors.push('原始文本无效')
        }

        if (data.originalText && data.originalText.length > 10000) {
            errors.push('文本长度超过限制')
        }

        if (!data.url || typeof data.url !== 'string') {
            errors.push('URL无效')
        }

        if (data.url && data.url.length > 2000) {
            errors.push('URL长度超过限制')
        }

        return {
            isValid: errors.length === 0,
            errors
        }
    }
}

// 备注功能测试工具
export const notesTestUtils = {
    /**
     * 生成测试备注数据
     */
    generateTestNote: (overrides: Partial<NoteRecord> = {}): NoteRecord => {
        const baseNote: NoteRecord = {
            id: `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            url: 'https://example.com/test',
            domain: 'example.com',
            selector: 'body > p:nth-child(1)',
            originalText: '这是一个测试文本，用于验证备注功能的正常工作。',
            textHash: textUtils.hash('这是一个测试文本，用于验证备注功能的正常工作。'),
            summary: '测试文本摘要',
            userComment: '这是一个测试评论',
            timestamp: Date.now(),
            lastModified: Date.now(),
            position: { x: 100, y: 200 },
            status: 'active',
            type: 'manual',
            tags: ['测试', '示例'],
            context: {
                before: '前文内容',
                after: '后文内容'
            },
            metadata: {
                pageTitle: '测试页面',
                pageUrl: 'https://example.com/test',
                userId: 'test-user'
            }
        }

        return { ...baseNote, ...overrides }
    },

    /**
     * 模拟文本选择
     */
    mockTextSelection: (text: string = '测试选择文本'): any => {
        return {
            text,
            range: null, // 在测试环境中可能无法创建真实的Range
            boundingRect: new DOMRect(100, 200, 150, 20),
            timestamp: Date.now()
        }
    },

    /**
     * 验证备注功能状态
     */
    validateNotesState: (state: any): { isValid: boolean; issues: string[] } => {
        const issues: string[] = []

        if (!state) {
            issues.push('状态对象为空')
            return { isValid: false, issues }
        }

        // 检查必要的状态字段
        const requiredFields = [
            'isLoading', 'currentNote', 'notesList', 'filteredNotes',
            'searchQuery', 'filterStatus', 'notesCount'
        ]

        requiredFields.forEach(field => {
            if (!(field in state)) {
                issues.push(`缺少必要字段: ${field}`)
            }
        })

        // 检查数据类型
        if (state.notesList && !Array.isArray(state.notesList)) {
            issues.push('notesList 应该是数组')
        }

        if (state.notesCount && typeof state.notesCount !== 'object') {
            issues.push('notesCount 应该是对象')
        }

        return {
            isValid: issues.length === 0,
            issues
        }
    },

    /**
     * 性能测试工具
     */
    performanceTest: {
        /**
         * 测试摘要生成性能
         */
        testSummaryGeneration: async (texts: string[]): Promise<{
            averageTime: number;
            maxTime: number;
            minTime: number;
            results: Array<{ text: string; time: number; summary: string }>
        }> => {
            const results = []
            const times = []

            for (const text of texts) {
                const startTime = performance.now()

                // 这里应该调用实际的摘要生成函数
                // 暂时使用模拟实现
                const summary = text.substring(0, Math.min(50, text.length)) + '...'

                const endTime = performance.now()
                const time = endTime - startTime

                times.push(time)
                results.push({ text, time, summary })
            }

            return {
                averageTime: times.reduce((a, b) => a + b, 0) / times.length,
                maxTime: Math.max(...times),
                minTime: Math.min(...times),
                results
            }
        },

        /**
         * 测试数据库操作性能
         */
        testDatabasePerformance: async (operations: number = 100): Promise<{
            createTime: number;
            readTime: number;
            updateTime: number;
            deleteTime: number;
        }> => {
            // 这里应该实际测试数据库操作
            // 暂时返回模拟数据
            return {
                createTime: Math.random() * 10,
                readTime: Math.random() * 5,
                updateTime: Math.random() * 8,
                deleteTime: Math.random() * 3
            }
        }
    }
} 