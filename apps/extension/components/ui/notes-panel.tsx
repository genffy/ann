import React, { useState, useEffect, useCallback } from 'react'
import { useAppStore, useNotesState } from '../../lib/store'
import { NoteRecord } from '../../lib/helpers'
import { Button } from './button'

interface NotesPanelProps {
    isVisible: boolean
    onClose: () => void
    position?: { x: number; y: number }
}

/**
 * 备注面板组件
 * 显示当前备注的详细信息和编辑功能
 */
export const NotesPanel: React.FC<NotesPanelProps> = ({
    isVisible,
    onClose,
    position = { x: 0, y: 0 }
}) => {
    const notesState = useNotesState()
    const {
        setNotesComment,
        setNotesError,
        setCurrentNote,
        setNotesPanelVisible
    } = useAppStore()

    const [localComment, setLocalComment] = useState('')
    const [isSaving, setIsSaving] = useState(false)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

    const currentNote = notesState.currentNote

    // 同步本地评论状态
    useEffect(() => {
        if (currentNote) {
            setLocalComment(currentNote.userComment || '')
        }
    }, [currentNote])

    // 保存评论
    const handleSaveComment = useCallback(async () => {
        if (!currentNote || isSaving) return

        try {
            setIsSaving(true)
            setNotesError(null)

            // 通过事件系统调用插件方法
            const event = new CustomEvent('ann:save-note-comment', {
                detail: {
                    noteId: currentNote.id,
                    comment: localComment.trim()
                }
            })
            document.dispatchEvent(event)

            // 更新状态
            setNotesComment(localComment.trim())

        } catch (error) {
            console.error('[NotesPanel] Failed to save comment:', error)
            setNotesError(error instanceof Error ? error.message : '保存评论失败')
        } finally {
            setIsSaving(false)
        }
    }, [currentNote, localComment, isSaving, setNotesComment, setNotesError])

    // 删除备注
    const handleDeleteNote = useCallback(async () => {
        if (!currentNote) return

        try {
            setNotesError(null)

            // 触发删除事件
            const event = new CustomEvent('ann:delete-note', {
                detail: { noteId: currentNote.id }
            })
            document.dispatchEvent(event)

            // 关闭面板
            setShowDeleteConfirm(false)
            onClose()

        } catch (error) {
            console.error('[NotesPanel] Failed to delete note:', error)
            setNotesError(error instanceof Error ? error.message : '删除备注失败')
        }
    }, [currentNote, onClose, setNotesError])

    // 关闭面板
    const handleClose = useCallback(() => {
        setShowDeleteConfirm(false)
        onClose()
    }, [onClose])

    // 格式化时间
    const formatTime = (timestamp: number) => {
        return new Date(timestamp).toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    if (!isVisible || !currentNote) {
        return null
    }

    return (
        <div
            className="ann-notes-panel"
            style={{
                position: 'fixed',
                left: position.x,
                top: position.y,
                zIndex: 10000,
                minWidth: '320px',
                maxWidth: '480px',
                backgroundColor: 'white',
                border: '1px solid #e1e5e9',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                fontSize: '14px',
                color: '#24292e'
            }}
        >
            {/* 头部 */}
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    borderBottom: '1px solid #e1e5e9',
                    backgroundColor: '#f6f8fa'
                }}
            >
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>
                    备注详情
                </h3>
                <button
                    onClick={handleClose}
                    style={{
                        background: 'none',
                        border: 'none',
                        fontSize: '18px',
                        cursor: 'pointer',
                        color: '#586069',
                        padding: '4px'
                    }}
                >
                    ×
                </button>
            </div>

            {/* 内容区域 */}
            <div style={{ padding: '16px', maxHeight: '400px', overflowY: 'auto' }}>
                {/* 错误显示 */}
                {notesState.error && (
                    <div
                        style={{
                            backgroundColor: '#ffeef0',
                            border: '1px solid #fdaeb7',
                            borderRadius: '4px',
                            padding: '8px 12px',
                            marginBottom: '16px',
                            color: '#d1242f',
                            fontSize: '13px'
                        }}
                    >
                        {notesState.error}
                    </div>
                )}

                {/* 原始文本 */}
                <div style={{ marginBottom: '16px' }}>
                    <label style={{
                        display: 'block',
                        fontWeight: 600,
                        marginBottom: '8px',
                        color: '#24292e'
                    }}>
                        选中文本：
                    </label>
                    <div
                        style={{
                            backgroundColor: '#f6f8fa',
                            border: '1px solid #e1e5e9',
                            borderRadius: '4px',
                            padding: '12px',
                            fontSize: '13px',
                            lineHeight: '1.5',
                            maxHeight: '120px',
                            overflowY: 'auto'
                        }}
                    >
                        {currentNote.originalText}
                    </div>
                </div>

                {/* 摘要 */}
                {currentNote.summary && (
                    <div style={{ marginBottom: '16px' }}>
                        <label style={{
                            display: 'block',
                            fontWeight: 600,
                            marginBottom: '8px',
                            color: '#24292e'
                        }}>
                            智能摘要：
                        </label>
                        <div
                            style={{
                                backgroundColor: '#fff5b4',
                                border: '1px solid #d4ac0d',
                                borderRadius: '4px',
                                padding: '12px',
                                fontSize: '13px',
                                lineHeight: '1.5'
                            }}
                        >
                            {currentNote.summary}
                        </div>
                    </div>
                )}

                {/* 用户评论 */}
                <div style={{ marginBottom: '16px' }}>
                    <label style={{
                        display: 'block',
                        fontWeight: 600,
                        marginBottom: '8px',
                        color: '#24292e'
                    }}>
                        我的评论：
                    </label>
                    <textarea
                        value={localComment}
                        onChange={(e) => setLocalComment(e.target.value)}
                        placeholder="添加您的评论..."
                        style={{
                            width: '100%',
                            minHeight: '80px',
                            padding: '12px',
                            border: '1px solid #e1e5e9',
                            borderRadius: '4px',
                            fontSize: '13px',
                            lineHeight: '1.5',
                            resize: 'vertical',
                            fontFamily: 'inherit',
                            outline: 'none'
                        }}
                        onFocus={(e) => {
                            e.target.style.borderColor = '#0366d6'
                            e.target.style.boxShadow = '0 0 0 3px rgba(3, 102, 214, 0.1)'
                        }}
                        onBlur={(e) => {
                            e.target.style.borderColor = '#e1e5e9'
                            e.target.style.boxShadow = 'none'
                        }}
                    />
                </div>

                {/* 元信息 */}
                <div style={{ marginBottom: '16px' }}>
                    <div
                        style={{
                            fontSize: '12px',
                            color: '#586069',
                            padding: '8px 0',
                            borderTop: '1px solid #e1e5e9'
                        }}
                    >
                        <div style={{ marginBottom: '4px' }}>
                            创建时间: {formatTime(currentNote.timestamp)}
                        </div>
                        {currentNote.lastModified !== currentNote.timestamp && (
                            <div style={{ marginBottom: '4px' }}>
                                更新时间: {formatTime(currentNote.lastModified)}
                            </div>
                        )}
                        <div>
                            页面: {currentNote.metadata.pageTitle || '未知页面'}
                        </div>
                    </div>
                </div>

                {/* 操作按钮 */}
                <div style={{
                    display: 'flex',
                    gap: '8px',
                    justifyContent: 'flex-end',
                    paddingTop: '16px',
                    borderTop: '1px solid #e1e5e9'
                }}>
                    {!showDeleteConfirm ? (
                        <>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowDeleteConfirm(true)}
                                style={{ color: '#d73a49' }}
                            >
                                删除
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleClose}
                            >
                                取消
                            </Button>
                            <Button
                                size="sm"
                                onClick={handleSaveComment}
                                disabled={isSaving}
                                style={{
                                    backgroundColor: isSaving ? '#94d3a2' : '#28a745',
                                    color: 'white'
                                }}
                            >
                                {isSaving ? '保存中...' : '保存'}
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowDeleteConfirm(false)}
                            >
                                取消
                            </Button>
                            <Button
                                size="sm"
                                onClick={handleDeleteNote}
                                style={{ backgroundColor: '#d73a49', color: 'white' }}
                            >
                                确认删除
                            </Button>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}

/**
 * 备注列表项组件
 */
interface NoteListItemProps {
    note: NoteRecord
    isSelected: boolean
    onClick: (note: NoteRecord) => void
    onDelete: (noteId: string) => void
}

export const NoteListItem: React.FC<NoteListItemProps> = ({
    note,
    isSelected,
    onClick,
    onDelete
}) => {
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

    const handleClick = () => {
        onClick(note)
    }

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation()
        if (showDeleteConfirm) {
            onDelete(note.id)
            setShowDeleteConfirm(false)
        } else {
            setShowDeleteConfirm(true)
        }
    }

    const formatTime = (timestamp: number) => {
        const now = Date.now()
        const diff = now - timestamp
        const minutes = Math.floor(diff / 60000)
        const hours = Math.floor(diff / 3600000)
        const days = Math.floor(diff / 86400000)

        if (days > 0) return `${days}天前`
        if (hours > 0) return `${hours}小时前`
        if (minutes > 0) return `${minutes}分钟前`
        return '刚刚'
    }

    return (
        <div
            onClick={handleClick}
            style={{
                padding: '12px',
                borderBottom: '1px solid #e1e5e9',
                cursor: 'pointer',
                backgroundColor: isSelected ? '#f1f8ff' : 'transparent',
                borderLeft: isSelected ? '3px solid #0366d6' : '3px solid transparent'
            }}
            onMouseEnter={(e) => {
                if (!isSelected) {
                    e.currentTarget.style.backgroundColor = '#f6f8fa'
                }
            }}
            onMouseLeave={(e) => {
                if (!isSelected) {
                    e.currentTarget.style.backgroundColor = 'transparent'
                }
            }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                    {/* 摘要或原始文本 */}
                    <div
                        style={{
                            fontSize: '13px',
                            fontWeight: 500,
                            color: '#24292e',
                            marginBottom: '4px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                        }}
                    >
                        {note.summary || note.originalText.substring(0, 50)}
                    </div>

                    {/* 用户评论预览 */}
                    {note.userComment && (
                        <div
                            style={{
                                fontSize: '12px',
                                color: '#586069',
                                marginBottom: '4px',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                            }}
                        >
                            {note.userComment}
                        </div>
                    )}

                    {/* 时间和页面信息 */}
                    <div
                        style={{
                            fontSize: '11px',
                            color: '#959da5',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}
                    >
                        <span>{formatTime(note.lastModified)}</span>
                        <span>•</span>
                        <span
                            style={{
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                maxWidth: '150px'
                            }}
                        >
                            {note.metadata.pageTitle || '未知页面'}
                        </span>
                    </div>
                </div>

                {/* 删除按钮 */}
                <button
                    onClick={handleDelete}
                    style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: showDeleteConfirm ? '#d73a49' : '#959da5',
                        padding: '4px',
                        fontSize: '12px',
                        marginLeft: '8px'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.color = '#d73a49'
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.color = showDeleteConfirm ? '#d73a49' : '#959da5'
                    }}
                >
                    {showDeleteConfirm ? '确认' : '删除'}
                </button>
            </div>
        </div>
    )
}

/**
 * 备注列表组件
 */
interface NotesListProps {
    isVisible: boolean
    onClose: () => void
    position?: { x: number; y: number }
}

export const NotesList: React.FC<NotesListProps> = ({
    isVisible,
    onClose,
    position = { x: 0, y: 0 }
}) => {
    const notesState = useNotesState()
    const {
        setSearchQuery,
        setFilterStatus,
        applyNotesFilter,
        setCurrentNote,
        setSelectedNoteId,
        setNotesPanelVisible
    } = useAppStore()

    const [localSearchQuery, setLocalSearchQuery] = useState(notesState.searchQuery)

    // 搜索处理
    const handleSearch = useCallback((query: string) => {
        setLocalSearchQuery(query)
        setSearchQuery(query)
        applyNotesFilter()
    }, [setSearchQuery, applyNotesFilter])

    // 过滤状态处理
    const handleFilterChange = useCallback((status: typeof notesState.filterStatus) => {
        setFilterStatus(status)
        applyNotesFilter()
    }, [setFilterStatus, applyNotesFilter])

    // 选择备注
    const handleNoteSelect = useCallback((note: NoteRecord) => {
        setCurrentNote(note)
        setSelectedNoteId(note.id)
        setNotesPanelVisible(true)
    }, [setCurrentNote, setSelectedNoteId, setNotesPanelVisible])

    // 删除备注
    const handleNoteDelete = useCallback((noteId: string) => {
        const event = new CustomEvent('ann:delete-note', {
            detail: { noteId }
        })
        document.dispatchEvent(event)
    }, [])

    if (!isVisible) {
        return null
    }

    return (
        <div
            className="ann-notes-list"
            style={{
                position: 'fixed',
                left: position.x,
                top: position.y,
                zIndex: 10000,
                width: '360px',
                maxHeight: '500px',
                backgroundColor: 'white',
                border: '1px solid #e1e5e9',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                fontSize: '14px',
                color: '#24292e',
                display: 'flex',
                flexDirection: 'column'
            }}
        >
            {/* 头部 */}
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    borderBottom: '1px solid #e1e5e9',
                    backgroundColor: '#f6f8fa'
                }}
            >
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>
                    我的备注 ({notesState.notesCount.total})
                </h3>
                <button
                    onClick={onClose}
                    style={{
                        background: 'none',
                        border: 'none',
                        fontSize: '18px',
                        cursor: 'pointer',
                        color: '#586069',
                        padding: '4px'
                    }}
                >
                    ×
                </button>
            </div>

            {/* 搜索和过滤 */}
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #e1e5e9' }}>
                {/* 搜索框 */}
                <input
                    type="text"
                    placeholder="搜索备注..."
                    value={localSearchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: '1px solid #e1e5e9',
                        borderRadius: '4px',
                        fontSize: '13px',
                        marginBottom: '8px',
                        outline: 'none'
                    }}
                    onFocus={(e) => {
                        e.target.style.borderColor = '#0366d6'
                        e.target.style.boxShadow = '0 0 0 3px rgba(3, 102, 214, 0.1)'
                    }}
                    onBlur={(e) => {
                        e.target.style.borderColor = '#e1e5e9'
                        e.target.style.boxShadow = 'none'
                    }}
                />

                {/* 过滤按钮 */}
                <div style={{ display: 'flex', gap: '4px' }}>
                    {[
                        { key: 'all', label: '全部', count: notesState.notesCount.total },
                        { key: 'active', label: '活跃', count: notesState.notesCount.active },
                        { key: 'archived', label: '归档', count: notesState.notesCount.archived }
                    ].map(({ key, label, count }) => (
                        <button
                            key={key}
                            onClick={() => handleFilterChange(key as any)}
                            style={{
                                padding: '4px 8px',
                                border: '1px solid #e1e5e9',
                                borderRadius: '4px',
                                fontSize: '12px',
                                cursor: 'pointer',
                                backgroundColor: notesState.filterStatus === key ? '#0366d6' : 'white',
                                color: notesState.filterStatus === key ? 'white' : '#586069'
                            }}
                        >
                            {label} ({count})
                        </button>
                    ))}
                </div>
            </div>

            {/* 备注列表 */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
                {notesState.filteredNotes.length === 0 ? (
                    <div
                        style={{
                            padding: '32px 16px',
                            textAlign: 'center',
                            color: '#586069',
                            fontSize: '13px'
                        }}
                    >
                        {notesState.searchQuery ? '没有找到匹配的备注' : '还没有备注'}
                    </div>
                ) : (
                    notesState.filteredNotes.map((note) => (
                        <NoteListItem
                            key={note.id}
                            note={note}
                            isSelected={note.id === notesState.selectedNoteId}
                            onClick={handleNoteSelect}
                            onDelete={handleNoteDelete}
                        />
                    ))
                )}
            </div>
        </div>
    )
} 