import { useState, useEffect } from 'react'
import './App.css'

// 导入页面组件
import GeneralPage from './pages/GeneralPage'
import ApiKeysPage from './pages/ApiKeysPage'
import AdvancedPage from './pages/AdvancedPage'
import AboutPage from './pages/AboutPage'

// 导入类型和路由
import { TranslationConfig, MenuItem } from './types'
import { useRouter, Route } from './hooks/useRouter'

function App() {
    const [config, setConfig] = useState<TranslationConfig>({
        enableGoogleTranslate: true,
        enableBaiduTranslate: false,
        enableYoudaoTranslate: false,
        defaultTranslationService: 'google',
        targetLanguage: 'zh-CN',
        showTranslationOnHover: true,
        autoDetectLanguage: true,
        apiKeys: {
            google: { key: '' },
            baidu: { appId: '', key: '' },
            youdao: { appKey: '', appSecret: '' }
        }
    })

    const [isSaving, setIsSaving] = useState(false)
    const [saveMessage, setSaveMessage] = useState('')

    // 定义路由
    const routes: Route[] = [
        { path: '/general', component: GeneralPage },
        { path: '/api-keys', component: ApiKeysPage },
        { path: '/advanced', component: AdvancedPage },
        { path: '/about', component: AboutPage },
    ]

    // 使用路由
    const { currentPath, currentRoute, navigate, isActive } = useRouter(routes, '/general')

    // 菜单项配置
    const menuItems: MenuItem[] = [
        { id: 'general', label: '基本设置', icon: '⚙️', path: '/general' },
        { id: 'apiKeys', label: 'API 密钥', icon: '🔑', path: '/api-keys' },
        { id: 'advanced', label: '高级设置', icon: '🔧', path: '/advanced' },
        { id: 'about', label: '关于', icon: 'ℹ️', path: '/about' },
    ]

    // Load config from storage on component mount
    useEffect(() => {
        chrome.storage.sync.get(['translationConfig']).then((result) => {
            if (result.translationConfig) {
                setConfig(prev => ({
                    ...prev,
                    ...result.translationConfig,
                    apiKeys: {
                        ...prev.apiKeys,
                        ...result.translationConfig.apiKeys
                    }
                }))
            }
        })
    }, [])

    const handleConfigChange = (key: keyof TranslationConfig, value: any) => {
        setConfig(prev => ({
            ...prev,
            [key]: value
        }))
    }

    const handleApiKeyChange = (service: 'google' | 'baidu' | 'youdao', key: string, value: string) => {
        setConfig(prev => ({
            ...prev,
            apiKeys: {
                ...prev.apiKeys,
                [service]: {
                    ...prev.apiKeys[service],
                    [key]: value
                }
            }
        }))
    }

    const handleSave = async () => {
        setIsSaving(true)
        try {
            await chrome.storage.sync.set({ translationConfig: config })
            setSaveMessage('配置已保存成功！')
            setTimeout(() => setSaveMessage(''), 3000)
        } catch (error) {
            setSaveMessage('保存失败，请重试')
            setTimeout(() => setSaveMessage(''), 3000)
        } finally {
            setIsSaving(false)
        }
    }

    // 渲染当前页面组件
    const renderCurrentPage = () => {
        if (!currentRoute) return null

        const Component = currentRoute.component

        switch (currentPath) {
            case '/general':
                return <Component config={config} onConfigChange={handleConfigChange} />
            case '/api-keys':
                return <Component config={config} onApiKeyChange={handleApiKeyChange} />
            case '/advanced':
                return <Component config={config} onConfigChange={handleConfigChange} />
            case '/about':
                return <Component />
            default:
                return null
        }
    }

    return (
        <div className="options-layout">
            {/* 侧边栏 */}
            <aside className="sidebar">
                <div className="sidebar-header">
                    <h1>🌐 翻译设置</h1>
                </div>
                <nav className="sidebar-nav">
                    {menuItems.map((item) => (
                        <button
                            key={item.id}
                            className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
                            onClick={() => navigate(item.path)}
                        >
                            <span className="nav-icon">{item.icon}</span>
                            <span className="nav-label">{item.label}</span>
                        </button>
                    ))}
                </nav>
            </aside>

            {/* 主内容区 */}
            <main className="main-content">
                <div className="content-wrapper">
                    {renderCurrentPage()}

                    {/* 保存按钮区域 */}
                    {currentPath !== '/about' && (
                        <div className="save-section">
                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="save-button"
                            >
                                {isSaving ? '保存中...' : '保存设置'}
                            </button>
                            {saveMessage && (
                                <div className={`save-message ${saveMessage.includes('成功') ? 'success' : 'error'}`}>
                                    {saveMessage}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </main>
        </div>
    )
}

export default App 