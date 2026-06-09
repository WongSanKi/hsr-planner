import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'

const ThemeContext = createContext(null)

export function ThemeProvider({ children }) {
  const { user } = useAuth()
  const [theme, setTheme] = useState('dark') // 'light', 'dark', 'matrix', 'space'
  const [recordLayout, setRecordLayout] = useState('timeline')
  const [animationEnabled, setAnimationEnabled] = useState(true)

  // 載入用戶設定
  useEffect(() => {
    if (user) {
      loadSettings()
    }
  }, [user])

  const loadSettings = async () => {
    const { data } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', user.id)
      .single()

    console.log('Loaded settings:', data)
    if (data) {
      setTheme(data.theme || 'dark')
      setRecordLayout(data.record_layout || 'timeline')
      setAnimationEnabled(data.animation_enabled ?? true)
    }
  }

  const updateSettings = async (updates) => {
    if (updates.theme !== undefined) setTheme(updates.theme)
    if (updates.record_layout !== undefined) setRecordLayout(updates.record_layout)
    if (updates.animation_enabled !== undefined) setAnimationEnabled(updates.animation_enabled)

    if (user) {
      await supabase
        .from('user_settings')
        .update(updates)
        .eq('user_id', user.id)
    }
  }

  return (
    <ThemeContext.Provider value={{
      theme, recordLayout, animationEnabled, updateSettings
    }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)