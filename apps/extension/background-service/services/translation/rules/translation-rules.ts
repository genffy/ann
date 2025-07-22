import { ConfigService } from '../../config'
import { CryptoDetector } from './crypto-detector'

export class TranslationRulesChecker {
    private static instance: TranslationRulesChecker
    private cryptoDetector: CryptoDetector

    private constructor() {
        this.cryptoDetector = new CryptoDetector()
    }

    static getInstance(): TranslationRulesChecker {
        if (!TranslationRulesChecker.instance) {
            TranslationRulesChecker.instance = new TranslationRulesChecker()
        }
        return TranslationRulesChecker.instance
    }

    /**
     * 检查文本是否应该被翻译
     * @param text 待检查的文本
     * @returns 是否应该翻译
     */
    async shouldTranslate(text: string): Promise<boolean> {
        try {
            const rules = await ConfigService.getInstance().getTranslationRules()

            // 如果规则被禁用，翻译所有内容
            if (!rules.enabled) {
                return true
            }

            // 检查是否仅为中文字符
            if (rules.skipChinese && this.isChineseOnly(text)) {
                return false
            }

            // 检查是否仅为数字
            if (rules.skipNumbers && this.isNumbersOnly(text)) {
                return false
            }

            // 检查是否为加密货币合约地址
            if (rules.skipCryptoAddresses && this.cryptoDetector.isCryptoAddress(text)) {
                return false
            }

            // 检查自定义规则
            if (rules.customRules && rules.customRules.length > 0) {
                if (this.matchesCustomRules(text, rules.customRules)) {
                    return false
                }
            }

            return true
        } catch (error) {
            console.error('Error in shouldTranslate:', error)
            return true // 出错时默认翻译
        }
    }

    /**
     * 检查文本是否仅包含中文字符
     */
    private isChineseOnly(text: string): boolean {
        return /^[\u4e00-\u9fa5\s\p{P}]*$/u.test(text)
    }

    /**
     * 检查文本是否仅包含数字
     */
    private isNumbersOnly(text: string): boolean {
        return /^[\d\s\.\,\-\+]*$/.test(text)
    }

    /**
     * 检查文本是否匹配自定义规则
     */
    private matchesCustomRules(text: string, customRules: any[]): boolean {
        for (const rule of customRules) {
            if (rule.enabled && rule.pattern) {
                try {
                    const regex = new RegExp(rule.pattern, rule.flags || 'i')
                    if (regex.test(text)) {
                        return true
                    }
                } catch (error) {
                    console.warn('Invalid custom rule pattern:', rule.pattern, error)
                }
            }
        }
        return false
    }

    /**
     * 添加自定义规则
     */
    async addCustomRule(pattern: string, flags?: string, description?: string): Promise<void> {
        const rules = await ConfigService.getInstance().getTranslationRules()

        if (!rules.customRules) {
            rules.customRules = []
        }

        rules.customRules.push({
            enabled: true,
            pattern,
            flags,
            description,
            createdAt: new Date().toISOString()
        })

        await ConfigService.getInstance().setTranslationRules(rules)
    }

    /**
     * 移除自定义规则
     */
    async removeCustomRule(index: number): Promise<void> {
        const rules = await ConfigService.getInstance().getTranslationRules()

        if (rules.customRules && index >= 0 && index < rules.customRules.length) {
            rules.customRules.splice(index, 1)
            await ConfigService.getInstance().setTranslationRules(rules)
        }
    }

    /**
     * 启用/禁用自定义规则
     */
    async toggleCustomRule(index: number, enabled: boolean): Promise<void> {
        const rules = await ConfigService.getInstance().getTranslationRules()

        if (rules.customRules && index >= 0 && index < rules.customRules.length) {
            rules.customRules[index].enabled = enabled
            await ConfigService.getInstance().setTranslationRules(rules)
        }
    }
} 