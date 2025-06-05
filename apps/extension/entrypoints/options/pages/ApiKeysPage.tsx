import { TranslationConfig } from '../types'

interface ApiKeysPageProps {
    config: TranslationConfig
    onApiKeyChange: (service: 'google' | 'baidu' | 'youdao', key: string, value: string) => void
}

export default function ApiKeysPage({ config, onApiKeyChange }: ApiKeysPageProps) {
    return (
        <div className="content-section">
            <h2>API 密钥设置</h2>
            <p className="section-description">配置各翻译服务的 API 密钥以提升翻译质量和配额</p>

            <div className="settings-group">
                <h3>Google Cloud Translation API</h3>
                <div className="input-group">
                    <label htmlFor="googleApiKey">API Key</label>
                    <input
                        id="googleApiKey"
                        type="password"
                        value={config.apiKeys.google.key}
                        onChange={(e) => onApiKeyChange('google', 'key', e.target.value)}
                        placeholder="输入 Google Cloud Translation API Key"
                        className="text-input"
                    />
                    <div className="input-help">
                        <a href="https://cloud.google.com/translate/docs/setup" target="_blank" rel="noopener noreferrer">
                            获取 Google API Key
                        </a>
                    </div>
                </div>
            </div>

            <div className="settings-group">
                <h3>百度翻译 API</h3>
                <div className="input-group">
                    <label htmlFor="baiduAppId">APP ID</label>
                    <input
                        id="baiduAppId"
                        type="text"
                        value={config.apiKeys.baidu.appId}
                        onChange={(e) => onApiKeyChange('baidu', 'appId', e.target.value)}
                        placeholder="输入百度翻译 APP ID"
                        className="text-input"
                    />
                </div>
                <div className="input-group">
                    <label htmlFor="baiduKey">密钥</label>
                    <input
                        id="baiduKey"
                        type="password"
                        value={config.apiKeys.baidu.key}
                        onChange={(e) => onApiKeyChange('baidu', 'key', e.target.value)}
                        placeholder="输入百度翻译密钥"
                        className="text-input"
                    />
                    <div className="input-help">
                        <a href="https://fanyi-api.baidu.com/" target="_blank" rel="noopener noreferrer">
                            获取百度翻译 API
                        </a>
                    </div>
                </div>
            </div>

            <div className="settings-group">
                <h3>有道智云 API</h3>
                <div className="input-group">
                    <label htmlFor="youdaoAppKey">应用 ID</label>
                    <input
                        id="youdaoAppKey"
                        type="text"
                        value={config.apiKeys.youdao.appKey}
                        onChange={(e) => onApiKeyChange('youdao', 'appKey', e.target.value)}
                        placeholder="输入有道智云应用 ID"
                        className="text-input"
                    />
                </div>
                <div className="input-group">
                    <label htmlFor="youdaoAppSecret">应用密钥</label>
                    <input
                        id="youdaoAppSecret"
                        type="password"
                        value={config.apiKeys.youdao.appSecret}
                        onChange={(e) => onApiKeyChange('youdao', 'appSecret', e.target.value)}
                        placeholder="输入有道智云应用密钥"
                        className="text-input"
                    />
                    <div className="input-help">
                        <a href="https://ai.youdao.com/" target="_blank" rel="noopener noreferrer">
                            获取有道智云 API
                        </a>
                    </div>
                </div>
            </div>
        </div>
    )
} 