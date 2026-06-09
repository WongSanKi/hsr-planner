import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { getUserData, setUserData } from '../utils/storage'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Table } from '@tiptap/extension-table'
import { TableRow } from '@tiptap/extension-table-row'
import { TableCell } from '@tiptap/extension-table-cell'
import { TableHeader } from '@tiptap/extension-table-header'
import { Underline } from '@tiptap/extension-underline'
import { TextAlign } from '@tiptap/extension-text-align'
import { Placeholder } from '@tiptap/extension-placeholder'
import { Highlight } from '@tiptap/extension-highlight'
import { TextStyle } from '@tiptap/extension-text-style'
import { Color } from '@tiptap/extension-color'
import './Scratchpad.css'

const getDefaultNotes = () => [
  {
    id: '1',
    title: '草稿紙 1',
    content: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
]

export default function Scratchpad() {
  const { user } = useAuth()

  const STORAGE_KEY = `hsr_${user?.id || 'default'}_scratchpad`

  const [notes, setNotes] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) return JSON.parse(saved)
    } catch (e) {}
    return getDefaultNotes()
  })
  
  const [currentNoteId, setCurrentNoteId] = useState(notes[0]?.id || '1')
  const [lastSaved, setLastSaved] = useState(null)
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [renamingNoteId, setRenamingNoteId] = useState(null)
  const [renamingSidebarTitle, setRenamingSidebarTitle] = useState('')

  const currentNote = notes.find(n => n.id === currentNoteId) || notes[0]

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Placeholder.configure({ placeholder: '開始輸入內容...' }),
      Highlight,
      TextStyle,
      Color,
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
    ],
    content: currentNote?.content || '',
    onUpdate: ({ editor }) => {
      setNotes(prev => prev.map(note =>
        note.id === currentNoteId
          ? { ...note, content: editor.getHTML(), updatedAt: new Date().toISOString() }
          : note
      ))
    },
  })

  useEffect(() => {
    if (editor && currentNote) {
      const currentContent = editor.getHTML()
      if (currentContent !== currentNote.content) {
        editor.commands.setContent(currentNote.content || '')
      }
    }
  }, [currentNoteId, editor])

  const handleSave = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notes))
    } catch (e) {}
    setLastSaved(new Date().toISOString())
  }, [notes, STORAGE_KEY])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        handleSave()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleSave])

  const handleAddNote = () => {
    const newNote = {
      id: Date.now().toString(),
      title: `草稿紙 ${notes.length + 1}`,
      content: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    setNotes(prev => [...prev, newNote])
    setCurrentNoteId(newNote.id)
    if (editor) {
      editor.commands.setContent('')
    }
  }

  const handleDeleteNote = (noteId) => {
    if (notes.length <= 1) return
    const newNotes = notes.filter(n => n.id !== noteId)
    setNotes(newNotes)
    if (currentNoteId === noteId) {
      setCurrentNoteId(newNotes[0].id)
      if (editor) {
        editor.commands.setContent(newNotes[0].content || '')
      }
    }
  }

  const handleStartRename = () => {
    setEditTitle(currentNote.title)
    setIsEditingTitle(true)
  }

  const handleRenameConfirm = () => {
    if (editTitle.trim()) {
      setNotes(prev => prev.map(note =>
        note.id === currentNoteId
          ? { ...note, title: editTitle.trim() }
          : note
      ))
    }
    setIsEditingTitle(false)
  }

  const handleRenameKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleRenameConfirm()
    } else if (e.key === 'Escape') {
      setIsEditingTitle(false)
    }
  }

  const handleStartSidebarRename = (e, noteId) => {
    e.stopPropagation()
    const note = notes.find(n => n.id === noteId)
    setRenamingNoteId(noteId)
    setRenamingSidebarTitle(note?.title || '')
  }

  const handleSidebarRenameConfirm = () => {
    if (renamingSidebarTitle.trim()) {
      setNotes(prev => prev.map(note =>
        note.id === renamingNoteId
          ? { ...note, title: renamingSidebarTitle.trim() }
          : note
      ))
    }
    setRenamingNoteId(null)
  }

  const handleSidebarRenameKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSidebarRenameConfirm()
    } else if (e.key === 'Escape') {
      setRenamingNoteId(null)
    }
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return ''
    return new Date(dateStr).toLocaleString('zh-TW')
  }

  if (!editor) return null

  return (
    <div className="scratchpad-page">
      <div className="scratchpad-layout">
        {/* 左側邊欄 */}
        <div className="scratchpad-sidebar">
          <div className="sidebar-header">
            <h3>草稿紙</h3>
            <button className="new-pad-btn" onClick={handleAddNote} title="新增草稿紙">+</button>
          </div>
          <div className="pad-list">
            {notes.map(note => (
              <div
                key={note.id}
                className={`pad-item ${note.id === currentNoteId ? 'active' : ''}`}
                onClick={() => {
                  if (renamingNoteId === note.id) return
                  setCurrentNoteId(note.id)
                  if (editor) {
                    editor.commands.setContent(note.content || '')
                  }
                }}
              >
                {renamingNoteId === note.id ? (
                  <input
                    type="text"
                    className="rename-input"
                    value={renamingSidebarTitle}
                    onChange={(e) => setRenamingSidebarTitle(e.target.value)}
                    onBlur={handleSidebarRenameConfirm}
                    onKeyDown={handleSidebarRenameKeyDown}
                    autoFocus
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <>
                    <span className="pad-title">{note.title}</span>
                    <button
                      className="delete-pad-btn"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleStartSidebarRename(e, note.id)
                      }}
                      title="重命名"
                      style={{ opacity: 0.5, fontSize: '0.75rem' }}
                    >
                      ✎
                    </button>
                    {notes.length > 1 && (
                      <button
                        className="delete-pad-btn"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteNote(note.id)
                        }}
                        title="刪除"
                      >
                        ×
                      </button>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 右側主區域 */}
        <div className="scratchpad-main">
          <div className="scratchpad-header">
            <div className="pad-info">
              {isEditingTitle ? (
                <input
                  type="text"
                  className="rename-input"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  onBlur={handleRenameConfirm}
                  onKeyDown={handleRenameKeyDown}
                  autoFocus
                  style={{ fontSize: '1.1rem', fontWeight: 600, width: '200px' }}
                />
              ) : (
                <span
                  className="current-pad-title"
                  onClick={handleStartRename}
                  style={{ cursor: 'text' }}
                  title="點擊重命名"
                >
                  {currentNote.title}
                </span>
              )}
              <span className="pad-updated">編輯於 {formatDate(currentNote.updatedAt)}</span>
            </div>
            <div className="header-actions">
              {lastSaved && (
                <span className="last-saved">上次儲存：{formatDate(lastSaved)}</span>
              )}
              <button className="save-btn has-changes" onClick={handleSave}>
                💾 儲存
              </button>
            </div>
          </div>

          {/* 工具列 */}
          <div className="scratchpad-toolbar">
            <div className="toolbar-group">
              <ToolbarBtn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="粗體"><b>B</b></ToolbarBtn>
              <ToolbarBtn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="斜體"><i>I</i></ToolbarBtn>
              <ToolbarBtn onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="底線"><u>U</u></ToolbarBtn>
              <ToolbarBtn onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} title="刪除線"><s>S</s></ToolbarBtn>
              <ToolbarBtn onClick={() => editor.chain().focus().toggleHighlight().run()} active={editor.isActive('highlight')} title="螢光筆">🖍</ToolbarBtn>
            </div>
            <div className="toolbar-divider" />
            <div className="toolbar-group">
              <ToolbarBtn onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive('heading', { level: 1 })} title="標題 1">H1</ToolbarBtn>
              <ToolbarBtn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} title="標題 2">H2</ToolbarBtn>
              <ToolbarBtn onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })} title="標題 3">H3</ToolbarBtn>
            </div>
            <div className="toolbar-divider" />
            <div className="toolbar-group">
              <ToolbarBtn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="項目符號">•−</ToolbarBtn>
              <ToolbarBtn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="編號列表">1.</ToolbarBtn>
              <ToolbarBtn onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} title="引用">"</ToolbarBtn>
            </div>
            <div className="toolbar-divider" />
            <div className="toolbar-group">
              <ToolbarBtn onClick={() => editor.chain().focus().setTextAlign('left').run()} active={editor.isActive({ textAlign: 'left' })} title="靠左">≡←</ToolbarBtn>
              <ToolbarBtn onClick={() => editor.chain().focus().setTextAlign('center').run()} active={editor.isActive({ textAlign: 'center' })} title="置中">≡↔</ToolbarBtn>
              <ToolbarBtn onClick={() => editor.chain().focus().setTextAlign('right').run()} active={editor.isActive({ textAlign: 'right' })} title="靠右">≡→</ToolbarBtn>
            </div>
            <div className="toolbar-divider" />
            <div className="toolbar-group">
              <ToolbarBtn onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()} title="插入表格">⊞</ToolbarBtn>
            </div>
            <div className="toolbar-divider" />
            <div className="toolbar-group">
              <ToolbarBtn onClick={() => editor.chain().focus().setHorizontalRule().run()} title="分隔線">─</ToolbarBtn>
              <ToolbarBtn onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive('code')} title="行內程式碼">{'</>'}</ToolbarBtn>
              <ToolbarBtn onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive('codeBlock')} title="程式碼區塊">{'{ }'}</ToolbarBtn>
            </div>
            <div className="toolbar-divider" />
            <div className="toolbar-group">
              <ToolbarBtn onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="復原">↩</ToolbarBtn>
              <ToolbarBtn onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="重做">↪</ToolbarBtn>
            </div>
          </div>

          {/* 編輯器 */}
          <div className="editor-wrapper">
            <div className="scratchpad-editor">
              <EditorContent editor={editor} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function ToolbarBtn({ children, onClick, active, disabled, title }) {
  return (
    <button
      className={`toolbar-btn ${active ? 'active' : ''}`}
      onClick={onClick}
      disabled={disabled}
      title={title}
    >
      {children}
    </button>
  )
}