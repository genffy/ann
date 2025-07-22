export default function AboutPage() {
    return (
        <div className="content-section">
            <h2>关于</h2>
            <div className="about-info">
                <h3>文本翻译插件</h3>
                <p>版本: 1.0.0</p>
                <p>一个支持多种翻译服务的浏览器扩展，让您轻松翻译网页上的任何文本。</p>

                <h4>支持的翻译服务</h4>
                <ul>
                    <li>Google 翻译</li>
                    <li>百度翻译</li>
                    <li>有道翻译</li>
                </ul>

                <h4>主要功能</h4>
                <ul>
                    <li>选中文本即时翻译</li>
                    <li>多翻译引擎支持</li>
                    <li>自定义目标语言</li>
                    <li>API 密钥配置</li>
                    <li>单页面应用路由</li>
                    <li>现代化界面设计</li>
                </ul>

                <h4>技术栈</h4>
                <ul>
                    <li>React + TypeScript</li>
                    <li>Chrome Extension Manifest V3</li>
                    <li>WXT 构建工具</li>
                    <li>单页面应用架构</li>
                </ul>

                <h4>开发信息</h4>
                <p>开发者: Your Name</p>
                <p>许可证: MIT</p>
                <p>
                    <a href="https://github.com/your-repo" target="_blank" rel="noopener noreferrer">
                        GitHub 仓库
                    </a>
                </p>
            </div>
        </div>
    )
} 