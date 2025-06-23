import { WhitelistManager } from '../domain/whitelist-manager'

export class ContextMenuManager {
    private static instance: ContextMenuManager
    private readonly MENU_ITEM_ID = 'domain-whitelist-toggle'
    private whitelistManager: WhitelistManager

    private constructor() {
        this.whitelistManager = WhitelistManager.getInstance()
    }

    static getInstance(): ContextMenuManager {
        if (!ContextMenuManager.instance) {
            ContextMenuManager.instance = new ContextMenuManager()
        }
        return ContextMenuManager.instance
    }

    /**
     * 初始化上下文菜单
     */
    async initialize(): Promise<void> {
        await this.createContextMenu()
        this.setupEventListeners()
    }

    /**
     * 创建上下文菜单
     */
    private async createContextMenu(): Promise<void> {
        // 先移除现有的菜单项
        browser.contextMenus.removeAll()

        // 创建域名管理菜单项
        browser.contextMenus.create({
            id: this.MENU_ITEM_ID,
            title: '检查域名状态...',
            contexts: ['page'],
        })
    }

    /**
     * 设置事件监听器
     */
    private setupEventListeners(): void {
        // 处理上下文菜单点击
        browser.contextMenus.onClicked.addListener(async (info, tab) => {
            if (info.menuItemId === this.MENU_ITEM_ID && tab?.url) {
                const url = new URL(tab.url)
                const domain = url.hostname

                // 切换域名在白名单中的状态
                await this.whitelistManager.toggleDomain(domain)

                // 更新上下文菜单以反映新状态
                await this.updateContextMenuForDomain(domain)

                // 通知内容脚本域名白名单已更新
                this.notifyContentScripts(domain)
            }
        })

        // 处理标签页激活
        browser.tabs.onActivated.addListener(async (activeInfo) => {
            const tab = await browser.tabs.get(activeInfo.tabId)
            if (tab.url) {
                const url = new URL(tab.url)
                const domain = url.hostname
                await this.updateContextMenuForDomain(domain)
            }
        })

        // 处理标签页更新
        browser.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
            if (changeInfo.url && tab.url) {
                const url = new URL(tab.url)
                const domain = url.hostname
                await this.updateContextMenuForDomain(domain)
            }
        })
    }

    /**
     * 为特定域名更新上下文菜单
     * @param domain 域名
     */
    private async updateContextMenuForDomain(domain: string): Promise<void> {
        try {
            const isInWhitelist = await this.isDomainInWhitelist(domain)
            const isWhitelistEnabled = await this.whitelistManager.isWhitelistEnabled()

            let title = ''
            if (!isWhitelistEnabled) {
                title = `域名白名单已禁用 (${domain})`
            } else if (isInWhitelist) {
                title = `从白名单移除 "${domain}"`
            } else {
                title = `添加 "${domain}" 到白名单`
            }

            browser.contextMenus.update(this.MENU_ITEM_ID, {
                title: title,
                enabled: isWhitelistEnabled
            })
        } catch (error) {
            console.error('Error updating context menu:', error)
        }
    }

    /**
     * 检查域名是否在白名单中
     * @param domain 域名
     * @returns 是否在白名单中
     */
    private async isDomainInWhitelist(domain: string): Promise<boolean> {
        const domains = await this.whitelistManager.getDomains()
        return domains.includes(domain)
    }

    /**
     * 通知内容脚本域名白名单已更新
     * @param domain 更新的域名
     */
    private notifyContentScripts(domain: string): void {
        browser.tabs.query({}, (tabs) => {
            tabs.forEach(tab => {
                if (tab.id) {
                    browser.tabs.sendMessage(tab.id, {
                        type: 'DOMAIN_WHITELIST_UPDATED',
                        domain: domain
                    }).catch(() => {
                        // 忽略没有内容脚本的标签页错误
                    })
                }
            })
        })
    }

    /**
     * 手动更新当前标签页的上下文菜单
     */
    async updateCurrentTabMenu(): Promise<void> {
        try {
            const tabs = await browser.tabs.query({ active: true, currentWindow: true })
            if (tabs.length > 0 && tabs[0].url) {
                const url = new URL(tabs[0].url)
                const domain = url.hostname
                await this.updateContextMenuForDomain(domain)
            }
        } catch (error) {
            console.error('Error updating current tab menu:', error)
        }
    }

    /**
     * 重新创建上下文菜单（用于配置更新后）
     */
    async recreateMenu(): Promise<void> {
        await this.createContextMenu()
        await this.updateCurrentTabMenu()
    }
} 