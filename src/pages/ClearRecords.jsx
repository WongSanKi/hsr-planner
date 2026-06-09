import { useState, useEffect } from 'react'
import { useSingleRowData } from '../hooks/useSupabaseData'
import { useTheme } from '../contexts/ThemeContext'
import './ClearRecords.css'
import ImageUploader from '../components/ImageUploader'

const CHALLENGE_TYPES = ['混沌回憶', '虛構敘事', '末日幻影', '異相仲裁']

const createEmptyScreenshot = (index) => ({
  accountId: index + 1,
  accountName: `帳號${index + 1}`,
  imageUrl: '',
  stars: '',
})

const createEmptyRecord = () => ({
  id: Date.now().toString(),
  version: '',
  period: 1,
  challengeType: '混沌回憶',
  date: new Date().toISOString().slice(0, 10),
  note: '',
  screenshots: [createEmptyScreenshot(0)]
})

export default function ClearRecords() {
  const { recordLayout, theme } = useTheme()
  const { data, loading, saving, lastSaved, error, saveData } = useSingleRowData('clear_records')

  const [records, setRecords] = useState([])
  const [hasChanges, setHasChanges] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingRecord, setEditingRecord] = useState(null)
  const [filterVersion, setFilterVersion] = useState('all')
  const [filterType, setFilterType] = useState('all')
  const [filterAccount, setFilterAccount] = useState('all')
  const [expandedId, setExpandedId] = useState(null)
  const [lightboxImg, setLightboxImg] = useState(null)

  useEffect(() => {
    if (data && data.records) {
      setRecords(data.records)
    }
  }, [data])

  // 儲存
  const handleSave = async () => {
    await saveData({ records })
    setHasChanges(false)
  }

  useEffect(() => {
    if (!hasChanges) return

    const timer = setTimeout(() => {
      console.log('⏰ 自動儲存觸發')
      saveData({ records }).then((success) => {
        if (success) {
          setHasChanges(false)
          console.log('✅ 自動儲存成功')
        }
      })
    }, 2000)

    return () => clearTimeout(timer)
  }, [records, hasChanges, saveData])

  // 新增記錄
  const handleAdd = () => {
    setEditingRecord(createEmptyRecord())
    setShowForm(true)
  }

  // 編輯記錄
  const handleEdit = (record) => {
    setEditingRecord({ ...record, screenshots: [...record.screenshots] })
    setShowForm(true)
  }

  // 刪除記錄
  const handleDelete = (id) => {
    if (!window.confirm('確定要刪除這筆記錄嗎？')) return
    setRecords(prev => prev.filter(r => r.id !== id))
    setHasChanges(true)
  }

  // 表單儲存
  const handleFormSave = (record) => {
    const exists = records.find(r => r.id === record.id)
    if (exists) {
      setRecords(prev => prev.map(r => r.id === record.id ? record : r))
    } else {
      setRecords(prev => [record, ...prev])
    }
    setShowForm(false)
    setEditingRecord(null)
    setHasChanges(true)
  }

  // 取得所有版本號
  const versions = [...new Set(records.map(r => r.version))].sort((a, b) => b.localeCompare(a))

  // 取得所有帳號名稱（從記錄中動態收集）
  const allAccountNames = [...new Set(
    records.flatMap(r => r.screenshots.map(s => s.accountName))
  )].sort()

  // 過濾
  const filteredRecords = records.filter(r => {
    if (filterVersion !== 'all' && r.version !== filterVersion) return false
    if (filterType !== 'all' && r.challengeType !== filterType) return false
    return true
  }).sort((a, b) => {
    if (a.version !== b.version) return b.version.localeCompare(a.version)
    return b.period - a.period
  })

  // 按版本分組
  const groupedByVersion = filteredRecords.reduce((acc, record) => {
    if (!acc[record.version]) acc[record.version] = []
    acc[record.version].push(record)
    return acc
  }, {})

  const formatTime = (isoString) => {
    if (!isoString) return ''
    return new Date(isoString).toLocaleString('zh-TW')
  }

  if (loading) {
    return <div className="page-container"><div className="loading-screen">載入中...</div></div>
  }

  return (
    <div className={`clear-records-page ${theme}`}>
      {/* 頂部 */}
      <div className="page-header">
        <h1 className="page-title">🏆 通關記錄</h1>
        <div className="header-actions">
          {lastSaved && <span className="last-saved">上次儲存：{formatTime(lastSaved)}</span>}
          <button className="btn-save" onClick={handleSave} disabled={saving || !hasChanges}>
            {saving ? '儲存中...' : hasChanges ? '💾 儲存' : '已儲存 ✓'}
          </button>
        </div>
      </div>

      {error && <div className="error-banner">⚠️ {error}</div>}

      {/* 工具列 */}
      <div className="records-toolbar">
        <button className="btn-add-record" onClick={handleAdd}>＋ 新增記錄</button>

        <div className="filters">
          <select value={filterVersion} onChange={(e) => setFilterVersion(e.target.value)}>
            <option value="all">全部版本</option>
            {versions.map(v => <option key={v} value={v}>{v}</option>)}
          </select>
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
            <option value="all">全部類型</option>
            {CHALLENGE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <select value={filterAccount} onChange={(e) => setFilterAccount(e.target.value)}>
            <option value="all">全部帳號</option>
            {allAccountNames.map((name, i) => <option key={i} value={name}>{name}</option>)}
          </select>
        </div>

        <span className="record-count">共 {filteredRecords.length} 筆記錄</span>
      </div>

      {/* 主內容區 - 根據佈局切換 */}
      {filteredRecords.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">📭</span>
          <p>還沒有通關記錄</p>
          <button className="btn-add-record" onClick={handleAdd}>新增第一筆記錄</button>
        </div>
      ) : recordLayout === 'timeline' ? (
        <TimelineLayout
          groupedByVersion={groupedByVersion}
          onEdit={handleEdit}
          onDelete={handleDelete}
          filterAccount={filterAccount}
          setLightboxImg={setLightboxImg}
        />
      ) : recordLayout === 'accordion' ? (
        <AccordionLayout
          groupedByVersion={groupedByVersion}
          expandedId={expandedId}
          setExpandedId={setExpandedId}
          onEdit={handleEdit}
          onDelete={handleDelete}
          filterAccount={filterAccount}
          setLightboxImg={setLightboxImg}
        />
      ) : (
        <MagazineLayout
          records={filteredRecords}
          onEdit={handleEdit}
          onDelete={handleDelete}
          filterAccount={filterAccount}
          setLightboxImg={setLightboxImg}
        />
      )}

      {/* 新增/編輯表單 Modal */}
      {showForm && (
        <RecordForm
          record={editingRecord}
          onSave={handleFormSave}
          onCancel={() => { setShowForm(false); setEditingRecord(null) }}
        />
      )}

      {/* 圖片 Lightbox */}
      {lightboxImg && (
        <div className="lightbox" onClick={() => setLightboxImg(null)}>
          <img src={lightboxImg} alt="通關截圖" />
          <button className="lightbox-close">✕</button>
        </div>
      )}
    </div>
  )
}

/* ===== 時間軸佈局 ===== */
function TimelineLayout({ groupedByVersion, onEdit, onDelete, filterAccount, setLightboxImg }) {
  return (
    <div className="timeline-container">
      {Object.entries(groupedByVersion).map(([version, records]) => (
        <div key={version} className="timeline-version">
          <div className="timeline-version-marker">
            <span className="version-badge">v{version}</span>
          </div>
          <div className="timeline-cards">
            {records.map(record => (
              <RecordCard
                key={record.id}
                record={record}
                onEdit={onEdit}
                onDelete={onDelete}
                filterAccount={filterAccount}
                setLightboxImg={setLightboxImg}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

/* ===== 手風琴佈局 ===== */
function AccordionLayout({ groupedByVersion, expandedId, setExpandedId, onEdit, onDelete, filterAccount, setLightboxImg }) {
  return (
    <div className="accordion-container">
      {Object.entries(groupedByVersion).map(([version, records]) => (
        <div key={version} className="accordion-group">
          <div className="accordion-version-header">
            <span>📁 版本 {version}</span>
            <span className="accordion-count">{records.length} 筆</span>
          </div>
          {records.map(record => (
            <div key={record.id} className="accordion-item">
              <div
                className={`accordion-header ${expandedId === record.id ? 'expanded' : ''}`}
                onClick={() => setExpandedId(expandedId === record.id ? null : record.id)}
              >
                <div className="accordion-header-info">
                  <span className={`type-tag type-${record.challengeType}`}>{record.challengeType}</span>
                  <span className="accordion-date">{record.date}</span>
                  <span className="accordion-period">第 {record.period} 期</span>
                </div>
                <span className="accordion-arrow">{expandedId === record.id ? '▼' : '▶'}</span>
              </div>
              {expandedId === record.id && (
                <div className="accordion-content">
                  {record.note && <p className="record-note">💬 {record.note}</p>}
                  <div className="screenshot-grid">
                    {record.screenshots
                      .filter(s => filterAccount === 'all' || s.accountName === filterAccount)
                      .map((shot, i) => (
                        <ScreenshotThumb key={i} shot={shot} setLightboxImg={setLightboxImg} />
                      ))}
                  </div>
                  <div className="record-actions">
                    <button className="btn-sm btn-outline" onClick={() => onEdit(record)}>✏️ 編輯</button>
                    <button className="btn-sm btn-danger" onClick={() => onDelete(record.id)}>🗑️ 刪除</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

/* ===== 雜誌瀑布流佈局 ===== */
function MagazineLayout({ records, onEdit, onDelete, filterAccount, setLightboxImg }) {
  return (
    <div className="magazine-container">
      {records.map(record => (
        <div key={record.id} className="magazine-card">
          <div className="magazine-card-header">
            <span className={`type-tag type-${record.challengeType}`}>{record.challengeType}</span>
            <span className="magazine-version">v{record.version}</span>
          </div>
          <div className="magazine-screenshots">
            {record.screenshots
              .filter(s => filterAccount === 'all' || s.accountName === filterAccount)
              .filter(s => s.imageUrl)
              .slice(0, 3)
              .map((shot, i) => (
                <img
                  key={i}
                  src={shot.imageUrl}
                  alt={shot.accountName}
                  className="magazine-thumb"
                  onClick={() => setLightboxImg(shot.imageUrl)}
                />
              ))}
            {record.screenshots.filter(s => s.imageUrl).length === 0 && (
              <div className="magazine-placeholder">📷 尚無截圖</div>
            )}
          </div>
          <div className="magazine-card-body">
            <div className="magazine-meta">
              <span>第 {record.period} 期</span>
              <span>{record.date}</span>
            </div>
            {record.note && <p className="magazine-note">{record.note}</p>}
          </div>
          <div className="magazine-card-footer">
            <button className="btn-sm btn-outline" onClick={() => onEdit(record)}>✏️</button>
            <button className="btn-sm btn-danger" onClick={() => onDelete(record.id)}>🗑️</button>
          </div>
        </div>
      ))}
    </div>
  )
}

/* ===== 記錄卡片（時間軸用） ===== */
function RecordCard({ record, onEdit, onDelete, filterAccount, setLightboxImg }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="record-card">
      <div className="record-card-header" onClick={() => setExpanded(!expanded)}>
        <div className="record-card-info">
          <span className={`type-tag type-${record.challengeType}`}>{record.challengeType}</span>
          <span className="record-period">第 {record.period} 期</span>
          <span className="record-date">{record.date}</span>
        </div>
        <span className="expand-arrow">{expanded ? '▼' : '▶'}</span>
      </div>

      {expanded && (
        <div className="record-card-body">
          {record.note && <p className="record-note">💬 {record.note}</p>}
          <div className="screenshot-grid">
            {record.screenshots
              .filter(s => filterAccount === 'all' || s.accountName === filterAccount)
              .map((shot, i) => (
                <ScreenshotThumb key={i} shot={shot} setLightboxImg={setLightboxImg} />
              ))}
          </div>
          <div className="record-actions">
            <button className="btn-sm btn-outline" onClick={(e) => { e.stopPropagation(); onEdit(record) }}>✏️ 編輯</button>
            <button className="btn-sm btn-danger" onClick={(e) => { e.stopPropagation(); onDelete(record.id) }}>🗑️ 刪除</button>
          </div>
        </div>
      )}
    </div>
  )
}

/* ===== 截圖縮圖 ===== */
function ScreenshotThumb({ shot, setLightboxImg }) {
  return (
    <div className="screenshot-item">
      <span className="screenshot-account">{shot.accountName}</span>
      {shot.imageUrl ? (
        <img
          src={shot.imageUrl}
          alt={shot.accountName}
          className="screenshot-img"
          onClick={() => setLightboxImg(shot.imageUrl)}
        />
      ) : (
        <div className="screenshot-empty">📷</div>
      )}
      {shot.stars && (
        <span className="screenshot-stars">⭐ {shot.stars}</span>
      )}
    </div>
  )
}

/* ===== 新增/編輯表單 ===== */
function RecordForm({ record, onSave, onCancel }) {
  const [form, setForm] = useState(record)

  const updateForm = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  const updateScreenshot = (index, key, value) => {
    const newShots = [...form.screenshots]
    newShots[index] = { ...newShots[index], [key]: value }
    setForm(prev => ({ ...prev, screenshots: newShots }))
  }

  const addScreenshot = () => {
    setForm(prev => ({
      ...prev,
      screenshots: [...prev.screenshots, createEmptyScreenshot(prev.screenshots.length)]
    }))
  }

  const removeScreenshot = (index) => {
    if (form.screenshots.length <= 1) return
    setForm(prev => ({
      ...prev,
      screenshots: prev.screenshots.filter((_, i) => i !== index)
    }))
  }

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content record-form" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{record.version ? '編輯記錄' : '新增記錄'}</h2>
          <button className="modal-close" onClick={onCancel}>✕</button>
        </div>

        <div className="form-body">
          {/* 基本資訊 */}
          <div className="form-row">
            <div className="form-group">
              <label>版本</label>
              <input
                type="text"
                value={form.version}
                onChange={(e) => updateForm('version', e.target.value)}
                placeholder="例如: 4.3"
              />
            </div>
            <div className="form-group">
              <label>期數</label>
              <input
                type="number"
                value={form.period}
                onChange={(e) => updateForm('period', Number(e.target.value))}
                min={1}
              />
            </div>
            <div className="form-group">
              <label>關卡類型</label>
              <select
                value={form.challengeType}
                onChange={(e) => updateForm('challengeType', e.target.value)}
              >
                {CHALLENGE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>日期</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => updateForm('date', e.target.value)}
              />
            </div>
          </div>

          {/* 備註 */}
          <div className="form-group">
            <label>備註</label>
            <textarea
              value={form.note}
              onChange={(e) => updateForm('note', e.target.value)}
              placeholder="這期的感想..."
              rows={3}
            />
          </div>

          {/* 截圖 */}
          <div className="form-group">
            <label>截圖 — 點擊框框後可 Ctrl+V 貼上截圖</label>
            <div className="screenshots-form">
              {form.screenshots.map((shot, i) => (
                <div key={i} className="screenshot-form-item">
                  <div className="shot-form-header">
                    <input
                      type="text"
                      value={shot.accountName}
                      onChange={(e) => updateScreenshot(i, 'accountName', e.target.value)}
                      className="shot-account-input"
                      placeholder="帳號名"
                    />
                    <input
                      type="text"
                      value={shot.stars}
                      onChange={(e) => updateScreenshot(i, 'stars', e.target.value)}
                      className="shot-stars-input"
                      placeholder="例：12/12"
                    />
                    <span className="stars-label">⭐</span>
                    {form.screenshots.length > 1 && (
                      <button
                        type="button"
                        className="btn-remove-shot"
                        onClick={() => removeScreenshot(i)}
                        title="移除此帳號"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                  <ImageUploader
                    imageUrl={shot.imageUrl}
                    onImageChange={(url) => updateScreenshot(i, 'imageUrl', url)}
                  />
                </div>
              ))}
              <button type="button" className="btn-add-shot" onClick={addScreenshot}>
                ＋ 新增帳號
              </button>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-cancel" onClick={onCancel}>取消</button>
          <button className="btn-confirm" onClick={() => onSave(form)}>
            💾 確認儲存
          </button>
        </div>
      </div>
    </div>
  )
}
