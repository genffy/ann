# Browser Extension Installation Guide

## Quick Start

### 1. Environment Requirements

- Node.js 16+
- npm or yarn or pnpm
- Chrome/Edge/Firefox browser

### 2. Installation Steps

#### Method 1: Development Mode Installation

```bash
# 1. Enter extension directory
cd apps/extension

# 2. Install dependencies
npm install

# 3. Build extension
npm run build

# 4. Load extension in browser
# Chrome/Edge:
# - Open chrome://extensions/
# - Enable "Developer mode"
# - Click "Load unpacked"
# - Select .output/chrome-mv3 directory

# Firefox:
# - Open about:debugging
# - Click "This Firefox"
# - Click "Load Temporary Add-on"
# - Select .output/firefox-mv2/manifest.json
```

#### Method 2: Development Mode (Hot Reload)

```bash
# Start development server
npm run dev

# This will automatically:
# 1. Build extension
# 2. Start file watching
# 3. Automatically open browser and install extension
# 4. Auto-reload on code changes
```

### 3. Verify Installation

1. After successful installation, the extension icon 🌐 will appear in the browser toolbar
2. Open any webpage (such as the provided test.html)
3. Select a piece of text, you should see the translation popup

## Feature Usage

### Basic Translation

1. **Select Text**: Select the text you want to translate on any webpage
2. **View Results**: The translation popup will automatically appear above the selected text
3. **Close Popup**: Click outside the popup area or the close button

### Configuration Settings

1. **Open Settings**: Click the extension icon in the browser toolbar
2. **Select Service**: Choose translation service from dropdown (Google/Baidu/Youdao)
3. **Set Language**: Select target translation language
4. **API Keys**: If using Baidu or Youdao translation, configure corresponding API keys
5. **Save Settings**: Click "Save Settings" button

### Supported Translation Services

#### Google Translate (Recommended)

- ✅ **Free Mode**: No configuration needed, use directly
- 🔑 **Official API**: Optional configuration [Google Cloud Translation API](https://cloud.google.com/translate/docs/setup)
- ✅ Supports 100+ languages
- ✅ High translation quality
- ⚠️ Free interface may be affected by network restrictions

#### Baidu Translate

- 🔑 Requires API key
- ✅ Good Chinese translation results
- 💰 Has free quota
- 📝 [Get API Key](https://fanyi-api.baidu.com/)

#### Youdao Translate

- 🔑 Requires API key
- ✅ Accurate technical term translation
- 💰 Has free quota
- 📝 [Get API Key](https://ai.youdao.com/)

## Test Page

Use the provided `test.html` to test extension functionality:

```bash
# Open test page with browser
open apps/extension/test.html
```

The test page includes:

- English test text
- Chinese test text
- Long text test
- Technical terms test
- Phrase test

## Troubleshooting

### Common Issues

#### 1. Extension Cannot Load

- Check if developer mode is enabled
- Confirm correct directory is selected (.output/chrome-mv3)
- Check browser console error messages

#### 2. Translation Not Working

- Check network connection
- Try selecting different text
- Open browser developer tools to check errors
- Try switching translation services

#### 3. Settings Cannot Save

- Check if browser allows extension to store data
- Try reinstalling the extension

#### 4. Google Translate Fails

- This is normal behavior, will automatically fallback to local translation dictionary
- You can try configuring Baidu or Youdao translation API

### Debugging Methods

#### View Extension Logs

```bash
# Chrome
# 1. Open chrome://extensions/
# 2. Find Text Selection Translation extension
# 3. Click "Details"
# 4. Click "Inspect views: background page"

# Firefox
# 1. Open about:debugging
# 2. Find extension
# 3. Click "Inspect"
```

#### View Page Console

```bash
# Press F12 on any webpage to open developer tools
# Check Console tab for log information
```

## Development Guide

### Project Structure

```
apps/extension/
├── entrypoints/
│   ├── background.ts      # Background script
│   ├── content.ts         # Content script
│   └── popup/             # Popup page
├── wxt.config.ts          # Configuration file
├── package.json           # Dependency management
├── test.html              # Test page
└── README.md              # Documentation
```

### Modifying Code

1. Edit corresponding files
2. If running `npm run dev`, changes will auto-reload
3. If manually building, need to re-run `npm run build`

### Adding New Translation Services

1. Add new translation provider in `background.ts`
2. Add options in `popup/index.html`
3. Update configuration handling logic

## Release Packaging

### Build Production Version

```bash
npm run build
```

### Package for Release

```bash
npm run zip
```

This will generate zip files in the `.output` directory for store publication.

## License

MIT License - Please see LICENSE file for details.

## Support

If you encounter issues or have suggestions, please:

1. Check the troubleshooting section of this documentation
2. Check GitHub Issues
3. Submit new Issues or Pull Requests
