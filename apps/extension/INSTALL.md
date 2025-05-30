# 选词翻译扩展 - 安装指南

## 快速开始

### 1. 环境要求

- Node.js 16+ 
- npm 或 yarn 或 pnpm
- Chrome/Edge/Firefox 浏览器

### 2. 安装步骤

#### 方法一：开发模式安装

```bash
# 1. 进入扩展目录
cd apps/extension

# 2. 安装依赖
npm install

# 3. 构建扩展
npm run build

# 4. 在浏览器中加载扩展
# Chrome/Edge: 
# - 打开 chrome://extensions/
# - 开启"开发者模式"
# - 点击"加载已解压的扩展程序"
# - 选择 .output/chrome-mv3 目录

# Firefox:
# - 打开 about:debugging
# - 点击"此 Firefox"
# - 点击"临时载入附加组件"
# - 选择 .output/firefox-mv2/manifest.json
```

#### 方法二：开发模式（热重载）

```bash
# 启动开发服务器
npm run dev

# 这会自动：
# 1. 构建扩展
# 2. 启动文件监听
# 3. 自动打开浏览器并安装扩展
# 4. 代码更改时自动重载
```

### 3. 验证安装

1. 安装成功后，浏览器工具栏会出现扩展图标 🌐
2. 打开任意网页（比如提供的 test.html）
3. 选中一段文本，应该会看到翻译弹窗

## 功能使用

### 基本翻译

1. **选择文本**: 在任何网页上选中需要翻译的文本
2. **查看结果**: 翻译弹窗会自动出现在选中文本上方
3. **关闭弹窗**: 点击弹窗外的区域或关闭按钮

### 配置设置

1. **打开设置**: 点击浏览器工具栏中的扩展图标
2. **选择服务**: 从下拉菜单选择翻译服务（Google/百度/有道）
3. **设置语言**: 选择目标翻译语言
4. **API密钥**: 如使用百度或有道翻译，需要配置相应的API密钥
5. **保存设置**: 点击"保存设置"按钮

### 支持的翻译服务

#### Google 翻译（推荐）
- ✅ **免费模式**: 无需配置，直接使用
- 🔑 **官方 API**: 可选配置 [Google Cloud Translation API](https://cloud.google.com/translate/docs/setup)
- ✅ 支持100+种语言
- ✅ 翻译质量高
- ⚠️ 免费接口可能受网络限制影响

#### 百度翻译
- 🔑 需要API密钥
- ✅ 中文翻译效果好
- 💰 有免费额度
- 📝 [获取API密钥](https://fanyi-api.baidu.com/)

#### 有道翻译
- 🔑 需要API密钥
- ✅ 专业术语翻译准确
- 💰 有免费额度
- 📝 [获取API密钥](https://ai.youdao.com/)

## 测试页面

使用提供的 `test.html` 来测试扩展功能：

```bash
# 用浏览器打开测试页面
open apps/extension/test.html
```

测试页面包含：
- 英文测试文本
- 中文测试文本  
- 长文本测试
- 专业术语测试
- 短语测试

## 故障排除

### 常见问题

#### 1. 扩展无法加载
- 检查是否开启了开发者模式
- 确认选择了正确的目录（.output/chrome-mv3）
- 查看浏览器控制台错误信息

#### 2. 翻译不工作
- 检查网络连接
- 尝试选择不同的文本
- 打开浏览器开发者工具查看错误
- 尝试切换翻译服务

#### 3. 设置无法保存
- 检查浏览器是否允许扩展存储数据
- 尝试重新安装扩展

#### 4. Google翻译失败
- 这是正常现象，会自动降级到本地翻译词典
- 可以尝试配置百度或有道翻译API

### 调试方法

#### 查看扩展日志
```bash
# Chrome
# 1. 打开 chrome://extensions/
# 2. 找到选词翻译扩展
# 3. 点击"详细信息"
# 4. 点击"检查视图：背景页"

# Firefox  
# 1. 打开 about:debugging
# 2. 找到扩展
# 3. 点击"检查"
```

#### 查看页面控制台
```bash
# 在任意网页按 F12 打开开发者工具
# 查看 Console 标签页的日志信息
```

## 开发指南

### 项目结构
```
apps/extension/
├── entrypoints/
│   ├── background.ts      # 后台脚本
│   ├── content.ts         # 内容脚本  
│   └── popup/             # 弹窗页面
├── wxt.config.ts          # 配置文件
├── package.json           # 依赖管理
├── test.html              # 测试页面
└── README.md              # 说明文档
```

### 修改代码
1. 编辑相应的文件
2. 如果运行了 `npm run dev`，更改会自动重载
3. 如果是手动构建，需要重新运行 `npm run build`

### 添加新的翻译服务
1. 在 `background.ts` 中添加新的翻译提供商
2. 在 `popup/index.html` 中添加选项
3. 更新配置处理逻辑

## 发布打包

### 构建生产版本
```bash
npm run build
```

### 打包发布
```bash
npm run zip
```

这会在 `.output` 目录生成可用于商店发布的zip文件。

## 许可证

MIT License - 请查看 LICENSE 文件了解详情。

## 支持

如果遇到问题或有建议，请：
1. 查看本文档的故障排除部分
2. 检查 GitHub Issues
3. 提交新的 Issue 或 Pull Request 