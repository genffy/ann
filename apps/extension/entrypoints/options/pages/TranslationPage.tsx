import { useState } from 'react'
import { TranslationConfig } from '../types'
import BasicTab from './tabs/BasicTab'
import ApiKeysTab from './tabs/ApiKeysTab'
import AdvancedTab from './tabs/AdvancedTab'
import DomainWhitelistTab from './tabs/DomainWhitelistTab'

interface TranslationPageProps {
    config: TranslationConfig
    onConfigChange: (key: keyof TranslationConfig, value: any) => void
    onApiKeyChange: (service: 'google' | 'baidu' | 'youdao', key: string, value: string) => void
}

type TabType = 'basic' | 'apiKeys' | 'advanced' | 'domainWhitelist'

export default function TranslationPage({ config, onConfigChange, onApiKeyChange }: TranslationPageProps) {
    const [activeTab, setActiveTab] = useState<TabType>('basic')

    const tabs = [
        { id: 'basic', label: '基础设置', icon: '⚙️' },
        { id: 'apiKeys', label: 'API 密钥', icon: '🔑' },
        { id: 'advanced', label: '高级设置', icon: '🔧' },
        { id: 'domainWhitelist', label: '域名白名单', icon: '🌍' },
    ]

    const renderTabContent = () => {
        switch (activeTab) {
            case 'basic':
                return <BasicTab config={config} onConfigChange={onConfigChange} />
            case 'apiKeys':
                return <ApiKeysTab config={config} onApiKeyChange={onApiKeyChange} />
            case 'advanced':
                return <AdvancedTab config={config} onConfigChange={onConfigChange} />
            case 'domainWhitelist':
                return <DomainWhitelistTab config={config} onConfigChange={onConfigChange} />
            default:
                return null
        }
    }

    return (
        <div className="content-section">
            <h2>翻译设置</h2>
            <p className="section-description">配置翻译服务、API密钥和高级选项</p>

            <div className="tab-container">
                <div className="tab-nav">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
                            onClick={() => setActiveTab(tab.id as TabType)}
                        >
                            <span className="tab-icon">{tab.icon}</span>
                            <span className="tab-label">{tab.label}</span>
                        </button>
                    ))}
                </div>

                <div className="tab-content-wrapper">
                    {renderTabContent()}
                </div>
            </div>
        </div>
    )
} 