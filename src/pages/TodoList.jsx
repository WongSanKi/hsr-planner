import { useState, useEffect } from 'react'
import { useSingleRowData } from '../hooks/useSupabaseData'
import './TodoList.css'

const DEFAULT_COLUMNS = ['欄位1', '欄位2', '欄位3', '欄位4', '欄位5', '欄位6']

export default function TodoList() {
  const { data, loading, saving, lastSaved, error, saveData } = useSingleRowData('todo_list')

  const [columns, setColumns] = useState(DEFAULT_COLUMNS)
  const [rows, setRows] = useState([])
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    if (data) {
      if (data.columns) setColumns(data.columns)
      if (data.rows) {
        setRows(data.rows)
      } else {
        setRows([{ id: Date.now(), event: '', cells: Array(DEFAULT_COLUMNS.length).fill(false) }])
      }
    }
  }, [data])

  // 編輯欄位名稱
  const updateColumn = (index, value) => {
    const newColumns = [...columns]
    newColumns[index] = value
    setColumns(newColumns)
    setHasChanges(true)
  }

  // 新增一行
  const addRow = () => {
    const newRow = { id: Date.now(), event: '', cells: Array(columns.length).fill(false) }
    setRows([...rows, newRow])
    setHasChanges(true)
  }

  // 刪除一行
  const deleteRow = (rowId) => {
    if (rows.length <= 1) return
    setRows(rows.filter(r => r.id !== rowId))
    setHasChanges(true)
  }

  // 編輯事件名稱
  const updateEvent = (rowId, value) => {
    setRows(rows.map(r => r.id === rowId ? { ...r, event: value } : r))
    setHasChanges(true)
  }

  // 切換勾選
  const toggleCell = (rowId, colIndex) => {
    setRows(rows.map(r => {
      if (r.id !== rowId) return r
      const newCells = [...r.cells]
      newCells[colIndex] = !newCells[colIndex]
      return { ...r, cells: newCells }
    }))
    setHasChanges(true)
  }

  // 新增欄位
  const addColumn = () => {
    setColumns([...columns, `欄位${columns.length + 1}`])
    setRows(rows.map(r => ({ ...r, cells: [...r.cells, false] })))
    setHasChanges(true)
  }

  // 刪除最後一個欄位
  const removeColumn = () => {
    if (columns.length <= 1) return
    setColumns(columns.slice(0, -1))
    setRows(rows.map(r => ({ ...r, cells: r.cells.slice(0, -1) })))
    setHasChanges(true)
  }

  // 儲存
  const handleSave = async () => {
    await saveData({ columns, rows })
    setHasChanges(false)
  }

  // 格式化時間
  const formatTime = (isoString) => {
    if (!isoString) return ''
    const d = new Date(isoString)
    return d.toLocaleString('zh-TW', {
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // 計算進度
  const getProgress = (row) => {
    const done = row.cells.filter(c => c).length
    return `${done}/${row.cells.length}`
  }

  if (loading) {
    return <div className="page-container"><div className="loading-screen">載入中...</div></div>
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">📋 To-Do List</h1>
        <div className="header-actions">
          {lastSaved && (
            <span className="last-saved">上次儲存：{formatTime(lastSaved)}</span>
          )}
          <button
            className="btn-save"
            onClick={handleSave}
            disabled={saving || !hasChanges}
          >
            {saving ? '儲存中...' : hasChanges ? '💾 儲存' : '已儲存 ✓'}
          </button>
        </div>
      </div>

      {error && <div className="error-banner">⚠️ {error}</div>}

      {/* 欄位管理 */}
      <div className="column-controls">
        <button className="btn-col" onClick={addColumn}>＋ 新增欄位</button>
        <button className="btn-col btn-col-danger" onClick={removeColumn} disabled={columns.length <= 1}>
          － 移除最後欄位
        </button>
        <span className="col-count">目前 {columns.length} 欄</span>
      </div>

      <div className="todo-table-container">
        <table className="todo-table">
          <thead>
            <tr>
              <th className="th-event">事件</th>
              {columns.map((col, i) => (
                <th key={i} className="th-account">
                  <input
                    type="text"
                    className="column-name-input"
                    value={col}
                    onChange={(e) => updateColumn(i, e.target.value)}
                    placeholder={`欄位${i + 1}`}
                  />
                </th>
              ))}
              <th className="th-progress">進度</th>
              <th className="th-actions">操作</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const allDone = row.cells.length > 0 && row.cells.every(c => c)
              return (
                <tr key={row.id} className={allDone ? 'row-complete' : ''}>
                  <td className="td-event">
                    <input
                      type="text"
                      className="event-input"
                      value={row.event}
                      onChange={(e) => updateEvent(row.id, e.target.value)}
                      placeholder="輸入事件..."
                    />
                  </td>
                  {row.cells.map((checked, colIndex) => (
                    <td key={colIndex} className="td-cell">
                      <button
                        className={`cell-checkbox ${checked ? 'checked' : ''}`}
                        onClick={() => toggleCell(row.id, colIndex)}
                      >
                        {checked ? '✅' : ''}
                      </button>
                    </td>
                  ))}
                  <td className="td-progress">
                    <span className={`progress-text ${allDone ? 'progress-done' : ''}`}>
                      {getProgress(row)}
                    </span>
                  </td>
                  <td className="td-actions">
                    <button
                      className="btn-icon btn-delete"
                      onClick={() => deleteRow(row.id)}
                      title="刪除此行"
                      disabled={rows.length <= 1}
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <button className="btn-add-row" onClick={addRow}>
        ＋ 新增事件
      </button>
    </div>
  )
}