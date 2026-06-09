import { useState, useRef } from 'react'
import { useImageUpload } from '../hooks/useImageUpload'
import './ImageUploader.css'

export default function ImageUploader({ imageUrl, onImageChange }) {
  const { uploadImage, deleteImage } = useImageUpload()
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef(null)

  // 處理上傳
  const handleUpload = async (file) => {
    if (!file || !file.type.startsWith('image/')) return
    
    setUploading(true)
    const url = await uploadImage(file)
    if (url) {
      onImageChange(url)
    }
    setUploading(false)
  }

  // Ctrl+V 貼上
  const handlePaste = (e) => {
    const items = e.clipboardData?.items
    if (!items) return

    for (const item of items) {
      if (item.type.startsWith('image/')) {
        e.preventDefault()
        const file = item.getAsFile()
        handleUpload(file)
        return
      }
    }
  }

  // 拖放
  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleUpload(file)
  }

  // 選檔案
  const handleFileSelect = (e) => {
    const file = e.target.files[0]
    if (file) handleUpload(file)
  }

  // 刪除圖片
  const handleRemove = async () => {
    if (imageUrl) {
      await deleteImage(imageUrl)
      onImageChange('')
    }
  }

  return (
    <div
      className={`image-uploader ${dragOver ? 'drag-over' : ''} ${imageUrl ? 'has-image' : ''}`}
      onPaste={handlePaste}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      tabIndex={0}
    >
      {uploading ? (
        <div className="upload-loading">
          <span className="upload-spinner">⏳</span>
          <span>上傳中...</span>
        </div>
      ) : imageUrl ? (
        <div className="upload-preview">
          <img src={imageUrl} alt="截圖" />
          <button className="btn-remove-img" onClick={handleRemove} title="移除圖片">✕</button>
        </div>
      ) : (
        <div className="upload-placeholder" onClick={() => fileInputRef.current?.click()}>
          <span className="upload-icon">📋</span>
          <span className="upload-text">Ctrl+V 貼上截圖</span>
          <span className="upload-subtext">或拖放 / 點擊選檔</span>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />
    </div>
  )
}