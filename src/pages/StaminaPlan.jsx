import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export default function StaminaPlan() {
  const { user } = useAuth()
  const [accounts, setAccounts] = useState([
    {
      id: crypto.randomUUID(),
      name: '帳號1',
      targets: [{ id: crypto.randomUUID(), text: '', done: false }],
      note: ''
    }
  ])
  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState(null)

  useEffect(() => {
    loadData()
  }, [user])

  const loadData = async () => {
    const { data } = await supabase
      .from('stamina_plan')
      .select('*')
      .eq('user_id', user.id)
      .order('account_index')

    if (data && data.length > 0) {
      const loaded = data.map(row => ({
        id: row.id,
        name: row.data.name || '未命名',
        targets: row.data.targets || [{ id: crypto.randomUUID(), text: '', done: false }],
        note: row.data.note || ''
      }))
      setAccounts(loaded)
    }
  }

  const saveData = async () => {
    setSaving(true)

    // 刪除舊數據
    await supabase.from('stamina_plan').delete().eq('user_id', user.id)

    // 插入新數據
    const rows = accounts.map((acc, i) => ({
      user_id: user.id,
      account_index: i + 1,
      data: {
        name: acc.name,
        targets: acc.targets,
        note: acc.note
      }
    }))

    await supabase.from('stamina_plan').insert(rows)
    setSaving(false)
    setLastSaved(new Date().toLocaleTimeString())
  }

  // ===== 帳號操作 =====
  const addAccount = () => {
    setAccounts([...accounts, {
      id: crypto.randomUUID(),
      name: `帳號${accounts.length + 1}`,
      targets: [{ id: crypto.randomUUID(), text: '', done: false }],
      note: ''
    }])
  }

  const removeAccount = (index) => {
    if (accounts.length <= 1) return
    const newAccounts = accounts.filter((_, i) => i !== index)
    setAccounts(newAccounts)
  }

  const updateAccountName = (index, name) => {
    const newAccounts = [...accounts]
    newAccounts[index] = { ...newAccounts[index], name }
    setAccounts(newAccounts)
  }

  const updateAccountNote = (index, note) => {
    const newAccounts = [...accounts]
    newAccounts[index] = { ...newAccounts[index], note }
    setAccounts(newAccounts)
  }

  // ===== 目標操作 =====
  const addTarget = (accountIndex) => {
    const newAccounts = [...accounts]
    newAccounts[accountIndex].targets.push({
      id: crypto.randomUUID(),
      text: '',
      done: false
    })
    setAccounts(newAccounts)
  }

  const removeTarget = (accountIndex, targetIndex) => {
    const newAccounts = [...accounts]
    if (newAccounts[accountIndex].targets.length <= 1) return
    newAccounts[accountIndex].targets.splice(targetIndex, 1)
    setAccounts(newAccounts)
  }

  const updateTarget = (accountIndex, targetIndex, text) => {
    const newAccounts = [...accounts]
    newAccounts[accountIndex].targets[targetIndex].text = text
    setAccounts(newAccounts)
  }

  const toggleTarget = (accountIndex, targetIndex) => {
    const newAccounts = [...accounts]
    newAccounts[accountIndex].targets[targetIndex].done = 
      !newAccounts[accountIndex].targets[targetIndex].done
    setAccounts(newAccounts)
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">⚡ 體力規劃</h1>
        <div className="header-actions">
          {lastSaved && (
            <span className="last-saved">上次保存: {lastSaved}</span>
          )}
          <button onClick={saveData} className="btn-save" disabled={saving}>
            {saving ? '保存中...' : '💾 保存'}
          </button>
        </div>
      </div>

      <div className="stamina-grid">
        {accounts.map((account, accIdx) => (
          <div key={account.id} className="account-card">
            {/* 帳號頭部 */}
            <div className="account-header">
              <input
                type="text"
                value={account.name}
                onChange={(e) => updateAccountName(accIdx, e.target.value)}
                className="account-name-input"
                placeholder="帳號名稱..."
              />
              <button
                onClick={() => removeAccount(accIdx)}
                className="btn-icon btn-delete"
                disabled={accounts.length <= 1}
                title="刪除帳號"
              >
                ✕
              </button>
            </div>

            {/* 目標列表 */}
            <div className="targets-section">
              <div className="section-label">目標</div>
              {account.targets.map((target, tIdx) => (
                <div key={target.id} className="target-row">
                  <input
                    type="checkbox"
                    checked={target.done}
                    onChange={() => toggleTarget(accIdx, tIdx)}
                    className="target-checkbox"
                  />
                  <input
                    type="text"
                    value={target.text}
                    onChange={(e) => updateTarget(accIdx, tIdx, e.target.value)}
                    className={`target-input ${target.done ? 'done' : ''}`}
                    placeholder="輸入目標..."
                  />
                  <button
                    onClick={() => removeTarget(accIdx, tIdx)}
                    className="btn-icon btn-remove-target"
                    disabled={account.targets.length <= 1}
                    title="刪除目標"
                  >
                    −
                  </button>
                </div>
              ))}
              <button
                onClick={() => addTarget(accIdx)}
                className="btn-add-target"
              >
                + 新增目標
              </button>
            </div>

            {/* 備註 */}
            <div className="note-section">
              <div className="section-label">備註</div>
              <textarea
                value={account.note}
                onChange={(e) => updateAccountNote(accIdx, e.target.value)}
                className="note-textarea"
                placeholder="備註..."
                rows={2}
              />
            </div>
          </div>
        ))}

        {/* 新增帳號按鈕 */}
        <div className="account-card add-card" onClick={addAccount}>
          <span className="add-icon">+</span>
          <span className="add-text">新增帳號</span>
        </div>
      </div>
    </div>
  )
}