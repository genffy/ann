

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