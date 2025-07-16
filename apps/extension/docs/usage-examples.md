# Manifest V3 Service Worker 实际使用示例

本文档提供了在实际项目中应用 Service Worker 可用性改进的具体示例。

## 📝 基础消息发送示例

### Content Script 中发送消息

```typescript
// apps/extension/entrypoints/content/highlight/service.ts

import MessageUtils from '../../../utils/helpers/message-utils'
import { HighlightRecord } from '../../../types/highlight'

export class HighlightService {
  /**
   * 保存高亮到后台
   */
  async saveHighlight(highlightData: HighlightRecord): Promise<{ success: boolean; data?: HighlightRecord; error?: string }> {
    try {
      console.log('[HighlightService] Saving highlight...')
      
      // ✅ 推荐：使用增强的消息发送
      const response = await MessageUtils.sendMessageWithServiceWorkerSupport({
        type: 'SAVE_HIGHLIGHT',
        data: highlightData
      }, {
        maxRetries: 3,
        retryDelay: 1000,
        timeout: 8000,  // 8秒超时
        waitForServiceWorker: true
      })

      if (!response.success) {
        console.error('[HighlightService] Save failed:', response.error)
        return { success: false, error: response.error }
      }

      console.log('[HighlightService] Highlight saved successfully')
      return { success: true, data: response.data }

    } catch (error) {
      console.error('[HighlightService] Save error:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  /**
   * 获取当前页面的高亮
   */
  async getCurrentPageHighlights(): Promise<HighlightRecord[]> {
    try {
      const response = await MessageUtils.sendMessageWithServiceWorkerSupport({
        type: 'GET_CURRENT_PAGE_HIGHLIGHTS',
        url: window.location.href,
      }, {
        timeout: 5000,  // 查询操作用较短超时
        maxRetries: 2
      })

      if (!response.success) {
        console.error('[HighlightService] Failed to get highlights:', response.error)
        return []
      }

      return response.data || []
    } catch (error) {
      console.error('[HighlightService] Get highlights error:', error)
      return []
    }
  }
}
```

### Options Page 中的配置更新

```typescript
// apps/extension/entrypoints/options/App.tsx

import MessageUtils from '../../utils/helpers/message-utils'
import { ServiceContext } from '../../utils/service-context'

function OptionsApp() {
  const [config, setConfig] = useState(defaultConfig)
  const [serviceStatus, setServiceStatus] = useState(null)

  // 检查服务状态
  useEffect(() => {
    const checkServiceStatus = async () => {
      try {
        const status = await MessageUtils.checkServiceWorkerStatus()
        setServiceStatus(status)
        
        if (!status.isAlive) {
          console.warn('Service Worker may not be responding')
        }
      } catch (error) {
        console.error('Failed to check service status:', error)
      }
    }

    checkServiceStatus()
    
    // 定期检查状态（可选）
    const interval = setInterval(checkServiceStatus, 30000)
    return () => clearInterval(interval)
  }, [])

  const handleSaveConfig = async () => {
    try {
      setIsSaving(true)
      
      // 检查扩展上下文是否有效
      if (!chrome.runtime?.id) {
        throw new Error('Extension context is invalid')
      }

      const response = await MessageUtils.sendMessageWithServiceWorkerSupport({
        type: 'SET_CONFIG',
        configType: 'translation',
        config: config
      }, {
        timeout: 10000,  // 配置保存可能需要更长时间
        maxRetries: 3
      })

      if (!response.success) {
        throw new Error(response.error || '保存失败')
      }

      setSaveMessage('配置已保存成功！')
      
    } catch (error) {
      console.error('Save config failed:', error)
      
      if (error.message.includes('timeout')) {
        setSaveMessage('保存超时，请检查网络连接或稍后重试')
      } else if (error.message.includes('Extension context invalidated')) {
        setSaveMessage('扩展已重新加载，请刷新页面后重试')
      } else {
        setSaveMessage(`保存失败：${error.message}`)
      }
    } finally {
      setIsSaving(false)
      setTimeout(() => setSaveMessage(''), 3000)
    }
  }

  return (
    <div>
      {/* 服务状态指示器 */}
      <div className="service-status">
        {serviceStatus && (
          <div className={`status-indicator ${serviceStatus.isAlive ? 'online' : 'offline'}`}>
            Service Worker: {serviceStatus.isAlive ? 'Active' : 'Inactive'}
          </div>
        )}
      </div>
      
      {/* 配置表单 */}
      <form onSubmit={handleSaveConfig}>
        {/* ... 配置项 ... */}
        <button type="submit" disabled={isSaving}>
          {isSaving ? '保存中...' : '保存配置'}
        </button>
      </form>
      
      {saveMessage && <div className="save-message">{saveMessage}</div>}
    </div>
  )
}
```

## 🔧 Background Script 完整示例

### 增强的 Background Script

```typescript
// apps/extension/entrypoints/background/index.ts

import { ServiceContext, ServiceStatus } from '../../utils/service-context'
import { ConfigManager } from '../../modules/services/config'
import { TranslationService } from '../../modules/services/translation'
import { HighlightService } from '../../modules/services/highlight'
import { Logger } from '../../utils/logger'

export default defineBackground(() => {
  const serviceContext = ServiceContext.getInstance()
  
  Logger.info('🚀 ANN Extension Background Script Starting...', {
    version: serviceContext.getStatus().version,
    timestamp: new Date().toISOString()
  })

  // 增强的 PING 处理器
  browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'PING') {
      const detailedStatus = serviceContext.getDetailedStatus()
      Logger.info('📡 PING received, responding with status:', detailedStatus.status)
      
      sendResponse({ 
        success: true,
        ...detailedStatus
      })
      return true
    }
    // 不处理其他消息，让具体服务处理
  })

  // 立即初始化服务
  initializeServices()
    .then(() => {
      Logger.info('✅ All services initialized successfully on startup')
    })
    .catch(error => {
      Logger.error('❌ Failed to initialize services on startup:', error)
    })

  // 统一的服务初始化函数
  async function initializeServices(): Promise<void> {
    try {
      serviceContext.startInitialization()
      Logger.info('🔄 Starting service initialization...')

      // 初始化配置服务
      Logger.info('⚙️  Initializing ConfigManager...')
      await ConfigManager.initialize()
      serviceContext.markServiceInitialized('config')

      // 初始化翻译服务
      Logger.info('🌐 Initializing TranslationService...')
      await TranslationService.getInstance().initialize()
      serviceContext.markServiceInitialized('translation')

      // 初始化高亮服务
      Logger.info('📝 Initializing HighlightService...')
      await HighlightService.getInstance().initialize()
      serviceContext.markServiceInitialized('highlight')

      Logger.info('🎉 Service initialization completed successfully')

    } catch (error) {
      Logger.error('💥 Service initialization failed:', error)
      serviceContext.markInitializationFailed(error instanceof Error ? error : new Error(String(error)))
      throw error
    }
  }

  // 处理扩展生命周期事件
  browser.runtime.onInstalled.addListener(async (details) => {
    try {
      Logger.info('📦 Extension installed/updated:', details.reason)
      
      switch (details.reason) {
        case 'install':
          Logger.info('🎊 First installation detected')
          await handleFirstInstallation()
          break
          
        case 'update':
          Logger.info('🔄 Update detected, migrating from:', details.previousVersion)
          await handleVersionUpdate(details.previousVersion)
          break
          
        case 'chrome_update':
          Logger.info('🌟 Chrome update detected, checking services...')
          if (!serviceContext.isReady()) {
            await initializeServices()
          }
          break
          
        default:
          Logger.info('❓ Unknown installation reason:', details.reason)
      }
      
    } catch (error) {
      Logger.error('❌ Installation/update handling failed:', error)
    }
  })

  // 浏览器启动处理
  browser.runtime.onStartup.addListener(async () => {
    try {
      Logger.info('🔄 Browser startup detected')
      
      const currentStatus = serviceContext.getStatus()
      Logger.info('📊 Current service status:', currentStatus.status)
      
      if (!serviceContext.isReady()) {
        Logger.info('🛠️  Services not ready, reinitializing...')
        serviceContext.startRestart()
        await initializeServices()
      }
      
    } catch (error) {
      Logger.error('❌ Browser startup handling failed:', error)
    }
  })

  // 首次安装处理
  async function handleFirstInstallation(): Promise<void> {
    Logger.info('🎯 Setting up first installation...')
    
    try {
      // 确保默认配置存在
      await ConfigManager.initialize()
      
      // 初始化所有服务
      await initializeServices()
      
      // 可以在这里添加首次使用的引导逻辑
      Logger.info('✅ First installation setup completed')
      
    } catch (error) {
      Logger.error('❌ First installation setup failed:', error)
      throw error
    }
  }

  // 版本更新处理
  async function handleVersionUpdate(previousVersion?: string): Promise<void> {
    if (!previousVersion) return

    Logger.info(`🔄 Updating from ${previousVersion} to current version`)

    try {
      // 版本迁移逻辑
      if (previousVersion.startsWith('1.')) {
        Logger.info('📋 Performing V1 to V2 migration')
        await migrateFromV1ToV2()
      }
      
      // 确保配置是最新的
      await ConfigManager.initialize()
      
      // 重新初始化服务
      await initializeServices()
      
      Logger.info('✅ Version update completed successfully')
      
    } catch (error) {
      Logger.error('❌ Version update failed:', error)
      throw error
    }
  }

  async function migrateFromV1ToV2(): Promise<void> {
    // 实际的迁移逻辑
    Logger.info('🔄 Starting V1 to V2 migration...')
    
    // 示例迁移步骤
    // 1. 备份现有数据
    // 2. 转换数据格式
    // 3. 清理废弃项
    
    Logger.info('✅ V1 to V2 migration completed')
  }

  // 全局错误处理
  self.addEventListener('error', (event) => {
    Logger.error('💥 Global error in service worker:', event.error)
  })

  self.addEventListener('unhandledrejection', (event) => {
    Logger.error('💥 Unhandled promise rejection:', event.reason)
  })

  Logger.info('🎯 Background script setup completed')
})
```

## 🛠️ 调试和监控示例

### 开发环境中的状态监控

```typescript
// apps/extension/utils/dev-monitor.ts

import { ServiceWorkerManager } from './service-worker-manager'
import { ServiceContext } from './service-context'
import MessageUtils from './helpers/message-utils'

export class DevMonitor {
  private static instance: DevMonitor
  private monitorInterval: number | null = null

  static getInstance(): DevMonitor {
    if (!DevMonitor.instance) {
      DevMonitor.instance = new DevMonitor()
    }
    return DevMonitor.instance
  }

  /**
   * 开启开发环境监控
   */
  startDevelopmentMonitoring(): void {
    if (process.env.NODE_ENV !== 'development') {
      return
    }

    console.log('🔍 Starting development monitoring...')

    // 开启 Service Worker 健康检查
    ServiceWorkerManager.getInstance().startHealthCheck(10000) // 每10秒检查

    // 定期报告状态
    this.monitorInterval = setInterval(async () => {
      try {
        const swStatus = await MessageUtils.checkServiceWorkerStatus()
        const timestamp = new Date().toLocaleTimeString()
        
        console.group(`📊 Dev Monitor Report - ${timestamp}`)
        console.log('🔄 Service Worker:', swStatus.isAlive ? '✅ Active' : '❌ Inactive')
        
        if (swStatus.isAlive) {
          console.log('⏱️ Uptime:', Math.round(swStatus.uptime / 1000), 'seconds')
          console.log('📝 Status:', swStatus.status)
          console.log('🔢 Version:', swStatus.version)
        }
        
        console.groupEnd()
      } catch (error) {
        console.error('❌ Dev monitor error:', error)
      }
    }, 30000) // 每30秒报告一次

    // 监听扩展上下文失效
    const checkContext = () => {
      if (!chrome.runtime?.id) {
        console.warn('⚠️ Extension context invalidated - extension may have been reloaded')
        this.stopDevelopmentMonitoring()
      }
    }

    setInterval(checkContext, 5000)
  }

  /**
   * 停止开发监控
   */
  stopDevelopmentMonitoring(): void {
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval)
      this.monitorInterval = null
    }

    ServiceWorkerManager.getInstance().stopHealthCheck()
    console.log('🛑 Development monitoring stopped')
  }

  /**
   * 手动诊断 Service Worker 状态
   */
  async diagnoseServiceWorker(): Promise<void> {
    console.group('🔍 Service Worker Diagnostic')
    
    try {
      // 1. 检查扩展上下文
      if (!chrome.runtime?.id) {
        console.error('❌ Extension context is invalid')
        return
      }
      console.log('✅ Extension context is valid')

      // 2. 检查网络状态
      console.log('🌐 Network status:', navigator.onLine ? 'Online' : 'Offline')

      // 3. 检查 Service Worker
      const swStatus = await MessageUtils.checkServiceWorkerStatus()
      if (swStatus.isAlive) {
        console.log('✅ Service Worker is responding')
        console.log('📊 Details:', swStatus)
      } else {
        console.warn('⚠️ Service Worker not responding')
      }

      // 4. 测试消息发送
      console.log('📤 Testing message sending...')
      const testResponse = await MessageUtils.sendMessageWithServiceWorkerSupport({
        type: 'PING'
      }, {
        timeout: 5000,
        maxRetries: 1
      })

      if (testResponse.success) {
        console.log('✅ Message sending test passed')
      } else {
        console.error('❌ Message sending test failed:', testResponse.error)
      }

    } catch (error) {
      console.error('❌ Diagnostic failed:', error)
    } finally {
      console.groupEnd()
    }
  }
}

// 在开发环境中自动启动监控
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    DevMonitor.getInstance().startDevelopmentMonitoring()
    
    // 添加全局调试函数
    ;(window as any).diagnoseANN = () => {
      DevMonitor.getInstance().diagnoseServiceWorker()
    }
    
    console.log('🛠️ ANN Dev tools loaded. Use diagnoseANN() to run diagnostics.')
  })
}
```

## 📱 实际使用技巧

### 1. 消息发送最佳实践

```typescript
// ✅ 推荐的消息发送模式
const sendMessage = async (message: any, options: any = {}) => {
  try {
    // 检查扩展上下文
    if (!chrome.runtime?.id) {
      throw new Error('Extension context invalidated')
    }

    const response = await MessageUtils.sendMessageWithServiceWorkerSupport(message, {
      maxRetries: 3,
      retryDelay: 1000,
      timeout: 8000,
      waitForServiceWorker: true,
      ...options
    })

    if (!response.success) {
      throw new Error(response.error)
    }

    return response.data
    
  } catch (error) {
    console.error('Message sending failed:', error)
    
    // 根据错误类型提供用户友好的提示
    if (error.message.includes('timeout')) {
      throw new Error('操作超时，请检查网络连接')
    } else if (error.message.includes('Extension context invalidated')) {
      throw new Error('扩展已重新加载，请刷新页面')
    } else {
      throw error
    }
  }
}
```

### 2. 错误处理模式

```typescript
// 统一的错误处理装饰器
const withErrorHandling = (fn: Function) => {
  return async (...args: any[]) => {
    try {
      return await fn(...args)
    } catch (error) {
      console.error(`Function ${fn.name} failed:`, error)
      
      // 根据错误类型进行处理
      if (error.message.includes('timeout')) {
        // 显示重试提示
        return { success: false, error: 'timeout', retryable: true }
      } else if (error.message.includes('Extension context')) {
        // 显示刷新提示
        return { success: false, error: 'context_invalid', retryable: false }
      } else {
        // 通用错误
        return { success: false, error: error.message, retryable: true }
      }
    }
  }
}

// 使用示例
const saveHighlight = withErrorHandling(async (highlight: HighlightRecord) => {
  return await sendMessage({ type: 'SAVE_HIGHLIGHT', data: highlight })
})
```

这些示例展示了如何在实际项目中应用我们的 Service Worker 可用性改进，确保在 Manifest V3 环境下的稳定通信。 