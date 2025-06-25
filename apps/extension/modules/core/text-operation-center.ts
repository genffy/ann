import { useAppStore, type TextSelection } from '../store'
import { errorUtils } from '../../lib/logger'
import { domUtils } from '../../lib/helpers/dom'
import { textUtils } from '../../lib/helpers/text'
import { debounce } from '../../lib/helpers'
import { APP_CONFIG, EVENT_TYPES, ERROR_TYPES } from '../../constants'
import type { PluginBase } from './plugin-base'
import { TranslationPlugin } from '../plugins/translation-plugin'

/**
 * TextOperationCenter - 文本操作中心
 * 
 * 这是整个扩展的核心管理器，负责：
 * 1. 文本选择检测和处理
 * 2. 插件系统管理
 * 3. UI状态协调
 * 4. 事件分发和处理
 */
export class TextOperationCenter {
  private static instance: TextOperationCenter | null = null

  // 插件注册表
  private plugins: Map<string, PluginBase> = new Map()

  // 事件监听器
  private eventListeners: Map<string, Function[]> = new Map()

  // 当前状态
  private isInitialized = false
  private isDomainAllowed = true
  private isProcessing = false

  // DOM元素引用
  private toolbarElement: HTMLElement | null = null
  private shadowRoot: ShadowRoot | null = null

  // 防抖函数
  private debouncedHandleSelection = debounce(this.handleTextSelection.bind(this), 100)

  private constructor() {
    this.initializeEventListeners()
  }

  /**
   * 获取单例实例
   */
  static getInstance(): TextOperationCenter {
    if (!TextOperationCenter.instance) {
      TextOperationCenter.instance = new TextOperationCenter()
    }
    return TextOperationCenter.instance
  }

  /**
   * 初始化文本操作中心
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.warn('[TextOperationCenter] Already initialized')
      return
    }

    try {
      console.log('[TextOperationCenter] Initializing...')

      // 检查域名权限
      await this.checkDomainPermission()

      if (!this.isDomainAllowed) {
        console.log('[TextOperationCenter] Domain not allowed, skipping initialization')
        return
      }

      // 创建Shadow DOM容器
      await this.createShadowContainer()

      // 初始化DOM事件监听
      this.attachDOMListeners()

      // 初始化状态store
      this.initializeStores()

      // 注册核心插件
      await this.registerCorePlugins()

      // 触发初始化事件
      this.emit(EVENT_TYPES.CONTENT_READY, {
        timestamp: Date.now(),
        domain: window.location.hostname
      })

      this.isInitialized = true
      console.log('[TextOperationCenter] Initialized successfully')

    } catch (error) {
      errorUtils.log(error as Error, 'TextOperationCenter.initialize')
      throw errorUtils.create(
        ERROR_TYPES.UNKNOWN_ERROR,
        'Failed to initialize TextOperationCenter',
        error
      )
    }
  }

  /**
   * 销毁实例
   */
  destroy(): void {
    console.log('[TextOperationCenter] Destroying...')

    // 移除DOM监听器
    this.detachDOMListeners()

    // 清理Shadow DOM
    if (this.shadowRoot && this.shadowRoot.host) {
      this.shadowRoot.host.remove()
    }

    // 清理插件
    this.plugins.forEach(plugin => plugin.destroy())
    this.plugins.clear()

    // 清理事件监听器
    this.eventListeners.clear()

    // 重置状态
    this.isInitialized = false
    this.toolbarElement = null
    this.shadowRoot = null

    // 重置store状态
    useAppStore.getState().resetAll()

    TextOperationCenter.instance = null
  }

  /**
   * 注册插件
   */
  registerPlugin(plugin: PluginBase): void {
    if (this.plugins.has(plugin.name)) {
      console.warn(`[TextOperationCenter] Plugin ${plugin.name} already registered`)
      return
    }

    console.log(`[TextOperationCenter] Registering plugin: ${plugin.name}`)
    this.plugins.set(plugin.name, plugin)

    // 初始化插件
    plugin.initialize(this)
  }

  /**
   * 卸载插件
   */
  unregisterPlugin(pluginName: string): void {
    const plugin = this.plugins.get(pluginName)
    if (!plugin) {
      console.warn(`[TextOperationCenter] Plugin ${pluginName} not found`)
      return
    }

    console.log(`[TextOperationCenter] Unregistering plugin: ${pluginName}`)
    plugin.destroy()
    this.plugins.delete(pluginName)
  }

  /**
   * 获取插件
   */
  getPlugin(pluginName: string): PluginBase | undefined {
    return this.plugins.get(pluginName)
  }

  /**
   * 注册核心插件
   */
  private async registerCorePlugins(): Promise<void> {
    try {
      console.log('[TextOperationCenter] Registering core plugins...')

      // 注册翻译插件
      const translationPlugin = new TranslationPlugin()
      this.registerPlugin(translationPlugin)

      console.log('[TextOperationCenter] Core plugins registered successfully')
    } catch (error) {
      errorUtils.log(error as Error, 'TextOperationCenter.registerCorePlugins')
      console.error('[TextOperationCenter] Failed to register core plugins:', error)
    }
  }

  /**
   * 事件监听
   */
  on(eventType: string, listener: Function): void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, [])
    }
    this.eventListeners.get(eventType)!.push(listener)
  }

  /**
   * 移除事件监听
   */
  off(eventType: string, listener: Function): void {
    const listeners = this.eventListeners.get(eventType)
    if (!listeners) return

    const index = listeners.indexOf(listener)
    if (index > -1) {
      listeners.splice(index, 1)
    }
  }

  /**
   * 触发事件
   */
  emit(eventType: string, data?: any): void {
    const listeners = this.eventListeners.get(eventType)
    if (!listeners) return

    listeners.forEach(listener => {
      try {
        listener(data)
      } catch (error) {
        errorUtils.log(error as Error, `Event listener for ${eventType}`)
      }
    })
  }

  /**
   * 显示工具栏
   */
  async showToolbar(selection: TextSelection): Promise<void> {
    if (!this.isInitialized || !this.isDomainAllowed) return

    try {
      // 更新选择状态
      useAppStore.getState().setCurrentSelection(selection)

      // 计算工具栏位置
      if (selection.boundingRect) {
        const position = domUtils.calculateToolbarPosition(
          selection.boundingRect,
          APP_CONFIG.ui.toolbar.maxWidth,
          60 // 估算的工具栏高度
        )

        useAppStore.getState().setToolbarPosition(position)
      }

      // 创建或更新工具栏
      await this.createOrUpdateToolbar()

      // 显示工具栏
      useAppStore.getState().setToolbarVisible(true)

      // 触发事件
      this.emit(EVENT_TYPES.TOOLBAR_SHOW, { selection, timestamp: Date.now() })

    } catch (error) {
      errorUtils.log(error as Error, 'TextOperationCenter.showToolbar')
    }
  }

  /**
   * 隐藏工具栏
   */
  hideToolbar(): void {
    if (!useAppStore.getState().toolbar.isVisible) return

    // 隐藏工具栏
    useAppStore.getState().setToolbarVisible(false)
    useAppStore.getState().setActiveFeature(null)

    // 清理选择状态
    useAppStore.getState().setCurrentSelection(null)

    // 触发事件
    this.emit(EVENT_TYPES.TOOLBAR_HIDE, { timestamp: Date.now() })
  }

  /**
   * 激活功能
   */
  async activateFeature(featureName: 'translation' | 'notes' | 'sharing'): Promise<void> {
    if (!this.isInitialized || this.isProcessing) return

    const plugin = this.plugins.get(featureName)
    if (!plugin) {
      console.warn(`[TextOperationCenter] Feature plugin ${featureName} not found`)
      return
    }

    try {
      this.isProcessing = true
      useAppStore.getState().setActiveFeature(featureName)

      // 执行插件功能
      await plugin.execute()

    } catch (error) {
      errorUtils.log(error as Error, `TextOperationCenter.activateFeature(${featureName})`)
    } finally {
      this.isProcessing = false
    }
  }

  /**
   * 获取Shadow Root
   */
  getShadowRoot(): ShadowRoot | null {
    return this.shadowRoot
  }

  // ===================
  // 私有方法
  // ===================

  /**
   * 初始化事件监听器
   */
  private initializeEventListeners(): void {
    // 监听来自background script的消息
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        this.handleChromeMessage(message, sender, sendResponse)
      })
    }
  }

  /**
   * 处理Chrome扩展消息
   */
  private handleChromeMessage(message: any, sender: any, sendResponse: Function): void {
    switch (message.type) {
      case 'DOMAIN_WHITELIST_UPDATED':
        this.handleDomainWhitelistUpdate(message)
        break
      case 'CAPTURE_SCREENSHOT':
        this.handleScreenshotCapture(message)
        break
    }
  }

  /**
   * 检查域名权限
   */
  private async checkDomainPermission(): Promise<void> {
    try {
      if (typeof chrome !== 'undefined' && chrome.runtime) {
        const response = await chrome.runtime.sendMessage({
          type: 'CHECK_DOMAIN_WHITELIST',
          domain: window.location.hostname,
        })
        this.isDomainAllowed = response?.isAllowed ?? true
      }
    } catch (error) {
      console.warn('[TextOperationCenter] Failed to check domain permission:', error)
      this.isDomainAllowed = true
    }

    // 域名权限检查完成
  }

  /**
   * 创建Shadow DOM容器
   */
  private async createShadowContainer(): Promise<void> {
    // 创建宿主元素
    const hostElement = document.createElement('div')
    hostElement.id = 'ann-text-toolkit-host'
    hostElement.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      z-index: 999999;
      pointer-events: none;
    `

    // 创建Shadow DOM
    this.shadowRoot = hostElement.attachShadow({ mode: 'closed' })

    // 注入样式
    const styleSheet = new CSSStyleSheet()
    await styleSheet.replace(`
      :host {
        all: initial;
        position: fixed;
        top: 0;
        left: 0;
        z-index: 999999;
      }
      
      .ann-toolbar {
        position: absolute;
        background: white;
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        padding: 8px;
        display: flex;
        gap: 4px;
        pointer-events: auto;
        opacity: 0;
        transform: translateY(-10px);
        transition: all 0.2s ease-out;
      }
      
      .ann-toolbar.visible {
        opacity: 1;
        transform: translateY(0);
      }
      
      .ann-toolbar-button {
        width: 32px;
        height: 32px;
        border: none;
        border-radius: 6px;
        background: #f8f9fa;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.15s ease;
      }
      
      .ann-toolbar-button:hover {
        background: #e9ecef;
        transform: scale(1.05);
      }
      
      .ann-toolbar-button.active {
        background: #007bff;
        color: white;
      }
    `)

    this.shadowRoot.adoptedStyleSheets = [styleSheet]

    // 添加到页面
    document.documentElement.appendChild(hostElement)
  }

  /**
   * 附加DOM事件监听器
   */
  private attachDOMListeners(): void {
    document.addEventListener('mouseup', this.handleMouseUp.bind(this))
    document.addEventListener('keyup', this.handleKeyUp.bind(this))
    document.addEventListener('mousedown', this.handleMouseDown.bind(this))
    document.addEventListener('scroll', this.handleScroll.bind(this))
  }

  /**
   * 移除DOM事件监听器
   */
  private detachDOMListeners(): void {
    document.removeEventListener('mouseup', this.handleMouseUp.bind(this))
    document.removeEventListener('keyup', this.handleKeyUp.bind(this))
    document.removeEventListener('mousedown', this.handleMouseDown.bind(this))
    document.removeEventListener('scroll', this.handleScroll.bind(this))
  }

  /**
   * 初始化状态stores
   */
  private initializeStores(): void {
    // 初始化状态管理
    console.log('[TextOperationCenter] Stores initialized')
  }

  /**
   * 处理鼠标松开事件
   */
  private handleMouseUp(event: MouseEvent): void {
    // 延迟处理，确保选择状态稳定
    setTimeout(() => {
      this.debouncedHandleSelection(event)
    }, 10)
  }

  /**
   * 处理键盘松开事件
   */
  private handleKeyUp(event: KeyboardEvent): void {
    if (['Shift', 'Control', 'Alt'].includes(event.key)) {
      setTimeout(() => {
        this.debouncedHandleSelection()
      }, 10)
    }

    // 处理ESC键隐藏工具栏
    if (event.key === 'Escape') {
      this.hideToolbar()
    }
  }

  /**
   * 处理鼠标按下事件
   */
  private handleMouseDown(event: MouseEvent): void {
    // 如果点击在工具栏外部，隐藏工具栏
    if (this.toolbarElement && !this.toolbarElement.contains(event.target as Node)) {
      this.hideToolbar()
    }
  }

  /**
   * 处理滚动事件
   */
  private handleScroll(): void {
    // 滚动时隐藏工具栏
    if (useAppStore.getState().toolbar.isVisible) {
      this.hideToolbar()
    }
  }

  /**
   * 处理文本选择
   */
  private async handleTextSelection(event?: MouseEvent): Promise<void> {
    if (!this.isInitialized || !this.isDomainAllowed || this.isProcessing) {
      return
    }

    const selection = window.getSelection()
    if (!selection || selection.toString().trim().length === 0) {
      this.hideToolbar()
      return
    }

    const selectedText = textUtils.clean(selection.toString())

    // 验证选择的文本
    if (!this.isValidSelection(selectedText)) {
      this.hideToolbar()
      return
    }

    // 获取选择边界
    const boundingRect = domUtils.getSelectionBounds(selection)
    if (!boundingRect) {
      this.hideToolbar()
      return
    }

    // 创建文本选择对象
    const textSelection: TextSelection = {
      text: selectedText,
      range: selection.rangeCount > 0 ? selection.getRangeAt(0) : null,
      boundingRect,
      timestamp: Date.now()
    }

    // 保存到app store
    useAppStore.getState().setCurrentSelection(textSelection)

    // 触发选择事件
    this.emit(EVENT_TYPES.TEXT_SELECTED, textSelection)

    // 显示工具栏
    await this.showToolbar(textSelection)
  }

  /**
   * 验证选择是否有效
   */
  private isValidSelection(text: string): boolean {
    // 最小长度检查
    if (text.length < 1) return false

    // 最大长度检查
    if (text.length > 1000) return false

    // 过滤掉只包含空白字符的选择
    if (/^\s*$/.test(text)) return false

    return true
  }

  /**
   * 创建或更新工具栏
   */
  private async createOrUpdateToolbar(): Promise<void> {
    if (!this.shadowRoot) return

    // 如果工具栏已存在，只更新位置
    if (this.toolbarElement) {
      this.updateToolbarPosition()
      return
    }

    // 创建工具栏容器
    this.toolbarElement = document.createElement('div')
    this.toolbarElement.id = 'ann-toolbar-container'
    this.toolbarElement.className = 'ann-toolbar-container'

    // 添加到Shadow DOM
    this.shadowRoot.appendChild(this.toolbarElement)

    // 动态加载React组件
    await this.renderToolbarComponent()

    // 设置初始位置
    this.updateToolbarPosition()
  }

  /**
   * 渲染工具栏React组件
   */
  private async renderToolbarComponent(): Promise<void> {
    try {
      // 动态导入React和组件
      const React = await import('react')
      const ReactDOM = await import('react-dom/client')
      const { TextToolbar } = await import('../../components/ui/text-toolbar')

      if (!this.toolbarElement) return

      // 创建React根节点
      const root = ReactDOM.createRoot(this.toolbarElement)

      // 获取当前选择信息
      const selection = useAppStore.getState().currentSelection

      // 渲染工具栏组件
      root.render(
        React.createElement(TextToolbar, {
          selection: selection,
          onTranslate: () => this.activateFeature('translation'),
          onAddNote: () => this.activateFeature('notes'),
          onShare: () => this.activateFeature('sharing'),
          onClose: () => this.hideToolbar()
        })
      )

      console.log('[TextOperationCenter] Toolbar component rendered')

    } catch (error) {
      console.error('[TextOperationCenter] Failed to render toolbar component:', error)
      errorUtils.log(error as Error, 'TextOperationCenter.renderToolbarComponent')

      // 降级到简单HTML工具栏
      this.createFallbackToolbar()
    }
  }

  /**
   * 创建降级工具栏（当React组件加载失败时使用）
   */
  private createFallbackToolbar(): void {
    if (!this.toolbarElement) return

    this.toolbarElement.innerHTML = `
      <div class="ann-toolbar-fallback">
        <button class="ann-toolbar-button" data-feature="translation" title="翻译">🌐</button>
        <button class="ann-toolbar-button" data-feature="notes" title="备注">📝</button>
        <button class="ann-toolbar-button" data-feature="sharing" title="分享">📷</button>
        <button class="ann-toolbar-button" data-feature="close" title="关闭">✕</button>
      </div>
    `

    // 添加事件监听
    this.toolbarElement.addEventListener('click', (event) => {
      const target = event.target as HTMLElement
      if (target.classList.contains('ann-toolbar-button')) {
        const feature = target.getAttribute('data-feature')
        if (feature === 'close') {
          this.hideToolbar()
        } else if (feature) {
          this.activateFeature(feature as any)
        }
      }
    })
  }

  /**
   * 更新工具栏位置
   */
  private updateToolbarPosition(): void {
    if (!this.toolbarElement) return

    const { position, isVisible } = useAppStore.getState().toolbar

    this.toolbarElement.style.left = `${position.x}px`
    this.toolbarElement.style.top = `${position.y}px`

    // 切换可见性类
    if (isVisible) {
      this.toolbarElement.classList.add('visible')
    } else {
      this.toolbarElement.classList.remove('visible')
    }
  }

  /**
   * 处理域名白名单更新
   */
  private async handleDomainWhitelistUpdate(message: any): Promise<void> {
    if (message.domain === window.location.hostname) {
      console.log('[TextOperationCenter] Domain whitelist updated for current domain')

      await this.checkDomainPermission()

      if (this.isDomainAllowed && !this.isInitialized) {
        await this.initialize()
      } else if (!this.isDomainAllowed && this.isInitialized) {
        this.destroy()
      }
    }
  }

  /**
   * 处理截图捕获
   */
  private async handleScreenshotCapture(message: any): Promise<void> {
    const sharingPlugin = this.plugins.get('sharing')
    if (sharingPlugin) {
      try {
        await sharingPlugin.execute()
      } catch (error) {
        errorUtils.log(error as Error, 'Screenshot capture')
      }
    }
  }
}
