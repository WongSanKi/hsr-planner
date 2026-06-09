import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export function useSingleRowData(pageId) {
  const { user } = useAuth()
  const userId = user?.id

  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!pageId || !userId) return

    async function fetchData() {
      setLoading(true)
      setError(null)

      const { data: row, error: fetchError } = await supabase
        .from('app_data')
        .select('data, updated_at')
        .eq('user_id', userId)
        .eq('page_id', pageId)
        .single()

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          setData(null) // 還沒有資料，正常
        } else {
          console.error('Supabase fetch error:', fetchError)
          setError('讀取資料失敗：' + fetchError.message)
        }
      } else {
        setData(row.data)
        setLastSaved(row.updated_at)
      }

      setLoading(false)
    }

    fetchData()
  }, [pageId, userId])

  const saveData = useCallback(async (newData) => {
    if (!pageId || !userId) return false

    setSaving(true)
    setError(null)

    const now = new Date().toISOString()

    const { error: saveError } = await supabase
      .from('app_data')
      .upsert({
        user_id: userId,
        page_id: pageId,
        data: newData,
        updated_at: now
      })

    if (saveError) {
      console.error('Supabase save error:', saveError)
      setError('儲存失敗：' + saveError.message)
    } else {
      setData(newData)
      setLastSaved(now)
    }

    setSaving(false)
    return !saveError
  }, [pageId, userId])

  return { data, loading, saving, lastSaved, error, saveData }
}