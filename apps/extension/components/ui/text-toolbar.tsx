import React from 'react'
import { TextSelection } from '../../lib/store'

interface TextToolbarProps {
    selection: TextSelection | null
    onTranslate: () => void
    onAddNote: () => void
    onShare: () => void
    onClose: () => void
}

export const TextToolbar: React.FC<TextToolbarProps> = ({
    selection,
    onTranslate,
    onAddNote,
    onShare,
    onClose
}) => {
    if (!selection) {
        return null
    }

    return (
        <div
            className="ann-text-toolbar"
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '8px',
                backgroundColor: 'white',
                border: '1px solid #e1e5e9',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                fontSize: '14px',
                zIndex: 10000,
                pointerEvents: 'auto'
            }}
        >
            {/* 翻译按钮 */}
            <button
                onClick={onTranslate}
                title="翻译"
                style={{
                    width: '32px',
                    height: '32px',
                    border: 'none',
                    borderRadius: '6px',
                    backgroundColor: '#f8f9fa',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '16px',
                    transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#e9ecef'
                    e.currentTarget.style.transform = 'scale(1.05)'
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#f8f9fa'
                    e.currentTarget.style.transform = 'scale(1)'
                }}
            >
                🌐
            </button>

            {/* 备注按钮 */}
            <button
                onClick={onAddNote}
                title="添加备注"
                style={{
                    width: '32px',
                    height: '32px',
                    border: 'none',
                    borderRadius: '6px',
                    backgroundColor: '#f8f9fa',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '16px',
                    transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#e9ecef'
                    e.currentTarget.style.transform = 'scale(1.05)'
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#f8f9fa'
                    e.currentTarget.style.transform = 'scale(1)'
                }}
            >
                📝
            </button>

            {/* 分享按钮 */}
            <button
                onClick={onShare}
                title="分享"
                style={{
                    width: '32px',
                    height: '32px',
                    border: 'none',
                    borderRadius: '6px',
                    backgroundColor: '#f8f9fa',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '16px',
                    transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#e9ecef'
                    e.currentTarget.style.transform = 'scale(1.05)'
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#f8f9fa'
                    e.currentTarget.style.transform = 'scale(1)'
                }}
            >
                📷
            </button>

            {/* 关闭按钮 */}
            <button
                onClick={onClose}
                title="关闭"
                style={{
                    width: '32px',
                    height: '32px',
                    border: 'none',
                    borderRadius: '6px',
                    backgroundColor: '#f8f9fa',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '14px',
                    transition: 'all 0.15s ease',
                    marginLeft: '4px'
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#e9ecef'
                    e.currentTarget.style.transform = 'scale(1.05)'
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#f8f9fa'
                    e.currentTarget.style.transform = 'scale(1)'
                }}
            >
                ✕
            </button>
        </div>
    )
}

export default TextToolbar 