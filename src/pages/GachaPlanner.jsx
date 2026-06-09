import { useState, useEffect, useRef } from 'react'
import { useSingleRowData } from '../hooks/useSupabaseData'
import './GachaPlanner.css'
import { useAuth } from '../contexts/AuthContext'
import { getUserData, setUserData } from '../utils/storage'

const HIGHLIGHT_COLORS = [
  { value: 'none', label: '無', color: 'transparent' },
  { value: 'green', label: '夯', color: 'rgba(34, 197, 94, 0.25)' },
  { value: 'yellow', label: '頂級', color: 'rgba(49, 117, 244, 0.25)' },
  { value: 'red', label: '人上人', color: 'rgba(255, 251, 0, 0.25)' },
  { value: 'blue', label: 'NPC', color: 'rgba(243, 167, 15, 0.25)' },
  { value: 'purple', label: '拉完了', color: 'rgba(255, 0, 0, 0.25)' },
]

const DEFAULT_ROWS = 10
const DEFAULT_COLS = 7

function createEmptyGrid(rowCount, colCount) {
  return Array.from({ length: rowCount }, () =>
    Array.from({ length: colCount }, () => ({ text: '', highlight: 'none' }))
  )
}

export default function GachaPlanner() {
  const { data, loading, saving, lastSaved, error, saveData } = useSingleRowData('gacha_plans')

  const [grid, setGrid] = useState(createEmptyGrid(DEFAULT_ROWS, DEFAULT_COLS))
  const [hasChanges, setHasChanges] = useState(false)
  const [activeColor, setActiveColor] = useState('none')
  const [colorPickerCell, setColorPickerCell] = useState(null) // {row, col}
  const [isColorMode, setIsColorMode] = useState(false)

  const tableRef = useRef(null)

  useEffect(() => {
    if (data && data.grid) {
      setGrid(data.grid)
    }
  }, [data])

  // 關閉顏色選擇器
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (colorPickerCell && !e.target.closest('.color-picker-popup')) {
        setColorPickerCell(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [colorPickerCell])

  // 更新格子文字
  const updateCell = (row, col, text) => {
    const newGrid = grid.map((r, ri) =>
      r.map((c, ci) => (ri === row && ci === col ? { ...c, text } : c))
    )
    setGrid(newGrid)
    setHasChanges(true)
  }

  // 設定格子顏色
  const setCellColor = (row, col, color) => {
    const newGrid = grid.map((r, ri) =>
      r.map((c, ci) => (ri === row && ci === col ? { ...c, highlight: color } : c))
    )
    setGrid(newGrid)
    setHasChanges(true)
    setColorPickerCell(null)
  }

  // 螢光筆模式下點擊直接上色
  const handleCellClick = (row, col, e) => {
    if (isColorMode) {
      e.preventDefault()
      setCellColor(row, col, activeColor)
    }
  }

  // 右鍵呼出顏色選擇器
  const handleContextMenu = (e, row, col) => {
    e.preventDefault()
    setColorPickerCell({ row, col, x: e.clientX, y: e.clientY })
  }

  // 新增一行
  const addRow = () => {
    const colCount = grid[0]?.length || DEFAULT_COLS
    setGrid([...grid, Array.from({ length: colCount }, () => ({ text: '', highlight: 'none' }))])
    setHasChanges(true)
  }

  // 刪除最後一行
  const removeRow = () => {
    if (grid.length <= 1) return
    setGrid(grid.slice(0, -1))
    setHasChanges(true)
  }

  // 新增一欄
  const addCol = () => {
    setGrid(grid.map(row => [...row, { text: '', highlight: 'none' }]))
    setHasChanges(true)
  }

  // 刪除最後一欄
  const removeCol = () => {
    if (grid[0]?.length <= 1) return
    setGrid(grid.map(row => row.slice(0, -1)))
    setHasChanges(true)
  }

  // 儲存
  const handleSave = async () => {
    await saveData({ grid })
    setHasChanges(false)
  }

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

  if (loading) {
    return <div className="page-container"><div className="loading-screen">載入中...</div></div>
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">🎰 抽卡規劃</h1>
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

      {/* 工具列 */}
      <div className="gacha-toolbar">
        <div className="toolbar-section">
          <button className="btn-col" onClick={addRow}>＋ 行</button>
          <button className="btn-col btn-col-danger" onClick={removeRow} disabled={grid.length <= 1}>－ 行</button>
          <button className="btn-col" onClick={addCol}>＋ 欄</button>
          <button className="btn-col btn-col-danger" onClick={removeCol} disabled={grid[0]?.length <= 1}>－ 欄</button>
          <span className="col-count">{grid.length} × {grid[0]?.length || 0}</span>
        </div>

        <div className="toolbar-divider" />

        <div className="toolbar-section">
          <button
            className={`btn-color-mode ${isColorMode ? 'active' : ''}`}
            onClick={() => setIsColorMode(!isColorMode)}
          >
            🖍️ 螢光筆 {isColorMode ? 'ON' : 'OFF'}
          </button>
          {isColorMode && (
            <div className="color-palette">
              {HIGHLIGHT_COLORS.map(c => (
                <button
                  key={c.value}
                  className={`palette-dot ${activeColor === c.value ? 'active' : ''}`}
                  style={{ background: c.value === 'none' ? '#555' : c.color.replace('0.25', '0.8') }}
                  onClick={() => setActiveColor(c.value)}
                  title={c.label}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 圖例 */}
      <div className="color-legend">
        {HIGHLIGHT_COLORS.filter(c => c.value !== 'none').map(c => (
          <span key={c.value} className="legend-item">
            <span className="legend-dot" style={{ background: c.color.replace('0.25', '0.7') }} />
            {c.label}
          </span>
        ))}
        <span className="legend-hint">（右鍵格子可選色 / 開啟螢光筆點擊直接上色）</span>
      </div>

      {/* 表格 */}
      <div className="gacha-table-container" ref={tableRef}>
        <table className="gacha-table">
          <tbody>
            {grid.map((row, ri) => (
              <tr key={ri}>
                {row.map((cell, ci) => {
                  const bgColor = HIGHLIGHT_COLORS.find(c => c.value === cell.highlight)?.color || 'transparent'
                  return (
                    <td
                      key={ci}
                      className={`gacha-cell ${isColorMode ? 'color-mode' : ''}`}
                      style={{ backgroundColor: bgColor }}
                      onClick={(e) => handleCellClick(ri, ci, e)}
                      onContextMenu={(e) => handleContextMenu(e, ri, ci)}
                    >
                      <input
                        type="text"
                        className="gacha-cell-input"
                        value={cell.text}
                        onChange={(e) => updateCell(ri, ci, e.target.value)}
                        disabled={isColorMode}
                      />
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 右鍵顏色選擇器 */}
      {colorPickerCell && (
        <div
          className="color-picker-popup"
          style={{ top: colorPickerCell.y, left: colorPickerCell.x }}
        >
          {HIGHLIGHT_COLORS.map(c => (
            <button
              key={c.value}
              className="color-picker-option"
              style={{ background: c.value === 'none' ? 'var(--bg-secondary)' : c.color }}
              onClick={() => setCellColor(colorPickerCell.row, colorPickerCell.col, c.value)}
            >
              {c.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}