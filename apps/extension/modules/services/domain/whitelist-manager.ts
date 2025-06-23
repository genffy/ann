import { ConfigManager } from '../../config/config-manager'

export class WhitelistManager {
    private static instance: WhitelistManager

    private constructor() { }

    static getInstance(): WhitelistManager {
        if (!WhitelistManager.instance) {
            WhitelistManager.instance = new WhitelistManager()
        }
        return WhitelistManager.instance
    }

    /**
     * 检查域名是否在白名单中
     * @param domain 待检查的域名
     * @returns 是否允许
     */
    async isDomainAllowed(domain: string): Promise<boolean> {
        try {
            const config = await ConfigManager.getTranslationConfig()

            // 如果域名白名单被禁用，允许所有域名
            if (!config.domainWhitelist || !config.domainWhitelist.enabled) {
                return true
            }

            const allowedDomains = config.domainWhitelist.domains || []

            // 检查精确匹配或正则表达式模式
            for (const allowedDomain of allowedDomains) {
                // 直接匹配
                if (domain === allowedDomain) {
                    return true
                }

                // 检查是否为子域名 (例如 m.x.com 匹配 x.com)
                if (domain.endsWith('.' + allowedDomain)) {
                    return true
                }

                // 尝试作为正则表达式模式使用（必须包含主域名）
                try {
                    const regex = new RegExp(allowedDomain, 'i')
                    if (regex.test(domain)) {
                        // 额外检查：确保主域名包含在内
                        const mainDomain = allowedDomain.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
                        if (domain.includes(allowedDomain.replace(/[.*+?^${}()|[\]\\]/g, ''))) {
                            return true
                        }
                    }
                } catch (error) {
                    // 如果正则表达式无效，作为字面字符串处理
                    console.warn('Invalid regex pattern in domain whitelist:', allowedDomain, error)
                }
            }

            return false
        } catch (error) {
            console.error('Error in isDomainAllowed:', error)
            return false // 出错时默认不允许
        }
    }

    /**
     * 添加域名到白名单
     * @param domain 要添加的域名
     */
    async addDomain(domain: string): Promise<void> {
        const config = await ConfigManager.getTranslationConfig()

        if (!config.domainWhitelist) {
            config.domainWhitelist = { enabled: true, domains: [] }
        }

        const domains = config.domainWhitelist.domains || []

        if (!domains.includes(domain)) {
            domains.push(domain)
            config.domainWhitelist.domains = domains
            await ConfigManager.setTranslationConfig(config)
            console.log(`Added domain to whitelist: ${domain}`)
        }
    }

    /**
     * 从白名单移除域名
     * @param domain 要移除的域名
     */
    async removeDomain(domain: string): Promise<void> {
        const config = await ConfigManager.getTranslationConfig()

        if (!config.domainWhitelist) {
            return
        }

        const domains = config.domainWhitelist.domains || []
        const domainIndex = domains.indexOf(domain)

        if (domainIndex !== -1) {
            domains.splice(domainIndex, 1)
            config.domainWhitelist.domains = domains
            await ConfigManager.setTranslationConfig(config)
            console.log(`Removed domain from whitelist: ${domain}`)
        }
    }

    /**
     * 切换域名在白名单中的状态
     * @param domain 要切换的域名
     */
    async toggleDomain(domain: string): Promise<void> {
        const config = await ConfigManager.getTranslationConfig()

        if (!config.domainWhitelist) {
            config.domainWhitelist = { enabled: true, domains: [] }
        }

        const domains = config.domainWhitelist.domains || []
        const domainIndex = domains.indexOf(domain)

        if (domainIndex === -1) {
            // 添加域名到白名单
            await this.addDomain(domain)
        } else {
            // 从白名单移除域名
            await this.removeDomain(domain)
        }
    }

    /**
     * 获取所有白名单域名
     */
    async getDomains(): Promise<string[]> {
        const config = await ConfigManager.getTranslationConfig()
        return config.domainWhitelist?.domains || []
    }

    /**
     * 启用/禁用域名白名单功能
     * @param enabled 是否启用
     */
    async setWhitelistEnabled(enabled: boolean): Promise<void> {
        const config = await ConfigManager.getTranslationConfig()

        if (!config.domainWhitelist) {
            config.domainWhitelist = { enabled: true, domains: [] }
        }

        config.domainWhitelist.enabled = enabled
        await ConfigManager.setTranslationConfig(config)
    }

    /**
     * 检查白名单功能是否启用
     */
    async isWhitelistEnabled(): Promise<boolean> {
        const config = await ConfigManager.getTranslationConfig()
        return config.domainWhitelist?.enabled ?? true
    }

    /**
     * 清空白名单
     */
    async clearWhitelist(): Promise<void> {
        const config = await ConfigManager.getTranslationConfig()

        if (config.domainWhitelist) {
            config.domainWhitelist.domains = []
            await ConfigManager.setTranslationConfig(config)
        }
    }

    /**
     * 批量添加域名到白名单
     * @param domains 要添加的域名数组
     */
    async addDomains(domains: string[]): Promise<void> {
        const config = await ConfigManager.getTranslationConfig()

        if (!config.domainWhitelist) {
            config.domainWhitelist = { enabled: true, domains: [] }
        }

        const existingDomains = config.domainWhitelist.domains || []
        const newDomains = domains.filter(domain => !existingDomains.includes(domain))

        if (newDomains.length > 0) {
            config.domainWhitelist.domains = [...existingDomains, ...newDomains]
            await ConfigManager.setTranslationConfig(config)
            console.log(`Added ${newDomains.length} domains to whitelist:`, newDomains)
        }
    }
} 