export default defineContentScript({
  matches: ['<all_urls>'],
  main() {
    console.log('Translation extension loaded')

    // Check if current domain is allowed
    checkDomainPermission().then(isAllowed => {
      if (!isAllowed) {
        console.log('Translation extension disabled on this domain:', window.location.hostname)
        return
      }

      // Initialize extension functionality
      initializeExtension()
      isExtensionInitialized = true
    })
  }
})

// Check if current domain is in whitelist
async function checkDomainPermission(): Promise<boolean> {
  try {
    const response = await browser.runtime.sendMessage({
      type: 'CHECK_DOMAIN_WHITELIST',
      domain: window.location.hostname,
    })
    return response.isAllowed
  } catch (error) {
    console.error('Failed to check domain permission:', error)
    // Default to not allowed if check fails
    return false
  }
}

// Listen for domain whitelist updates
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'DOMAIN_WHITELIST_UPDATED') {
    // Check if this update affects current domain
    if (message.domain === window.location.hostname) {
      console.log('Domain whitelist updated for current domain, reloading extension state...')

      // Re-check domain permission and reinitialize if needed
      checkDomainPermission().then(isAllowed => {
        if (isAllowed) {
          // If domain is now allowed and extension wasn't initialized, initialize it
          if (!isExtensionInitialized) {
            console.log('Domain now allowed, initializing extension...')
            initializeExtension()
            isExtensionInitialized = true
          }
        } else {
          // If domain is no longer allowed, cleanup
          if (isExtensionInitialized) {
            console.log('Domain no longer allowed, cleaning up extension...')
            cleanupExtension()
            isExtensionInitialized = false
          }
        }
      })
    }
  }
})

// Track extension initialization state
let isExtensionInitialized = false

// Global variables for extension functionality
let translationPopup: HTMLElement | null = null
let currentSelection: Selection | null = null
let isClosing = false // Flag to prevent reopening during close

// Initialize extension functionality
function initializeExtension() {

  // Listen for text selection events
  document.addEventListener('mouseup', handleMouseUp)
  document.addEventListener('keyup', handleKeyUp)
  document.addEventListener('mousedown', (event) => {
    // Don't hide if extension is not initialized, we're already closing or if no popup exists
    if (!isExtensionInitialized || isClosing || !translationPopup) {
      return
    }

    // Don't hide if clicking on the popup itself
    if (translationPopup.contains(event.target as Node)) {
      return
    }

    // Hide the popup
    hideTranslationPopup()
  })

  function handleMouseUp(event: MouseEvent) {
    if (!isExtensionInitialized) return
    setTimeout(() => {
      handleTextSelection(event)
    }, 10)
  }

  function handleKeyUp(event: KeyboardEvent) {
    if (!isExtensionInitialized) return
    if (event.key === 'Shift' || event.key === 'Control' || event.key === 'Alt') {
      setTimeout(() => {
        handleTextSelection()
      }, 10)
    }
  }

  async function handleTextSelection(event?: MouseEvent) {
    // Don't show popup if extension is not initialized or we're in the process of closing
    if (!isExtensionInitialized || isClosing) {
      return
    }

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

    // Check if text should be translated based on filter rules
    const shouldTranslate = await checkTranslationRules(selectedText)
    if (!shouldTranslate) {
      hideTranslationPopup()
      return
    }

    currentSelection = selection
    showTranslationPopup(selectedText, event)
  }

  // Check if text matches translation rules
  async function checkTranslationRules(text: string): Promise<boolean> {
    try {
      const response = await browser.runtime.sendMessage({
        type: 'CHECK_TRANSLATION_RULES',
        text: text,
      })
      return response.shouldTranslate
    } catch (error) {
      console.error('Failed to check translation rules:', error)
      // Default to translate if rules check fails
      return true
    }
  }

  // Detect page theme (light/dark)
  function detectPageTheme(): 'light' | 'dark' {
    // Check CSS custom properties for theme
    const computedStyle = window.getComputedStyle(document.documentElement)
    const colorScheme = computedStyle.getPropertyValue('color-scheme')

    if (colorScheme.includes('dark')) {
      return 'dark'
    }

    // Check background color of body or html
    const bodyStyle = window.getComputedStyle(document.body)
    const htmlStyle = window.getComputedStyle(document.documentElement)

    const bodyBg = bodyStyle.backgroundColor
    const htmlBg = htmlStyle.backgroundColor

    // Convert RGB to luminance to determine if it's dark
    const getLuminance = (rgb: string) => {
      const match = rgb.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/)
      if (!match) return 0.5

      const [, r, g, b] = match.map(Number)
      const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
      return luminance
    }

    const bodyLuminance = getLuminance(bodyBg)
    const htmlLuminance = getLuminance(htmlBg)

    // If either body or html has dark background, consider it dark theme
    if (bodyLuminance < 0.5 || htmlLuminance < 0.5) {
      return 'dark'
    }

    // Check for dark theme class names
    const classList = [
      ...document.documentElement.classList,
      ...document.body.classList
    ]

    const darkClassNames = ['dark', 'dark-theme', 'theme-dark', 'dark-mode']
    if (darkClassNames.some(className => classList.includes(className))) {
      return 'dark'
    }

    return 'light'
  }

  function showTranslationPopup(text: string, event?: MouseEvent) {
    hideTranslationPopup()

    const popup = createTranslationPopup()
    translationPopup = popup

    // Get the position of selected text
    const range = currentSelection?.getRangeAt(0)
    if (!range) return

    const rect = range.getBoundingClientRect()
    const scrollX = window.pageXOffset || document.documentElement.scrollLeft
    const scrollY = window.pageYOffset || document.documentElement.scrollTop

    // Position above the selected text
    popup.style.left = `${rect.left + scrollX}px`
    popup.style.top = `${rect.top + scrollY - popup.offsetHeight - 10}px`

    // Ensure popup doesn't exceed viewport
    const popupRect = popup.getBoundingClientRect()
    if (popupRect.right > window.innerWidth) {
      popup.style.left = `${window.innerWidth - popupRect.width - 20 + scrollX}px`
    }
    if (popupRect.top < 0) {
      popup.style.top = `${rect.bottom + scrollY + 10}px`
    }

    document.body.appendChild(popup)

    // Start translation
    translateText(text, popup)
  }

  function createTranslationPopup(): HTMLElement {
    const popup = document.createElement('div')
    popup.className = 'wxt-translation-popup'

    // Detect current page theme
    const theme = detectPageTheme()
    const isLight = theme === 'light'

    popup.innerHTML = `
        <div class="wxt-translation-header">
          <span class="wxt-translation-title">Translating...</span>
          <button class="wxt-translation-close">×</button>
        </div>
        <div class="wxt-translation-content">
          <div class="wxt-translation-loading">Translating...</div>
        </div>
      `

    // Apply theme-adaptive styles
    popup.style.cssText = `
        position: absolute;
        z-index: 10000;
        background: ${isLight ? 'white' : '#2d2d2d'};
        border: 1px solid ${isLight ? '#ddd' : '#555'};
        border-radius: 8px;
        box-shadow: 0 4px 12px ${isLight ? 'rgba(0,0,0,0.15)' : 'rgba(0,0,0,0.4)'};
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 14px;
        line-height: 1.4;
        max-width: 300px;
        min-width: 200px;
        padding: 0;
        margin: 0;
        color: ${isLight ? '#333' : '#e0e0e0'};
      `

    // Add close button event
    const closeBtn = popup.querySelector('.wxt-translation-close') as HTMLElement
    closeBtn.addEventListener('click', (event) => {
      event.preventDefault()
      event.stopPropagation()
      hideTranslationPopup()
    })
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
        color: ${isLight ? '#666' : '#ccc'};
        transition: color 0.2s ease;
      `
    closeBtn.addEventListener('mouseenter', () => {
      closeBtn.style.color = isLight ? '#000' : '#fff'
    })
    closeBtn.addEventListener('mouseleave', () => {
      closeBtn.style.color = isLight ? '#666' : '#ccc'
    })

    // Style other elements with theme adaptation
    const header = popup.querySelector('.wxt-translation-header') as HTMLElement
    header.style.cssText = `
        padding: 8px 12px;
        border-bottom: 1px solid ${isLight ? '#eee' : '#444'};
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: ${isLight ? '#f9f9f9' : '#383838'};
        border-radius: 8px 8px 0 0;
      `

    const content = popup.querySelector('.wxt-translation-content') as HTMLElement
    content.style.cssText = `
        padding: 12px;
      `

    const loading = popup.querySelector('.wxt-translation-loading') as HTMLElement
    loading.style.cssText = `
        color: ${isLight ? '#666' : '#aaa'};
        font-style: italic;
      `

    return popup
  }

  async function translateText(text: string, popup: HTMLElement) {
    try {
      // Use background script translation service
      const response = await browser.runtime.sendMessage({
        type: 'TRANSLATE_TEXT',
        text: text,
      })

      const content = popup.querySelector('.wxt-translation-content') as HTMLElement
      const title = popup.querySelector('.wxt-translation-title') as HTMLElement
      const theme = detectPageTheme()
      const isLight = theme === 'light'

      console.log(response)
      if (response.success) {
        title.textContent = 'Translation'
        // Only show translation result, not original text
        content.innerHTML = `
            <div class="wxt-translation-result">${response.result}</div>
          `

        // Style translation result with theme adaptation
        const translationResult = content.querySelector('.wxt-translation-result') as HTMLElement
        translationResult.style.cssText = `
            color: ${isLight ? '#333' : '#e0e0e0'};
            font-weight: 500;
            line-height: 1.5;
          `
      } else {
        throw new Error(response.error || 'Translation failed')
      }
    } catch (error) {
      console.error('Translation error:', error)
      const content = popup.querySelector('.wxt-translation-content') as HTMLElement
      const title = popup.querySelector('.wxt-translation-title') as HTMLElement
      const theme = detectPageTheme()
      const isLight = theme === 'light'

      title.textContent = 'Translation Failed'
      content.innerHTML = `
          <div class="wxt-error-message">Translation service is temporarily unavailable, please try again later</div>
        `

      const errorMsg = content.querySelector('.wxt-error-message') as HTMLElement
      errorMsg.style.cssText = `
          color: ${isLight ? '#e74c3c' : '#ff6b6b'};
          font-size: 13px;
          line-height: 1.4;
        `
    }
  }

  function hideTranslationPopup() {
    if (translationPopup) {
      isClosing = true
      translationPopup.remove()
      translationPopup = null

      // Reset the closing flag after a short delay to allow for any pending events
      setTimeout(() => {
        isClosing = false
      }, 100)
    }
  }

  // Hide popup when clicking elsewhere on the page
  document.addEventListener('click', event => {
    // Don't hide if extension is not initialized, we're already closing or if no popup exists
    if (!isExtensionInitialized || isClosing || !translationPopup) {
      return
    }

    // Don't hide if clicking on the popup itself
    if (translationPopup.contains(event.target as Node)) {
      return
    }

    // Hide the popup
    hideTranslationPopup()
  })
}

// Cleanup extension functionality
function cleanupExtension() {
  // Remove any existing popup
  if (translationPopup) {
    translationPopup.remove()
    translationPopup = null
  }

  // Reset state variables
  currentSelection = null
  isClosing = false

  // Note: Event listeners will remain but will be inactive due to the initialization check
  console.log('Extension cleanup completed for domain:', window.location.hostname)
}
