export const ANN_SELECTION_KEY = 'capture-selection'
// 应用配置常量
export const APP_CONFIG = {
    name: 'ANN - Advanced Text Toolkit',
    version: '2.0.0',
    description: 'Multi-functional text selection toolkit',

    // 功能开关
    features: {
        translation: true,
        notes: true,
        sharing: true,
        screenshot: true
    },

    // UI 配置
    ui: {
        toolbar: {
            maxWidth: 300,
            buttonSize: 32,
            borderRadius: 8,
            animationDuration: 200
        },
        popup: {
            maxWidth: 400,
            maxHeight: 300,
            offset: 10
        }
    }
} as const

// 翻译服务配置
export const TRANSLATION_CONFIG = {
    providers: {
        google: {
            name: 'Google Translate',
            free: true,
            apiRequired: false
        },
        baidu: {
            name: 'Baidu Translate',
            free: false,
            apiRequired: true
        },
        youdao: {
            name: 'Youdao Translate',
            free: false,
            apiRequired: true
        }
    },
    defaultProvider: 'google',
    maxTextLength: 500,
    minTextLength: 1
} as const

// 备注功能配置
export const NOTES_CONFIG = {
    maxSummaryLength: 200,
    maxCommentLength: 1000,
    storageKey: 'ann-notes-data',

    // 摘要生成配置
    summary: {
        enabled: true,
        maxLength: 100,
        minLength: 20
    },

    // 数据库配置
    database: {
        name: 'ann-notes-db',
        version: 1,
        stores: {
            notes: 'notes',
            settings: 'settings'
        }
    },

    // 回显配置
    highlighting: {
        enabled: true,
        className: 'ann-note-highlight',
        maxMatchDistance: 50, // 文本匹配的最大距离
        checkInterval: 1000   // 检查间隔（毫秒）
    }
} as const

// 分享功能配置
export const SHARING_CONFIG = {
    screenshot: {
        format: 'png' as const,
        quality: 0.9,
        expandPadding: 20,
        maxWidth: 1920,
        maxHeight: 1080
    },

    // 编辑工具配置
    editor: {
        tools: ['brush', 'text', 'blur', 'arrow'] as const,
        brushSizes: [2, 4, 6, 8, 10],
        colors: ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#000000', '#ffffff']
    },

    // 分享渠道配置
    channels: {
        download: { enabled: true, format: 'png' },
        twitter: { enabled: true, maxFileSize: 5 * 1024 * 1024 }, // 5MB
        clipboard: { enabled: true }
    }
} as const

// 快捷键配置
export const SHORTCUTS_CONFIG = {
    capture: {
        default: 'Ctrl+Shift+S',
        mac: 'Command+Shift+S'
    },

    // 内容页面快捷键
    content: {
        hideToolbar: 'Escape',
        nextFeature: 'Tab',
        prevFeature: 'Shift+Tab'
    }
} as const

// 存储配置
export const STORAGE_CONFIG = {
    keys: {
        settings: 'ann-settings',
        notes: 'ann-notes',
        cache: 'ann-cache',
        whitelist: 'ann-whitelist'
    },

    // 数据过期时间（毫秒）
    expiry: {
        cache: 24 * 60 * 60 * 1000, // 24小时
        notes: 30 * 24 * 60 * 60 * 1000, // 30天
        settings: Infinity // 永不过期
    }
} as const

// 事件类型常量
export const EVENT_TYPES = {
    // 内容脚本事件
    CONTENT_READY: 'content:ready',
    TEXT_SELECTED: 'content:text-selected',
    TOOLBAR_SHOW: 'content:toolbar-show',
    TOOLBAR_HIDE: 'content:toolbar-hide',

    // 功能事件
    TRANSLATE_START: 'feature:translate-start',
    TRANSLATE_COMPLETE: 'feature:translate-complete',
    NOTES_SAVE: 'feature:notes-save',
    SHARING_CAPTURE: 'feature:sharing-capture',

    // 设置事件
    SETTINGS_CHANGED: 'settings:changed',
    WHITELIST_UPDATED: 'settings:whitelist-updated'
} as const

// 错误类型常量
export const ERROR_TYPES = {
    NETWORK_ERROR: 'network_error',
    API_ERROR: 'api_error',
    PERMISSION_ERROR: 'permission_error',
    VALIDATION_ERROR: 'validation_error',
    UNKNOWN_ERROR: 'unknown_error'
} as const

// CSS 类名常量
export const CSS_CLASSES = {
    // 工具栏相关
    toolbar: 'ann-toolbar',
    toolbarButton: 'ann-toolbar-button',
    toolbarActive: 'ann-toolbar-active',

    // 弹窗相关
    popup: 'ann-popup',
    popupOverlay: 'ann-popup-overlay',
    popupContent: 'ann-popup-content',

    // 功能特定
    translation: 'ann-translation',
    notes: 'ann-notes',
    sharing: 'ann-sharing',

    // 状态类
    loading: 'ann-loading',
    error: 'ann-error',
    success: 'ann-success'
} as const

// Z-index 常量
export const Z_INDEXES = {
    toolbar: 999999,
    popup: 1000000,
    overlay: 1000001,
    editor: 1000002
} as const

// 备注数据类型定义
export const NOTE_TYPES = {
    MANUAL: 'manual',
    AUTO: 'auto'
} as const

// 备注状态类型
export const NOTE_STATUS = {
    ACTIVE: 'active',
    ARCHIVED: 'archived',
    DELETED: 'deleted'
} as const

// 备注匹配算法类型
export const MATCH_ALGORITHMS = {
    EXACT: 'exact',
    FUZZY: 'fuzzy',
    CONTEXT: 'context'
} as const 