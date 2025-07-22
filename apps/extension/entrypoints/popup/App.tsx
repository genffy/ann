import { useState } from 'react'
import './App.css'

function App() {
  const [activeItem, setActiveItem] = useState<string | null>(null)

  const handleSettingsClick = () => {
    // Open options page in a new tab
    chrome.tabs.create({
      url: chrome.runtime.getURL('options.html')
    }).finally(() => {
      window.close()
    })
  }

  const menuItems = [
    {
      id: 'settings',
      label: '设置 Settings',
      icon: '⚙️',
      description: '配置翻译插件设置',
      onClick: handleSettingsClick
    }
  ]

  return (
    <div className="popup-container">
      <header className="popup-header">
        <h1>文本翻译</h1>
        <p>Text Translation</p>
      </header>

      <nav className="popup-nav">
        {menuItems.map((item) => (
          <button
            key={item.id}
            className={`nav-item ${activeItem === item.id ? 'active' : ''}`}
            onClick={() => {
              setActiveItem(item.id)
              item.onClick()
            }}
            onMouseEnter={() => setActiveItem(item.id)}
            onMouseLeave={() => setActiveItem(null)}
          >
            <div className="nav-item-icon">{item.icon}</div>
            <div className="nav-item-content">
              <div className="nav-item-label">{item.label}</div>
              <div className="nav-item-description">{item.description}</div>
            </div>
            <div className="nav-item-arrow">→</div>
          </button>
        ))}
      </nav>

      <footer className="popup-footer">
        <p>点击选中文本即可翻译</p>
      </footer>
    </div>
  )
}

export default App
