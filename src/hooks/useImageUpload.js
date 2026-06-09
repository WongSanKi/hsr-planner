import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export function useImageUpload() {
  const { user } = useAuth()

  const uploadImage = async (file) => {
    if (!user || !file) return null

    // 生成唯一檔名
    const ext = file.type === 'image/png' ? 'png' : 'jpg'
    const fileName = `${user.id}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`

    const { data, error } = await supabase.storage
      .from('screenshots')
      .upload(fileName, file, {
        contentType: file.type,
        upsert: false
      })

    if (error) {
      console.error('Upload error:', error)
      return null
    }

    // 取得公開 URL
    const { data: urlData } = supabase.storage
      .from('screenshots')
      .getPublicUrl(fileName)

    return urlData.publicUrl
  }

  const deleteImage = async (url) => {
    if (!url) return
    // 從 URL 中提取路徑
    const match = url.match(/screenshots\/(.+)$/)
    if (match) {
      await supabase.storage.from('screenshots').remove([match[1]])
    }
  }

  return { uploadImage, deleteImage }
}