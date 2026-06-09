import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 檢查 localStorage 是否有登入狀態
    const saved = localStorage.getItem('hsr_user')
    if (saved) {
      setUser(JSON.parse(saved))
    }
    setLoading(false)
  }, [])

  const login = async (username) => {
    // 查找用戶
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .single()

    if (data) {
      setUser(data)
      localStorage.setItem('hsr_user', JSON.stringify(data))
      return { success: true }
    }
    return { success: false, error: '用戶不存在' }
  }

  const register = async (username) => {
    // 檢查是否已存在
    const { data: existing } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .single()

    if (existing) {
      return { success: false, error: '用戶名已被使用' }
    }

    // 建立用戶
    const { data, error } = await supabase
      .from('users')
      .insert({ username })
      .select()
      .single()

    if (data) {
      // 同時建立預設設定
      await supabase.from('user_settings').insert({ user_id: data.id })
      setUser(data)
      localStorage.setItem('hsr_user', JSON.stringify(data))
      return { success: true }
    }
    return { success: false, error: error?.message || '註冊失敗' }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('hsr_user')
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)