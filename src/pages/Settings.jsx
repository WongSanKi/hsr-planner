import { useTheme } from '../contexts/ThemeContext'

export default function Settings() {
  const { theme, recordLayout, animationEnabled, updateSettings } = useTheme()

  return (
    <div className="page-container">
      <h1 className="page-title">⚙️ 設定</h1>

      {/* 主題切換 */}
      <section className="settings-section">
        <h2>主題風格</h2>
        <div className="theme-grid">
          {[
            { key: 'light', name: '簡約白色', icon: '☀️', desc: '乾淨明亮' },
            { key: 'dark', name: '簡約深色', icon: '🌙', desc: '護眼舒適' },
            { key: 'matrix', name: '電子駭客', icon: '💻', desc: '字元雨動態背景' },
            { key: 'space', name: '太空漫遊', icon: '🌌', desc: '流星雨動態背景' },
          ].map(t => (
            <div
              key={t.key}
              className={`theme-card ${theme === t.key ? 'selected' : ''}`}
              onClick={() => updateSettings({ theme: t.key })}
            >
              <span className="theme-icon">{t.icon}</span>
              <span className="theme-name">{t.name}</span>
              <span className="theme-desc">{t.desc}</span>
            </div>
          ))}
        </div>
      </section>

      {/* 動畫開關 */}
      <section className="settings-section">
        <h2>動態背景</h2>
        <label className="toggle-label">
          <input
            type="checkbox"
            checked={animationEnabled}
            onChange={(e) => updateSettings({ animation_enabled: e.target.checked })}
          />
          <span>啟用動態背景動畫</span>
        </label>
        <p className="settings-hint">關閉後電子/太空主題只保留靜態背景色</p>
      </section>

      {/* 通關記錄佈局 */}
      <section className="settings-section">
        <h2>通關記錄佈局</h2>
        <div className="layout-grid">
          {[
            { key: 'timeline', name: '卡片時間軸', desc: '左側時間軸，右側展開卡片' },
            { key: 'accordion', name: '手風琴式', desc: '折疊展開，一目了然' },
            { key: 'magazine', name: '雜誌瀑布流', desc: '卡片牆，視覺精美' },
          ].map(l => (
            <div
              key={l.key}
              className={`layout-card ${recordLayout === l.key ? 'selected' : ''}`}
              onClick={() => updateSettings({ record_layout: l.key })}
            >
              <span className="layout-name">{l.name}</span>
              <span className="layout-desc">{l.desc}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}