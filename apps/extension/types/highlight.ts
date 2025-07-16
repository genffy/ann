// 高亮记录类型定义
export interface HighlightRecord {
    id: string
    url: string
    domain: string
    selector: string
    originalText: string
    textHash: string
    color: string
    timestamp: number
    lastModified: number
    position: {
        x: number
        y: number
        width: number
        height: number
    }
    context: {
        before: string
        after: string
    }
    status: 'active' | 'archived' | 'deleted'
    metadata: {
        pageTitle: string
        pageUrl: string
        userId?: string
    }
}

// 高亮颜色配置
export interface HighlightColor {
    name: string
    value: string
    textColor: string
}

// 高亮配置
export interface HighlightConfig {
    enabled: boolean
    colors: HighlightColor[]
    defaultColor: string
    maxHighlights: number
    autoSync: boolean
}

// 高亮操作结果
export interface HighlightResult {
    success: boolean
    data?: HighlightRecord
    error?: string
}

// 高亮查询参数
export interface HighlightQuery {
    url?: string
    domain?: string
    status?: 'active' | 'archived' | 'deleted'
    limit?: number
    offset?: number
    id?: string
} 