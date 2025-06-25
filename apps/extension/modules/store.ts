import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { persist } from 'zustand/middleware'
import { NoteRecord } from '../types/note'

// 文本操作相关的状态类型
export interface TextSelection {
    text: string
    range: Range | null
    boundingRect: DOMRect | null
    timestamp: number
}

// 工具栏状态类型
export interface ToolbarState {
    isVisible: boolean
    position: { x: number; y: number }
    activeFeature: 'translation' | 'notes' | 'sharing' | null
}

// 翻译状态类型
export interface TranslationState {
    isLoading: boolean
    result: string | null
    error: string | null
    provider: string
}

// 备注状态类型（扩展版）
export interface NotesState {
    // 当前操作状态
    isLoading: boolean
    summary: string | null
    userComment: string
    error: string | null

    // 当前备注
    currentNote: NoteRecord | null

    // 备注列表和管理
    notesList: NoteRecord[]
    filteredNotes: NoteRecord[]

    // 搜索和过滤
    searchQuery: string
    filterStatus: 'all' | 'active' | 'archived' | 'deleted'
    filterTags: string[]

    // UI状态
    isNotesListVisible: boolean
    isNotesPanelVisible: boolean
    selectedNoteId: string | null

    // 回显和高亮
    highlightedNotes: Map<string, boolean>
    isHighlightingEnabled: boolean

    // 统计信息
    notesCount: {
        total: number
        active: number
        archived: number
        deleted: number
    }
}

// 分享状态类型
export interface SharingState {
    isCapturing: boolean
    capturedImage: string | null
    isEditing: boolean
    error: string | null
}

// 主要的应用状态接口
export interface AppState {
    // 文本选择相关
    currentSelection: TextSelection | null
    setCurrentSelection: (selection: TextSelection | null) => void

    // 工具栏状态
    toolbar: ToolbarState
    setToolbarVisible: (visible: boolean) => void
    setToolbarPosition: (position: { x: number; y: number }) => void
    setActiveFeature: (feature: ToolbarState['activeFeature']) => void

    // 翻译功能
    translation: TranslationState
    setTranslationLoading: (loading: boolean) => void
    setTranslationResult: (result: string | null) => void
    setTranslationError: (error: string | null) => void
    setTranslationProvider: (provider: string) => void

    // 备注功能（扩展版）
    notes: NotesState
    // 基础状态管理
    setNotesLoading: (loading: boolean) => void
    setNotesSummary: (summary: string | null) => void
    setNotesComment: (comment: string) => void
    setNotesError: (error: string | null) => void
    // 当前备注管理
    setCurrentNote: (note: NoteRecord | null) => void
    // 备注列表管理
    setNotesList: (notes: NoteRecord[]) => void
    addNote: (note: NoteRecord) => void
    updateNote: (noteId: string, updates: Partial<NoteRecord>) => void
    removeNote: (noteId: string) => void
    // 搜索和过滤
    setSearchQuery: (query: string) => void
    setFilterStatus: (status: NotesState['filterStatus']) => void
    setFilterTags: (tags: string[]) => void
    applyNotesFilter: () => void
    // UI状态管理
    setNotesListVisible: (visible: boolean) => void
    setNotesPanelVisible: (visible: boolean) => void
    setSelectedNoteId: (noteId: string | null) => void
    // 高亮状态管理
    setNoteHighlighted: (noteId: string, highlighted: boolean) => void
    setHighlightingEnabled: (enabled: boolean) => void
    clearAllHighlights: () => void
    // 统计更新
    updateNotesCount: () => void

    // 分享功能
    sharing: SharingState
    setSharingCapturing: (capturing: boolean) => void
    setSharingImage: (image: string | null) => void
    setSharingEditing: (editing: boolean) => void
    setSharingError: (error: string | null) => void

    // 重置所有状态
    resetAll: () => void
    resetNotesState: () => void
}

// 初始状态
const initialState = {
    currentSelection: null,
    toolbar: {
        isVisible: false,
        position: { x: 0, y: 0 },
        activeFeature: null as ToolbarState['activeFeature']
    },
    translation: {
        isLoading: false,
        result: null,
        error: null,
        provider: 'google'
    },
    notes: {
        // 当前操作状态
        isLoading: false,
        summary: null,
        userComment: '',
        error: null,

        // 当前备注
        currentNote: null,

        // 备注列表和管理
        notesList: [],
        filteredNotes: [],

        // 搜索和过滤
        searchQuery: '',
        filterStatus: 'all' as const,
        filterTags: [],

        // UI状态
        isNotesListVisible: false,
        isNotesPanelVisible: false,
        selectedNoteId: null,

        // 回显和高亮
        highlightedNotes: new Map<string, boolean>(),
        isHighlightingEnabled: true,

        // 统计信息
        notesCount: {
            total: 0,
            active: 0,
            archived: 0,
            deleted: 0
        }
    },
    sharing: {
        isCapturing: false,
        capturedImage: null,
        isEditing: false,
        error: null
    }
}

// 创建状态管理 store
export const useAppStore = create<AppState>()(
    devtools(
        persist(
            (set, get) => ({
                ...initialState,

                // 文本选择相关的 actions
                setCurrentSelection: (selection) =>
                    set({ currentSelection: selection }, false, 'setCurrentSelection'),

                // 工具栏相关的 actions
                setToolbarVisible: (visible) =>
                    set(
                        (state) => ({
                            toolbar: { ...state.toolbar, isVisible: visible }
                        }),
                        false,
                        'setToolbarVisible'
                    ),

                setToolbarPosition: (position) =>
                    set(
                        (state) => ({
                            toolbar: { ...state.toolbar, position }
                        }),
                        false,
                        'setToolbarPosition'
                    ),

                setActiveFeature: (activeFeature) =>
                    set(
                        (state) => ({
                            toolbar: { ...state.toolbar, activeFeature }
                        }),
                        false,
                        'setActiveFeature'
                    ),

                // 翻译相关的 actions
                setTranslationLoading: (isLoading) =>
                    set(
                        (state) => ({
                            translation: { ...state.translation, isLoading }
                        }),
                        false,
                        'setTranslationLoading'
                    ),

                setTranslationResult: (result) =>
                    set(
                        (state) => ({
                            translation: { ...state.translation, result }
                        }),
                        false,
                        'setTranslationResult'
                    ),

                setTranslationError: (error) =>
                    set(
                        (state) => ({
                            translation: { ...state.translation, error }
                        }),
                        false,
                        'setTranslationError'
                    ),

                setTranslationProvider: (provider) =>
                    set(
                        (state) => ({
                            translation: { ...state.translation, provider }
                        }),
                        false,
                        'setTranslationProvider'
                    ),

                // 备注相关的 actions（基础）
                setNotesLoading: (isLoading) =>
                    set(
                        (state) => ({
                            notes: { ...state.notes, isLoading }
                        }),
                        false,
                        'setNotesLoading'
                    ),

                setNotesSummary: (summary) =>
                    set(
                        (state) => ({
                            notes: { ...state.notes, summary }
                        }),
                        false,
                        'setNotesSummary'
                    ),

                setNotesComment: (userComment) =>
                    set(
                        (state) => ({
                            notes: { ...state.notes, userComment }
                        }),
                        false,
                        'setNotesComment'
                    ),

                setNotesError: (error) =>
                    set(
                        (state) => ({
                            notes: { ...state.notes, error }
                        }),
                        false,
                        'setNotesError'
                    ),

                // 备注相关的 actions（扩展）
                setCurrentNote: (currentNote) =>
                    set(
                        (state) => ({
                            notes: {
                                ...state.notes,
                                currentNote,
                                selectedNoteId: currentNote?.id || null
                            }
                        }),
                        false,
                        'setCurrentNote'
                    ),

                setNotesList: (notesList) =>
                    set(
                        (state) => {
                            const newState = {
                                notes: { ...state.notes, notesList }
                            }
                            return newState
                        },
                        false,
                        'setNotesList'
                    ),

                addNote: (note) =>
                    set(
                        (state) => {
                            const notesList = [...state.notes.notesList, note]
                            return {
                                notes: { ...state.notes, notesList }
                            }
                        },
                        false,
                        'addNote'
                    ),

                updateNote: (noteId, updates) =>
                    set(
                        (state) => {
                            const notesList = state.notes.notesList.map(note =>
                                note.id === noteId ? { ...note, ...updates } : note
                            )
                            const currentNote = state.notes.currentNote?.id === noteId
                                ? { ...state.notes.currentNote, ...updates }
                                : state.notes.currentNote

                            return {
                                notes: { ...state.notes, notesList, currentNote }
                            }
                        },
                        false,
                        'updateNote'
                    ),

                removeNote: (noteId) =>
                    set(
                        (state) => {
                            const notesList = state.notes.notesList.filter(note => note.id !== noteId)
                            const currentNote = state.notes.currentNote?.id === noteId ? null : state.notes.currentNote
                            const selectedNoteId = state.notes.selectedNoteId === noteId ? null : state.notes.selectedNoteId

                            return {
                                notes: {
                                    ...state.notes,
                                    notesList,
                                    currentNote,
                                    selectedNoteId
                                }
                            }
                        },
                        false,
                        'removeNote'
                    ),

                // 搜索和过滤
                setSearchQuery: (searchQuery) =>
                    set(
                        (state) => ({
                            notes: { ...state.notes, searchQuery }
                        }),
                        false,
                        'setSearchQuery'
                    ),

                setFilterStatus: (filterStatus) =>
                    set(
                        (state) => ({
                            notes: { ...state.notes, filterStatus }
                        }),
                        false,
                        'setFilterStatus'
                    ),

                setFilterTags: (filterTags) =>
                    set(
                        (state) => ({
                            notes: { ...state.notes, filterTags }
                        }),
                        false,
                        'setFilterTags'
                    ),

                applyNotesFilter: () =>
                    set(
                        (state) => {
                            const { notesList, searchQuery, filterStatus, filterTags } = state.notes

                            let filteredNotes = [...notesList]

                            // 按状态过滤
                            if (filterStatus !== 'all') {
                                filteredNotes = filteredNotes.filter(note => note.status === filterStatus)
                            }

                            // 按搜索查询过滤
                            if (searchQuery.trim()) {
                                const query = searchQuery.toLowerCase()
                                filteredNotes = filteredNotes.filter(note =>
                                    note.originalText.toLowerCase().includes(query) ||
                                    note.summary.toLowerCase().includes(query) ||
                                    note.userComment.toLowerCase().includes(query) ||
                                    note.metadata.pageTitle.toLowerCase().includes(query)
                                )
                            }

                            // 按标签过滤
                            if (filterTags.length > 0) {
                                filteredNotes = filteredNotes.filter(note =>
                                    filterTags.some(tag => note.tags.includes(tag))
                                )
                            }

                            return {
                                notes: { ...state.notes, filteredNotes }
                            }
                        },
                        false,
                        'applyNotesFilter'
                    ),

                // UI状态管理
                setNotesListVisible: (isNotesListVisible) =>
                    set(
                        (state) => ({
                            notes: { ...state.notes, isNotesListVisible }
                        }),
                        false,
                        'setNotesListVisible'
                    ),

                setNotesPanelVisible: (isNotesPanelVisible) =>
                    set(
                        (state) => ({
                            notes: { ...state.notes, isNotesPanelVisible }
                        }),
                        false,
                        'setNotesPanelVisible'
                    ),

                setSelectedNoteId: (selectedNoteId) =>
                    set(
                        (state) => ({
                            notes: { ...state.notes, selectedNoteId }
                        }),
                        false,
                        'setSelectedNoteId'
                    ),

                // 高亮状态管理
                setNoteHighlighted: (noteId, highlighted) =>
                    set(
                        (state) => {
                            const highlightedNotes = new Map(state.notes.highlightedNotes)
                            highlightedNotes.set(noteId, highlighted)
                            return {
                                notes: { ...state.notes, highlightedNotes }
                            }
                        },
                        false,
                        'setNoteHighlighted'
                    ),

                setHighlightingEnabled: (isHighlightingEnabled) =>
                    set(
                        (state) => ({
                            notes: { ...state.notes, isHighlightingEnabled }
                        }),
                        false,
                        'setHighlightingEnabled'
                    ),

                clearAllHighlights: () =>
                    set(
                        (state) => ({
                            notes: {
                                ...state.notes,
                                highlightedNotes: new Map<string, boolean>()
                            }
                        }),
                        false,
                        'clearAllHighlights'
                    ),

                // 统计更新
                updateNotesCount: () =>
                    set(
                        (state) => {
                            const { notesList } = state.notes
                            const notesCount = {
                                total: notesList.length,
                                active: notesList.filter(note => note.status === 'active').length,
                                archived: notesList.filter(note => note.status === 'archived').length,
                                deleted: notesList.filter(note => note.status === 'deleted').length
                            }

                            return {
                                notes: { ...state.notes, notesCount }
                            }
                        },
                        false,
                        'updateNotesCount'
                    ),

                // 分享相关的 actions
                setSharingCapturing: (isCapturing) =>
                    set(
                        (state) => ({
                            sharing: { ...state.sharing, isCapturing }
                        }),
                        false,
                        'setSharingCapturing'
                    ),

                setSharingImage: (capturedImage) =>
                    set(
                        (state) => ({
                            sharing: { ...state.sharing, capturedImage }
                        }),
                        false,
                        'setSharingImage'
                    ),

                setSharingEditing: (isEditing) =>
                    set(
                        (state) => ({
                            sharing: { ...state.sharing, isEditing }
                        }),
                        false,
                        'setSharingEditing'
                    ),

                setSharingError: (error) =>
                    set(
                        (state) => ({
                            sharing: { ...state.sharing, error }
                        }),
                        false,
                        'setSharingError'
                    ),

                // 重置操作
                resetAll: () => set(initialState, false, 'resetAll'),

                resetNotesState: () =>
                    set(
                        (state) => ({
                            notes: initialState.notes
                        }),
                        false,
                        'resetNotesState'
                    ),
            }),
            {
                name: 'ann-text-toolkit-store',
                // 只持久化部分状态，不包括临时状态
                partialize: (state) => ({
                    translation: {
                        provider: state.translation.provider
                    },
                    notes: {
                        userComment: state.notes.userComment,
                        isHighlightingEnabled: state.notes.isHighlightingEnabled,
                        filterStatus: state.notes.filterStatus,
                        filterTags: state.notes.filterTags
                    }
                })
            }
        ),
        { name: 'ANN Text Toolkit Store' }
    )
)

// 用于在 content script 中使用的轻量级状态管理
export interface ContentState {
    isInitialized: boolean
    isDomainAllowed: boolean
    lastSelection: TextSelection | null
}

// 便捷的状态选择器 hooks
export const useNotesState = () => useAppStore((state) => state.notes)
export const useToolbarState = () => useAppStore((state) => state.toolbar)
export const useTranslationState = () => useAppStore((state) => state.translation)
export const useSharingState = () => useAppStore((state) => state.sharing) 