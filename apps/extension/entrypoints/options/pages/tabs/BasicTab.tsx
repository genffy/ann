import { TranslationConfig } from '../../types'

interface BasicTabProps {
    config: TranslationConfig
    onConfigChange: (key: keyof TranslationConfig, value: any) => void
}

export default function BasicTab({ config, onConfigChange }: BasicTabProps) {
    const languageOptions = [
        { value: 'zh-CN', label: '简体中文' },
        { value: 'zh-TW', label: '繁体中文' },
        { value: 'en', label: 'English' },
        { value: 'ja', label: '日本語' },
        { value: 'ko', label: '한국어' },
        { value: 'fr', label: 'Français' },
        { value: 'de', label: 'Deutsch' },
        { value: 'es', label: 'Español' },
        { value: 'ru', label: 'Русский' },
    ]

    return (
        <div className="tab-content">
            <div className="settings-group">
                <h3>翻译服务</h3>
                <div className="checkbox-group">
                    <label className="checkbox-label">
                        <input
                            type="checkbox"
                            checked={config.enableGoogleTranslate}
                            onChange={(e) => onConfigChange('enableGoogleTranslate', e.target.checked)}
                        />
                        <span>启用 Google 翻译</span>
                    </label>
                    <label className="checkbox-label">
                        <input
                            type="checkbox"
                            checked={config.enableBaiduTranslate}
                            onChange={(e) => onConfigChange('enableBaiduTranslate', e.target.checked)}
                        />
                        <span>启用百度翻译</span>
                    </label>
                    <label className="checkbox-label">
                        <input
                            type="checkbox"
                            checked={config.enableYoudaoTranslate}
                            onChange={(e) => onConfigChange('enableYoudaoTranslate', e.target.checked)}
                        />
                        <span>启用有道翻译</span>
                    </label>
                </div>
            </div>

            <div className="settings-group">
                <h3>默认翻译服务</h3>
                <select
                    value={config.defaultTranslationService}
                    onChange={(e) => onConfigChange('defaultTranslationService', e.target.value)}
                    className="select-input"
                >
                    <option value="google">Google 翻译</option>
                    <option value="baidu">百度翻译</option>
                    <option value="youdao">有道翻译</option>
                </select>
            </div>

            <div className="settings-group">
                <h3>目标语言</h3>
                <select
                    value={config.targetLanguage}
                    onChange={(e) => onConfigChange('targetLanguage', e.target.value)}
                    className="select-input"
                >
                    {languageOptions.map(lang => (
                        <option key={lang.value} value={lang.value}>
                            {lang.label}
                        </option>
                    ))}
                </select>
            </div>
        </div>
    )
} 