import { TranslationConfig } from '../types'

interface AdvancedPageProps {
    config: TranslationConfig
    onConfigChange: (key: keyof TranslationConfig, value: any) => void
}

export default function AdvancedPage({ config, onConfigChange }: AdvancedPageProps) {
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
        </div>
    )
} 