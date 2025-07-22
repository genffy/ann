import HighlightList from '../../../components/ui/highlight-list'

export default function HighlightPage() {
    return (
        <div className="content-section">
            <h2>高亮管理</h2>
            <p className="section-description">管理您的所有高亮内容，支持搜索、过滤和快速定位</p>

            <div className="highlight-page-container">
                <HighlightList
                    className="highlight-page-list"
                    alwaysNewTab={true}
                    showHeader={true}
                    showPagination={true}
                    initialPageSize={20}
                />
            </div>
        </div>
    )
} 