// 默认翻译配置
export const defaultTranslationConfig = {
    enableGoogleTranslate: true,
    enableBaiduTranslate: false,
    enableYoudaoTranslate: false,
    defaultTranslationService: 'google',
    targetLanguage: 'zh-CN',
    showTranslationOnHover: true,
    autoDetectLanguage: true,
    // 域名白名单配置，默认仅在 x.com 下开启
    domainWhitelist: {
        enabled: true,
        domains: ['x.com', 'twitter.com']
    },
    apiKeys: {
        google: {
            key: '',
        },
        baidu: {
            appId: '',
            key: '',
        },
        youdao: {
            appKey: '',
            appSecret: '',
        },
    },
    translationRules: {
        enabled: true,
        skipChinese: false,
        skipNumbers: true,
        skipCryptoAddresses: true,
        customRules: [],
    },
}

// 默认翻译规则
export const defaultTranslationRules = {
    enabled: true,
    skipChinese: false,
    skipNumbers: true,
    skipCryptoAddresses: true,
    customRules: [],
}
