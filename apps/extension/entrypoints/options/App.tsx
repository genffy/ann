import { useState, useEffect } from 'react'
import './App.css'

// 导入页面组件
import TranslationPage from './pages/TranslationPage'
import AboutPage from './pages/AboutPage'
import HighlightPage from './pages/HighlightPage'

// 导入类型和路由
import { MenuItem } from './types'
import { TranslationConfig } from '../../types/translate'
import { useRouter, Route } from './hooks/useRouter'
import MessageUtils from '../../utils/message'


function App() {
    const [config, setConfig] = useState<TranslationConfig>({
        enableGoogleTranslate: true,
        enableBaiduTranslate: false,
        enableYoudaoTranslate: false,
        defaultTranslationService: 'google',
        targetLanguage: 'zh-CN',
        showTranslationOnHover: true,
        autoDetectLanguage: true,
        domainWhitelist: {
            enabled: true,
            domains: ['x.com', 'twitter.com']
        },
        apiKeys: {
            google: { key: '' },
            baidu: { appId: '', key: '' },
            youdao: { appKey: '', appSecret: '' }
        },
        translationRules: {
            enabled: true,
            skipChinese: false,
            skipNumbers: true,
            skipCryptoAddresses: true,
            customRules: []
        }
    })

    const [isSaving, setIsSaving] = useState(false)
    const [saveMessage, setSaveMessage] = useState('')

    // 定义路由
    const routes: Route[] = [
        { path: '/translation', component: TranslationPage },
        { path: '/highlights', component: HighlightPage },
        { path: '/about', component: AboutPage },
    ]

    // 使用路由
    const { currentPath, currentRoute, navigate, isActive } = useRouter(routes, '/translation')

    // 菜单项配置
    const menuItems: MenuItem[] = [
        { id: 'translation', label: '翻译设置', icon: '🌐', path: '/translation' },
        { id: 'highlights', label: '高亮管理', icon: '📝', path: '/highlights' },
        { id: 'about', label: '关于', icon: 'ℹ️', path: '/about' },
    ]

    // Load config from background script on component mount
    useEffect(() => {
        const loadConfig = async () => {
            try {
                const response = await MessageUtils.sendMessage({
                    type: 'GET_CONFIG',
                    configType: 'translation'
                })

                if (response.success && response.data) {
                    setConfig(prev => ({
                        ...prev,
                        ...response.data,
                        apiKeys: {
                            ...prev.apiKeys,
                            ...response.data.apiKeys
                        }
                    }))
                }
            } catch (error) {
                console.error('Failed to load config:', error)
            }
        }

        loadConfig()
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
            const response = await MessageUtils.sendMessage({
                type: 'SET_CONFIG',
                configType: 'translation',
                config: config
            })

            if (response.success) {
                setSaveMessage('配置已保存成功！')
            } else {
                setSaveMessage(`保存失败：${response.error || '未知错误'}`)
            }
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
            case '/translation':
                return <Component
                    config={config}
                    onConfigChange={handleConfigChange}
                    onApiKeyChange={handleApiKeyChange}
                />
            case '/highlights':
                return <Component />
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
                    {currentPath !== '/about' && currentPath !== '/highlights' && (
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