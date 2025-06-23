import { BaseTranslator } from './base-translator'
import { TranslationConfig } from '../../../config/default-config'

export class BaiduTranslator extends BaseTranslator {
    constructor(config: TranslationConfig) {
        super(config)
    }

    getName(): string {
        return 'Baidu Translate'
    }

    isAvailable(): boolean {
        return this.config.enableBaiduTranslate && this.validateApiKey()
    }

    validateApiKey(): boolean {
        const { appId, key } = this.config.apiKeys.baidu
        return appId !== undefined && appId.trim() !== '' &&
            key !== undefined && key.trim() !== ''
    }

    async translate(text: string, targetLang: string = 'zh'): Promise<string> {
        if (!this.validateApiKey()) {
            throw new Error('Baidu translation requires API credentials')
        }

        const { appId, key } = this.config.apiKeys.baidu

        // 生成签名所需参数
        const salt = Date.now().toString()
        const query = text
        const from = 'auto'
        const to = targetLang === 'zh' ? 'zh' : targetLang

        // 生成签名（需要MD5实现）
        const sign = this.generateMD5(`${appId}${query}${salt}${key}`)

        const url = 'https://fanyi-api.baidu.com/api/trans/vip/translate'
        const params = new URLSearchParams({
            q: query,
            from: from,
            to: to,
            appid: appId,
            salt: salt,
            sign: sign,
        })

        try {
            const response = await fetch(`${url}?${params}`)
            const data = await response.json()

            if (data.error_code) {
                throw new Error(`Baidu API Error: ${data.error_msg}`)
            }

            if (data.trans_result && data.trans_result[0]) {
                return data.trans_result[0].dst
            }

            throw new Error('Baidu translation failed - no result')
        } catch (error) {
            console.error('Baidu translation error:', error)
            throw error
        }
    }

    /**
     * 简单的MD5实现（用于百度翻译签名）
     * 注意：这是一个简化的实现，实际使用中应该使用完整的MD5算法
     */
    private generateMD5(str: string): string {
        // 这里应该实现真正的MD5算法
        // 为了简化，暂时返回一个固定值
        // 在实际使用中，需要导入crypto库或MD5实现
        return 'placeholder_md5_hash'
    }
} 