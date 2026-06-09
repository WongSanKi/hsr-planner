import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'

const AccountContext = createContext(null)

export function AccountProvider({ children }) {
  const { user } = useAuth()
  const [accounts, setAccounts] = useState([])
  const [currentAccountId, setCurrentAccountId] = useState(null)
  const [loading, setLoading] = useState(true)

  // 讀取該用戶的遊戲帳號列表
  useEffect(() => {
    if (!user) {
      setAccounts([])
      setCurrentAccountId(null)
      setLoading(false)
      return
    }

    async function fetchAccounts() {
      setLoading(true)
      const { data, error } = await supabase
        .from('game_accounts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at')

      if (data && data.length > 0) {
        setAccounts(data)
        // 從 localStorage 恢復上次選的帳號
        const lastUsed = localStorage.getItem(`last_account_${user.id}`)
        if (lastUsed && data.find(a => a.id === lastUsed)) {
          setCurrentAccountId(lastUsed)
        } else {
          setCurrentAccountId(data[0].id)
        }
      } else {
        setAccounts([])
        setCurrentAccountId(null)
      }
      setLoading(false)
    }

    fetchAccounts()
  }, [user])

  const switchAccount = (id) => {
    setCurrentAccountId(id)
    if (user) {
      localStorage.setItem(`last_account_${user.id}`, id)
    }
  }

  const addAccount = async (name) => {
    if (!user) return null

    const { data, error } = await supabase
      .from('game_accounts')
      .insert({ user_id: user.id, name })
      .select()
      .single()

    if (data) {
      setAccounts(prev => [...prev, data])
      setCurrentAccountId(data.id)
      localStorage.setItem(`last_account_${user.id}`, data.id)
      return data
    }
    return null
  }

  const deleteAccount = async (id) => {
    await supabase.from('game_accounts').delete().eq('id', id)
    // 也刪除該帳號的所有資料
    await supabase.from('app_data').delete().eq('account_id', id)

    setAccounts(prev => prev.filter(a => a.id !== id))
    if (currentAccountId === id) {
      const remaining = accounts.filter(a => a.id !== id)
      setCurrentAccountId(remaining[0]?.id || null)
    }
  }

  const currentAccount = accounts.find(a => a.id === currentAccountId) || null

  return (
    <AccountContext.Provider value={{
      accounts,
      currentAccount,
      currentAccountId,
      switchAccount,
      addAccount,
      deleteAccount,
      loading
    }}>
      {children}
    </AccountContext.Provider>
  )
}

export const useAccount = () => useContext(AccountContext)