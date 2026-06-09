import { useState, useEffect } from 'react'
import { useSingleRowData } from '../hooks/useSupabaseData'
import { useTheme } from '../contexts/ThemeContext'
import './TeamComp.css'

const DEFAULT_DATA = {
  accounts: [
    { id: '1', name: '帳號1' },
    { id: '2', name: '帳號2' },
    { id: '3', name: '帳號3' },
    { id: '4', name: '帳號4' },
    { id: '5', name: '帳號5' },
    { id: '6', name: '帳號6' },
  ],
  columns: ['隊伍1', '隊伍2', '隊伍3', '高難配隊'],
  teams: {
    '1': [['', '', '', '']],
    '2': [['', '', '', '']],
    '3': [['', '', '', '']],
    '4': [['', '', '', '']],
    '5': [['', '', '', '']],
    '6': [['', '', '', '']],
  }
}

export default function TeamComp() {
  const { theme } = useTheme()
  const { data, loading, saving, lastSaved, error, saveData } = useSingleRowData('team_comp')
  const [localData, setLocalData] = useState(DEFAULT_DATA)
  const [hasChanges, setHasChanges] = useState(false)

  // 從資料庫載入
  useEffect(() => {
    if (data && Object.keys(data).length > 0) {
      setLocalData(data)
    }
  }, [data])

  // 標記有未儲存的變更
  const updateLocal = (newData) => {
    setLocalData(newData)
    setHasChanges(true)
  }

  // 儲存
  const handleSave = async () => {
    await saveData(localData)
    setHasChanges(false)
  }

  // 修改欄位標題
  const updateColumnName = (colIndex, value) => {
    const newCols = [...localData.columns]
    newCols[colIndex] = value
    updateLocal({ ...localData, columns: newCols })
  }

  // 修改帳號名稱
  const updateAccountName = (accId, value) => {
    const newAccounts = localData.accounts.map(acc =>
      acc.id === accId ? { ...acc, name: value } : acc
    )
    updateLocal({ ...localData, accounts: newAccounts })
  }

  // 修改格子內容
  const updateCell = (accId, rowIndex, colIndex, value) => {
    const newTeams = { ...localData.teams }
    const rows = [...newTeams[accId]]
    const row = [...rows[rowIndex]]
    row[colIndex] = value
    rows[rowIndex] = row
    newTeams[accId] = rows
    updateLocal({ ...localData, teams: newTeams })
  }

  // 新增備選行
  const addRow = (accId) => {
    const newTeams = { ...localData.teams }
    const rows = [...newTeams[accId]]
    rows.push(['', '', '', ''])
    newTeams[accId] = rows
    updateLocal({ ...localData, teams: newTeams })
  }

  // 刪除備選行
  const removeRow = (accId, rowIndex) => {
    const newTeams = { ...localData.teams }
    const rows = [...newTeams[accId]]
    if (rows.length <= 1) return // 至少保留一行
    rows.splice(rowIndex, 1)
    newTeams[accId] = rows
    updateLocal({ ...localData, teams: newTeams })
  }

  if (loading) {
    return <div className={`team-comp-page ${theme}`}><div className="loading">載入中...</div></div>
  }

  return (
    <div className={`team-comp-page ${theme}`}>
      {/* 頂部狀態列 */}
      <div className="team-comp-header">
        <h1>三隊情況</h1>
        <div className="header-actions">
          {lastSaved && (
            <span className="last-saved">
              上次儲存：{new Date(lastSaved).toLocaleString('zh-TW')}
            </span>
          )}
          <button
            className={`save-btn ${hasChanges ? 'has-changes' : ''}`}
            onClick={handleSave}
            disabled={saving || !hasChanges}
          >
            {saving ? '儲存中...' : hasChanges ? '💾 儲存' : '✓ 已儲存'}
          </button>
        </div>
      </div>

      {error && <div className="error-msg">⚠️ {error}</div>}

      {/* 主表格 */}
      <div className="team-comp-table-wrapper">
        <table className="team-comp-table">
          <thead>
            <tr>
              <th className="account-col-header">帳號</th>
              {localData.columns.map((col, i) => (
                <th key={i} className="col-header">
                  <input
                    type="text"
                    value={col}
                    onChange={(e) => updateColumnName(i, e.target.value)}
                    className="col-header-input"
                  />
                </th>
              ))}
              <th className="action-col-header"></th>
            </tr>
          </thead>
          <tbody>
            {localData.accounts.map((account) => {
              const rows = localData.teams[account.id] || [['' , '', '', '']]
              return rows.map((row, rowIndex) => (
                <tr key={`${account.id}-${rowIndex}`} className={rowIndex === 0 ? 'first-row' : 'alt-row'}>
                  {/* 帳號名稱（只在第一行顯示） */}
                  {rowIndex === 0 ? (
                    <td className="account-name-cell" rowSpan={rows.length}>
                      <input
                        type="text"
                        value={account.name}
                        onChange={(e) => updateAccountName(account.id, e.target.value)}
                        className="account-name-input"
                      />
                    </td>
                  ) : null}

                  {/* 4個隊伍格子 */}
                  {row.map((cell, colIndex) => (
                    <td key={colIndex} className="team-cell">
                      <input
                        type="text"
                        value={cell}
                        onChange={(e) => updateCell(account.id, rowIndex, colIndex, e.target.value)}
                        className="team-cell-input"
                        placeholder="..."
                      />
                    </td>
                  ))}

                  {/* 操作按鈕 */}
                  <td className="action-cell">
                    {rowIndex === 0 ? (
                      <button
                        className="add-row-btn"
                        onClick={() => addRow(account.id)}
                        title="新增備選配隊"
                      >
                        +
                      </button>
                    ) : (
                      <button
                        className="remove-row-btn"
                        onClick={() => removeRow(account.id, rowIndex)}
                        title="刪除此行"
                      >
                        ×
                      </button>
                    )}
                  </td>
                </tr>
              ))
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}