export default defineContentScript({
  matches: ['<all_urls>'],
  main() {
    console.log('Translation extension loaded')

    let translationPopup: HTMLElement | null = null
    let currentSelection: Selection | null = null

    // 监听文本选择事件
    document.addEventListener('mouseup', handleMouseUp)
    document.addEventListener('keyup', handleKeyUp)
    document.addEventListener('mousedown', hideTranslationPopup)

    function handleMouseUp(event: MouseEvent) {
      setTimeout(() => {
        handleTextSelection(event)
      }, 10)
    }

    function handleKeyUp(event: KeyboardEvent) {
      if (event.key === 'Shift' || event.key === 'Control' || event.key === 'Alt') {
        setTimeout(() => {
          handleTextSelection()
        }, 10)
      }
    }

    function handleTextSelection(event?: MouseEvent) {
      const selection = window.getSelection()
      if (!selection || selection.toString().trim().length === 0) {
        hideTranslationPopup()
        return
      }

      const selectedText = selection.toString().trim()
      if (selectedText.length < 1 || selectedText.length > 500) {
        hideTranslationPopup()
        return
      }

      currentSelection = selection
      showTranslationPopup(selectedText, event)
    }

    function showTranslationPopup(text: string, event?: MouseEvent) {
      hideTranslationPopup()

      const popup = createTranslationPopup()
      translationPopup = popup

      // 获取选中文本的位置
      const range = currentSelection?.getRangeAt(0)
      if (!range) return

      const rect = range.getBoundingClientRect()
      const scrollX = window.pageXOffset || document.documentElement.scrollLeft
      const scrollY = window.pageYOffset || document.documentElement.scrollTop

      // 定位到选中文本的上方
      popup.style.left = `${rect.left + scrollX}px`
      popup.style.top = `${rect.top + scrollY - popup.offsetHeight - 10}px`

      // 确保弹窗不会超出视窗
      const popupRect = popup.getBoundingClientRect()
      if (popupRect.right > window.innerWidth) {
        popup.style.left = `${window.innerWidth - popupRect.width - 20 + scrollX}px`
      }
      if (popupRect.top < 0) {
        popup.style.top = `${rect.bottom + scrollY + 10}px`
      }

      document.body.appendChild(popup)

      // 开始翻译
      translateText(text, popup)
    }

    function createTranslationPopup(): HTMLElement {
      const popup = document.createElement('div')
      popup.className = 'wxt-translation-popup'
      popup.innerHTML = `
        <div class="wxt-translation-header">
          <span class="wxt-translation-title">翻译中...</span>
          <button class="wxt-translation-close">×</button>
        </div>
        <div class="wxt-translation-content">
          <div class="wxt-translation-loading">正在翻译...</div>
        </div>
      `

      // 添加样式
      popup.style.cssText = `
        position: absolute;
        z-index: 10000;
        background: white;
        border: 1px solid #ddd;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 14px;
        line-height: 1.4;
        max-width: 300px;
        min-width: 200px;
        padding: 0;
        margin: 0;
      `

      // 添加关闭按钮事件
      const closeBtn = popup.querySelector('.wxt-translation-close') as HTMLElement
      closeBtn.addEventListener('click', hideTranslationPopup)
      closeBtn.style.cssText = `
        background: none;
        border: none;
        font-size: 18px;
        cursor: pointer;
        padding: 0;
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #666;
      `

      // 样式化其他元素
      const header = popup.querySelector('.wxt-translation-header') as HTMLElement
      header.style.cssText = `
        padding: 8px 12px;
        border-bottom: 1px solid #eee;
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: #f9f9f9;
        border-radius: 8px 8px 0 0;
      `

      const content = popup.querySelector('.wxt-translation-content') as HTMLElement
      content.style.cssText = `
        padding: 12px;
      `

      const loading = popup.querySelector('.wxt-translation-loading') as HTMLElement
      loading.style.cssText = `
        color: #666;
        font-style: italic;
      `

      return popup
    }

    async function translateText(text: string, popup: HTMLElement) {
      try {
        // 使用 background script 的翻译服务
        const response = await browser.runtime.sendMessage({
          type: 'TRANSLATE_TEXT',
          text: text,
        })

        const content = popup.querySelector('.wxt-translation-content') as HTMLElement
        const title = popup.querySelector('.wxt-translation-title') as HTMLElement
        console.log(response)
        if (response.success) {
          title.textContent = '翻译结果'
          content.innerHTML = `
            <div class="wxt-original-text">${text}</div>
            <div class="wxt-translation-result">${response.result}</div>
          `

          // 样式化结果
          const originalText = content.querySelector('.wxt-original-text') as HTMLElement
          originalText.style.cssText = `
            color: #666;
            font-size: 12px;
            margin-bottom: 8px;
            padding-bottom: 8px;
            border-bottom: 1px solid #eee;
          `

          const translationResult = content.querySelector('.wxt-translation-result') as HTMLElement
          translationResult.style.cssText = `
            color: #333;
            font-weight: 500;
          `
        } else {
          throw new Error(response.error || 'Translation failed')
        }
      } catch (error) {
        console.error('Translation error:', error)
        const content = popup.querySelector('.wxt-translation-content') as HTMLElement
        const title = popup.querySelector('.wxt-translation-title') as HTMLElement

        title.textContent = '翻译失败'
        content.innerHTML = `
          <div class="wxt-error-message">翻译服务暂时不可用，请稍后重试</div>
        `

        const errorMsg = content.querySelector('.wxt-error-message') as HTMLElement
        errorMsg.style.cssText = `
          color: #e74c3c;
          font-size: 13px;
        `
      }
    }

    function hideTranslationPopup() {
      if (translationPopup) {
        translationPopup.remove()
        translationPopup = null
      }
    }

    // 点击页面其他地方时隐藏弹窗
    document.addEventListener('click', event => {
      if (translationPopup && !translationPopup.contains(event.target as Node)) {
        hideTranslationPopup()
      }
    })
  },
})
