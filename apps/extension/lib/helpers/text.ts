import { NOTES_CONFIG, TRANSLATION_CONFIG } from '../../constants'
import CryptoJS from "crypto-js"

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
