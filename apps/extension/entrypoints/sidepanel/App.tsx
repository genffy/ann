import { useState } from 'react'
import HighlightList from '../../components/ui/highlight-list'

type ViewMode = 'highlights' | 'translation' | 'notes'

function App() {
    const [currentView, setCurrentView] = useState<ViewMode>('highlights')

    const viewOptions = [
        { value: 'highlights', label: '高亮列表', icon: '📝' },
        { value: 'translation', label: '翻译功能', icon: '🌐' },
        { value: 'notes', label: '笔记管理', icon: '📔' }
    ]

    const renderContent = () => {
        switch (currentView) {
            case 'highlights':
                return (
                    <HighlightList
                        className="sidebar-highlight-list"
                        showHeader={false}
                        showPagination={true}
                        initialPageSize={10}
                    />
                )
            case 'translation':
                return (
                    <div className="sidebar-section">
                        <h3>翻译功能</h3>
                        <p>翻译功能正在开发中...</p>
                    </div>
                )
            case 'notes':
                return (
                    <div className="sidebar-section">
                        <h3>笔记管理</h3>
                        <p>笔记管理功能正在开发中...</p>
                    </div>
                )
            default:
                return null
        }
    }

    return (
        <div className="sidebar-container">
            <div className="sidebar-header">
                <h1>🌐 ANN Toolkit</h1>

                <div className="view-selector">
                    <select
                        value={currentView}
                        onChange={(e) => setCurrentView(e.target.value as ViewMode)}
                        className="view-select"
                    >
                        {viewOptions.map(option => (
                            <option key={option.value} value={option.value}>
                                {option.icon} {option.label}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="sidebar-content">
                {renderContent()}
            </div>
        </div>
    )
}

export default App 