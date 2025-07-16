import { useState, useEffect } from 'react'
import { HighlightRecord, HighlightQuery } from '../../types/highlight'
import MessageUtils from '../../utils/helpers/message-utils'
import './highlight-list.css'

interface HighlightListProps {
    className?: string
    showHeader?: boolean
    showPagination?: boolean
    initialPageSize?: number
    onHighlightClick?: (highlight: HighlightRecord) => void
    alwaysNewTab?: boolean
}

interface PaginationInfo {
    currentPage: number
    pageSize: number
    total: number
    totalPages: number
}

const PAGE_SIZE_OPTIONS = [5, 10, 20, 50, 100]

export default function HighlightList({
    className = '',
    showHeader = true,
    showPagination = true,
    initialPageSize = 20,
    onHighlightClick,
    alwaysNewTab = false
}: HighlightListProps) {
    const [highlights, setHighlights] = useState<HighlightRecord[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'archived' | 'deleted'>('all')
    const [pagination, setPagination] = useState<PaginationInfo>({
        currentPage: 1,
        pageSize: initialPageSize,
        total: 0,
        totalPages: 0
    })

    // 加载高亮数据
    const loadHighlights = async () => {
        setLoading(true)
        setError(null)

        try {
            // 构建查询参数
            const query: HighlightQuery = {
                status: statusFilter === 'all' ? undefined : statusFilter,
                limit: pagination.pageSize,
                offset: (pagination.currentPage - 1) * pagination.pageSize
            }

            // 通过background script获取高亮数据
            const response = await MessageUtils.sendMessage({
                type: 'GET_HIGHLIGHTS',
                query: query
            })

            if (!response.success) {
                throw new Error(response.error || '获取高亮数据失败')
            }

            const allHighlights = response.data as HighlightRecord[]

            // 应用搜索过滤
            let filteredHighlights = allHighlights
            if (searchQuery.trim()) {
                const searchTerm = searchQuery.toLowerCase()
                filteredHighlights = allHighlights.filter((h: HighlightRecord) =>
                    h.originalText.toLowerCase().includes(searchTerm) ||
                    h.metadata.pageTitle.toLowerCase().includes(searchTerm) ||
                    h.url.toLowerCase().includes(searchTerm)
                )
            }

            // 更新分页信息
            const total = filteredHighlights.length
            const totalPages = Math.ceil(total / pagination.pageSize)
            setPagination(prev => ({
                ...prev,
                total,
                totalPages
            }))

            // 获取当前页数据
            const offset = (pagination.currentPage - 1) * pagination.pageSize
            const currentPageHighlights = filteredHighlights.slice(offset, offset + pagination.pageSize)

            setHighlights(currentPageHighlights)
        } catch (err) {
            setError(err instanceof Error ? err.message : '加载高亮数据失败')
        } finally {
            setLoading(false)
        }
    }

    // 处理高亮点击
    const handleHighlightClick = async (highlight: HighlightRecord) => {
        if (onHighlightClick) {
            onHighlightClick(highlight)
        } else {
            // 默认行为：通过background script定位高亮
            try {
                const response = await MessageUtils.sendMessage({
                    type: 'LOCATE_HIGHLIGHT',
                    data: {
                        id: highlight.id
                    }
                })

                if (!response.success) {
                    console.error('Failed to locate highlight:', response.error)
                }
            } catch (err) {
                console.error('Failed to locate highlight:', err)
            }
        }
    }

    // 格式化时间
    const formatTime = (timestamp: number) => {
        return new Date(timestamp).toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    // 截断文本
    const truncateText = (text: string, maxLength: number = 200) => {
        if (text.length <= maxLength) return text
        return text.substring(0, maxLength) + '...'
    }

    // 页面大小变化处理
    const handlePageSizeChange = (newPageSize: number) => {
        setPagination(prev => ({
            ...prev,
            pageSize: newPageSize,
            currentPage: 1
        }))
    }

    // 页码变化处理
    const handlePageChange = (newPage: number) => {
        setPagination(prev => ({
            ...prev,
            currentPage: newPage
        }))
    }

    // 搜索处理
    const handleSearch = (query: string) => {
        setSearchQuery(query)
        setPagination(prev => ({
            ...prev,
            currentPage: 1
        }))
    }

    // 状态过滤处理
    const handleStatusFilter = (status: typeof statusFilter) => {
        setStatusFilter(status)
        setPagination(prev => ({
            ...prev,
            currentPage: 1
        }))
    }

    // 初始化和依赖更新
    useEffect(() => {
        loadHighlights()
    }, [pagination.currentPage, pagination.pageSize, statusFilter, searchQuery])

    return (
        <div className={`highlight-list ${className}`}>
            {showHeader && (
                <div className="highlight-list-header">
                    <div className="header-title">
                        <h3>高亮列表</h3>
                        <span className="total-count">共 {pagination.total} 条</span>
                    </div>

                    <div className="header-controls">
                        <div className="search-box">
                            <input
                                type="text"
                                placeholder="搜索高亮内容..."
                                value={searchQuery}
                                onChange={(e) => handleSearch(e.target.value)}
                                className="search-input"
                            />
                        </div>

                        <div className="filter-box">
                            <select
                                value={statusFilter}
                                onChange={(e) => handleStatusFilter(e.target.value as typeof statusFilter)}
                                className="filter-select"
                            >
                                <option value="all">全部状态</option>
                                <option value="active">活跃</option>
                                <option value="archived">已归档</option>
                                <option value="deleted">已删除</option>
                            </select>
                        </div>
                    </div>
                </div>
            )}

            <div className="highlight-list-content">
                {loading && (
                    <div className="loading-state">
                        <div className="loading-spinner"></div>
                        <span>加载中...</span>
                    </div>
                )}

                {error && (
                    <div className="error-state">
                        <span className="error-icon">⚠️</span>
                        <span>{error}</span>
                        <button onClick={loadHighlights} className="retry-button">
                            重试
                        </button>
                    </div>
                )}

                {!loading && !error && highlights.length === 0 && (
                    <div className="empty-state">
                        <span className="empty-icon">📝</span>
                        <p>暂无高亮数据</p>
                        <p className="empty-description">
                            {searchQuery ? '没有找到匹配的高亮内容' : '开始选择文本并高亮吧！'}
                        </p>
                    </div>
                )}

                {!loading && !error && highlights.length > 0 && (
                    <div className="highlight-items">
                        {highlights.map((highlight) => (
                            <div
                                key={highlight.id}
                                className="highlight-item"
                                onClick={() => handleHighlightClick(highlight)}
                            >
                                <div className="highlight-header">
                                    <div className="highlight-color" style={{ backgroundColor: highlight.color }}></div>
                                    <div className="highlight-meta">
                                        <span className="highlight-domain">{highlight.domain}</span>
                                        <span className="highlight-time">{formatTime(highlight.timestamp)}</span>
                                    </div>
                                    <div className="highlight-status">
                                        <span className={`status-badge status-${highlight.status}`}>
                                            {highlight.status === 'active' ? '活跃' :
                                                highlight.status === 'archived' ? '归档' : '删除'}
                                        </span>
                                    </div>
                                </div>

                                <div className="highlight-content">
                                    <h4 className="highlight-title">{highlight.metadata.pageTitle}</h4>
                                    <p className="highlight-text">{truncateText(highlight.originalText)}</p>
                                    {highlight.context.before && (
                                        <p className="highlight-context">
                                            <span className="context-label">上下文：</span>
                                            <span className="context-text">
                                                ...{highlight.context.before}
                                                <mark style={{ backgroundColor: highlight.color }}>
                                                    {highlight.originalText.length > 50 ?
                                                        highlight.originalText.substring(0, 50) + '...' :
                                                        highlight.originalText}
                                                </mark>
                                                {highlight.context.after}...
                                            </span>
                                        </p>
                                    )}
                                </div>

                                <div className="highlight-actions">
                                    <button className="action-button primary">
                                        <span className="action-icon">🔗</span>
                                        <span>查看详情</span>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {showPagination && pagination.totalPages > 1 && (
                <div className="highlight-pagination">
                    <div className="pagination-info">
                        <span>每页显示</span>
                        <select
                            value={pagination.pageSize}
                            onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                            className="page-size-select"
                        >
                            {PAGE_SIZE_OPTIONS.map(size => (
                                <option key={size} value={size}>{size}</option>
                            ))}
                        </select>
                        <span>条，共 {pagination.total} 条</span>
                    </div>

                    <div className="pagination-controls">
                        <button
                            onClick={() => handlePageChange(pagination.currentPage - 1)}
                            disabled={pagination.currentPage === 1}
                            className="pagination-button"
                        >
                            上一页
                        </button>

                        <div className="pagination-numbers">
                            {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                                const page = i + 1
                                return (
                                    <button
                                        key={page}
                                        onClick={() => handlePageChange(page)}
                                        className={`pagination-number ${pagination.currentPage === page ? 'active' : ''}`}
                                    >
                                        {page}
                                    </button>
                                )
                            })}
                        </div>

                        <button
                            onClick={() => handlePageChange(pagination.currentPage + 1)}
                            disabled={pagination.currentPage === pagination.totalPages}
                            className="pagination-button"
                        >
                            下一页
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
} 