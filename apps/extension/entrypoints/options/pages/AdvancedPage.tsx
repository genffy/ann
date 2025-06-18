import { TranslationConfig } from '../types'
import { useState } from 'react'

interface AdvancedPageProps {
    config: TranslationConfig
    onConfigChange: (key: keyof TranslationConfig, value: any) => void
}

export default function AdvancedPage({ config, onConfigChange }: AdvancedPageProps) {
    const [newDomain, setNewDomain] = useState('')

    const handleDomainWhitelistChange = (enabled: boolean) => {
        onConfigChange('domainWhitelist', {
            ...config.domainWhitelist,
            enabled
        })
    }

    const handleAddDomain = () => {
        if (newDomain.trim() && !config.domainWhitelist.domains.includes(newDomain.trim())) {
            onConfigChange('domainWhitelist', {
                ...config.domainWhitelist,
                domains: [...config.domainWhitelist.domains, newDomain.trim()]
            })
            setNewDomain('')
        }
    }

    const handleRemoveDomain = (domain: string) => {
        onConfigChange('domainWhitelist', {
            ...config.domainWhitelist,
            domains: config.domainWhitelist.domains.filter(d => d !== domain)
        })
    }

    return (
        <div className="content-section">
            <h2>高级设置</h2>
            <p className="section-description">配置翻译行为和高级选项</p>

            <div className="settings-group">
                <h3>翻译行为</h3>
                <div className="checkbox-group">
                    <label className="checkbox-label">
                        <input
                            type="checkbox"
                            checked={config.showTranslationOnHover}
                            onChange={(e) => onConfigChange('showTranslationOnHover', e.target.checked)}
                        />
                        <span>鼠标悬停时显示翻译</span>
                    </label>
                    <label className="checkbox-label">
                        <input
                            type="checkbox"
                            checked={config.autoDetectLanguage}
                            onChange={(e) => onConfigChange('autoDetectLanguage', e.target.checked)}
                        />
                        <span>自动检测源语言</span>
                    </label>
                </div>
            </div>

            <div className="settings-group">
                <h3>翻译触发方式</h3>
                <div className="checkbox-group">
                    <label className="checkbox-label">
                        <input
                            type="checkbox"
                            defaultChecked={true}
                        />
                        <span>选中文本时显示翻译按钮</span>
                    </label>
                    <label className="checkbox-label">
                        <input
                            type="checkbox"
                            defaultChecked={false}
                        />
                        <span>双击单词立即翻译</span>
                    </label>
                    <label className="checkbox-label">
                        <input
                            type="checkbox"
                            defaultChecked={false}
                        />
                        <span>使用快捷键翻译（Ctrl+T）</span>
                    </label>
                </div>
            </div>

            <div className="settings-group">
                <h3>翻译结果显示</h3>
                <div className="checkbox-group">
                    <label className="checkbox-label">
                        <input
                            type="checkbox"
                            defaultChecked={true}
                        />
                        <span>显示音标信息</span>
                    </label>
                    <label className="checkbox-label">
                        <input
                            type="checkbox"
                            defaultChecked={true}
                        />
                        <span>显示词性说明</span>
                    </label>
                    <label className="checkbox-label">
                        <input
                            type="checkbox"
                            defaultChecked={false}
                        />
                        <span>显示例句</span>
                    </label>
                </div>
            </div>

            <div className="settings-group">
                <h3>域名白名单</h3>
                <p className="section-description">仅在指定域名下启用翻译功能，支持正则表达式（必须包含主域名）</p>

                <div className="checkbox-group">
                    <label className="checkbox-label">
                        <input
                            type="checkbox"
                            checked={config.domainWhitelist.enabled}
                            onChange={(e) => handleDomainWhitelistChange(e.target.checked)}
                        />
                        <span>启用域名白名单</span>
                    </label>
                </div>

                {config.domainWhitelist.enabled && (
                    <div className="domain-whitelist-section">
                        <div className="add-domain-form">
                            <input
                                type="text"
                                value={newDomain}
                                onChange={(e) => setNewDomain(e.target.value)}
                                placeholder="输入域名或正则表达式，如: x.com 或 .*\.x\.com"
                                className="text-input"
                                onKeyPress={(e) => {
                                    if (e.key === 'Enter') {
                                        handleAddDomain()
                                    }
                                }}
                            />
                            <button
                                type="button"
                                onClick={handleAddDomain}
                                className="add-button"
                                disabled={!newDomain.trim()}
                            >
                                添加
                            </button>
                        </div>

                        <div className="domain-list">
                            {config.domainWhitelist.domains.map((domain, index) => (
                                <div key={index} className="domain-item">
                                    <span className="domain-name">{domain}</span>
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveDomain(domain)}
                                        className="remove-button"
                                        title="删除域名"
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}
                        </div>

                        {config.domainWhitelist.domains.length === 0 && (
                            <div className="empty-state">
                                暂无配置域名，添加域名后翻译功能将仅在指定域名下生效
                            </div>
                        )}

                        <div className="help-text">
                            <p><strong>使用说明：</strong></p>
                            <ul>
                                <li>支持精确匹配：如 <code>x.com</code></li>
                                <li>支持子域名：<code>x.com</code> 会匹配 <code>m.x.com</code></li>
                                <li>支持正则表达式：如 <code>.*\.x\.com</code></li>
                                <li>正则表达式必须包含主域名以确保安全性</li>
                            </ul>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
} 