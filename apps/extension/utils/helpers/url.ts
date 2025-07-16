
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

/**
 * check if the url is valid
 * @param url the url to check
 * @returns if the url is valid
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
 * extract the domain from the url
 * @param url the url to extract the domain from
 * @returns the domain or null
 */
export function extractDomain(url: string): string | null {
    try {
        const urlObj = new URL(url)
        return urlObj.hostname
    } catch {
        return null
    }
}
