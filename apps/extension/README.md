# 选词翻译浏览器扩展

基于 WXT 框架开发的选词翻译浏览器扩展，支持在任何网页上选中文本即可显示翻译结果。

## 功能特点

- 🌐 **全网页支持**: 在任何网页上选中文本即可翻译
- 🎯 **智能定位**: 翻译结果显示在选中文本上方
- 🔧 **多服务支持**: 支持 Google、百度、有道翻译服务
- ⚙️ **可配置**: 支持自定义翻译服务和目标语言
- 🎨 **美观界面**: 现代化的弹窗设计
- 🚀 **快速响应**: 实时翻译，无需等待

## 使用方法

### 基本使用

1. 在任何网页上选中需要翻译的文本
2. 翻译弹窗会自动出现在选中文本上方
3. 点击弹窗外的区域或关闭按钮可关闭翻译结果

### 配置设置

1. 点击浏览器工具栏中的扩展图标
2. 在弹出的设置面板中：
   - 选择翻译服务提供商
   - 设置目标语言
   - 配置 API 密钥（如需要）
3. 点击"保存设置"

## 支持的翻译服务

### Google 翻译

- **免费模式**: 无需 API 密钥，使用免费接口（推荐）
- **官方 API**: 使用 [Google Cloud Translation API](https://cloud.google.com/translate/docs/setup)，需要 API 密钥
- **支持语言**: 100+ 种语言
- **特点**: 翻译质量高，支持自动语言检测

### 百度翻译

- **特点**: 中文翻译效果好
- **配置**: 需要百度翻译 API 密钥
- **获取方式**: [百度翻译开放平台](https://fanyi-api.baidu.com/)

### 有道翻译

- **特点**: 支持多种专业领域翻译
- **配置**: 需要有道智云 API 密钥
- **获取方式**: [有道智云](https://ai.youdao.com/)

## 支持的语言

- 中文 (zh)
- 英文 (en)
- 日文 (ja)
- 韩文 (ko)
- 法文 (fr)
- 德文 (de)
- 西班牙文 (es)
- 俄文 (ru)

## 开发说明

### 技术栈

- **框架**: WXT (Web Extension Tools)
- **语言**: TypeScript
- **构建工具**: Vite
- **API**: WebExtensions API

### 项目结构

```
apps/extension/
├── entrypoints/
│   ├── background.ts      # 后台脚本，处理翻译逻辑
│   ├── content.ts         # 内容脚本，处理页面交互
│   └── popup/             # 弹窗页面，设置界面
│       ├── index.html
│       └── index.js
├── wxt.config.ts          # WXT 配置文件
└── package.json
```

### 开发命令

```bash
# 开发模式
npm run dev

# 构建扩展
npm run build

# 打包发布
npm run zip
```

### API 接口设计

扩展使用统一的翻译接口设计，方便添加新的翻译服务：

```typescript
interface TranslationProvider {
  name: string
  translate: (text: string, config: any) => Promise<string>
}
```

## 安装说明

### 开发者模式安装

1. 克隆项目并安装依赖
2. 运行 `npm run build`
3. 在浏览器中开启开发者模式
4. 加载 `.output` 目录

### 商店安装

> 待发布到 Chrome Web Store 和其他浏览器扩展商店

## 隐私说明

- 本扩展仅在用户主动选择文本时才发送翻译请求
- 翻译内容通过 HTTPS 加密传输
- 不会收集或存储用户的个人信息
- API 密钥仅存储在用户本地浏览器中

## 问题反馈

如果遇到问题或有功能建议，请提交 Issue 或 Pull Request。

## 许可证

MIT License

## 更新日志

### v1.0.0

- 初始版本发布
- 支持 Google 翻译
- 基础的选词翻译功能
- 设置面板
