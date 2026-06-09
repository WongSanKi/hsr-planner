import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import './Admin.css'

export default function Admin() {
  const { user } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })

    if (data) setUsers(data)
    if (error) setMessage(`❌ 載入失敗：${error.message}`)
    setLoading(false)
  }

  // 刪除用戶及其所有數據
  const deleteUser = async (targetUser) => {
    if (targetUser.id === user.id) {
      setMessage('⚠️ 不能刪除自己！')
      return
    }

    const confirm = window.confirm(
      `確定要刪除用戶「${targetUser.username}」及其所有數據嗎？此操作不可逆！`
    )
    if (!confirm) return

    setMessage('刪除中...')

    try {
      // 刪除該用戶的所有相關數據
      await supabase.from('stamina_plan').delete().eq('user_id', targetUser.id)
      await supabase.from('todo_list').delete().eq('user_id', targetUser.id)
      await supabase.from('team_comp').delete().eq('user_id', targetUser.id)
      await supabase.from('gacha_plans').delete().eq('user_id', targetUser.id)
      await supabase.from('user_settings').delete().eq('user_id', targetUser.id)

      // 最後刪除用戶本身
      const { error } = await supabase.from('users').delete().eq('id', targetUser.id)

      if (error) throw error

      setMessage(`✅ 已刪除用戶「${targetUser.username}」`)
      loadUsers()
    } catch (e) {
      setMessage(`❌ 刪除失敗：${e.message}`)
    }
  }

  // 清除某用戶的所有數據（保留帳號）
  const clearUserData = async (targetUser) => {
    const confirm = window.confirm(
      `確定要清除「${targetUser.username}」的所有數據嗎？帳號會保留，但數據會全部刪除。`
    )
    if (!confirm) return

    setMessage('清除中...')

    try {
      await supabase.from('stamina_plan').delete().eq('user_id', targetUser.id)
      await supabase.from('todo_list').delete().eq('user_id', targetUser.id)
      await supabase.from('team_comp').delete().eq('user_id', targetUser.id)
      await supabase.from('gacha_plans').delete().eq('user_id', targetUser.id)

      setMessage(`✅ 已清除「${targetUser.username}」的所有數據`)
    } catch (e) {
      setMessage(`❌ 清除失敗：${e.message}`)
    }
  }

  // 切換管理員身份
  const toggleAdmin = async (targetUser) => {
    if (targetUser.id === user.id) {
      setMessage('⚠️ 不能修改自己的管理員狀態！')
      return
    }

    const newStatus = !targetUser.is_admin
    const { error } = await supabase
      .from('users')
      .update({ is_admin: newStatus })
      .eq('id', targetUser.id)

    if (error) {
      setMessage(`❌ 更新失敗：${error.message}`)
    } else {
      setMessage(`✅ 已${newStatus ? '設為' : '取消'}管理員：${targetUser.username}`)
      loadUsers()
    }
  }

  // 清除所有測試數據（全部用戶）
  const clearAllTestData = async () => {
    const confirm = window.confirm(
      '⚠️ 危險操作！這會清除【所有用戶】的所有數據（不刪帳號）。確定嗎？'
    )
    if (!confirm) return

    const doubleConfirm = window.confirm('再次確認：真的要清除全部數據？')
    if (!doubleConfirm) return

    setMessage('清除所有數據中...')

    try {
      await supabase.from('stamina_plan').delete().neq('user_id', '00000000-0000-0000-0000-000000000000')
      await supabase.from('todo_list').delete().neq('user_id', '00000000-0000-0000-0000-000000000000')
      await supabase.from('team_comp').delete().neq('user_id', '00000000-0000-0000-0000-000000000000')
      await supabase.from('gacha_plans').delete().neq('user_id', '00000000-0000-0000-0000-000000000000')

      setMessage('✅ 已清除所有用戶的數據')
    } catch (e) {
      setMessage(`❌ 清除失敗：${e.message}`)
    }
  }

  if (!user?.is_admin) {
    return (
      <div className="page-container">
        <div className="admin-denied">
          <h2>🚫 權限不足</h2>
          <p>只有管理員可以存取此頁面。</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return <div className="page-container"><div className="loading-screen">載入中...</div></div>
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">🛡️ 管理後台</h1>
        <div className="header-actions">
          <button className="btn-danger-outline" onClick={clearAllTestData}>
            🗑️ 清除全部測試數據
          </button>
          <button className="btn-save" onClick={loadUsers}>
            🔄 重新整理
          </button>
        </div>
      </div>

      {message && (
        <div className={`admin-message ${message.includes('❌') ? 'error' : message.includes('⚠️') ? 'warn' : 'success'}`}>
          {message}
          <button onClick={() => setMessage('')} className="msg-close">✕</button>
        </div>
      )}

      {/* 用戶統計 */}
      <div className="admin-stats">
        <div className="stat-card">
          <span className="stat-number">{users.length}</span>
          <span className="stat-label">總用戶數</span>
        </div>
        <div className="stat-card">
          <span className="stat-number">{users.filter(u => u.is_admin).length}</span>
          <span className="stat-label">管理員</span>
        </div>
      </div>

      {/* 用戶列表 */}
      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>用戶名</th>
              <th>ID</th>
              <th>註冊時間</th>
              <th>角色</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} className={u.id === user.id ? 'current-user' : ''}>
                <td className="td-username">
                  {u.username}
                  {u.id === user.id && <span className="badge-self">（你）</span>}
                </td>
                <td className="td-id">
                  <code>{u.id.slice(0, 8)}...</code>
                </td>
                <td className="td-date">
                  {u.created_at ? new Date(u.created_at).toLocaleDateString('zh-TW') : '—'}
                </td>
                <td className="td-role">
                  <span className={`role-badge ${u.is_admin ? 'admin' : 'user'}`}>
                    {u.is_admin ? '管理員' : '一般用戶'}
                  </span>
                </td>
                <td className="td-actions">
                  <button
                    className="btn-sm btn-outline"
                    onClick={() => toggleAdmin(u)}
                    disabled={u.id === user.id}
                    title={u.is_admin ? '取消管理員' : '設為管理員'}
                  >
                    {u.is_admin ? '降級' : '升級'}
                  </button>
                  <button
                    className="btn-sm btn-warning"
                    onClick={() => clearUserData(u)}
                    title="清除數據"
                  >
                    清資料
                  </button>
                  <button
                    className="btn-sm btn-danger"
                    onClick={() => deleteUser(u)}
                    disabled={u.id === user.id}
                    title="刪除帳號"
                  >
                    刪除
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}