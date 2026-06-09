import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'

export default function Login() {
  const [username, setUsername] = useState('')
  const [isRegister, setIsRegister] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login, register } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!username.trim()) return

    setLoading(true)
    setError('')

    const result = isRegister
      ? await register(username.trim())
      : await login(username.trim())

    if (!result.success) {
      setError(result.error)
    }
    setLoading(false)
  }

  return (
    <div className="login-container">
      <div className="login-box">
        <h1>🚀 HSR Planner</h1>
        <p className="login-subtitle">星穹鐵道規劃工具</p>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="輸入用戶名稱"
            className="login-input"
            autoFocus
          />

          {error && <p className="login-error">{error}</p>}

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? '...' : (isRegister ? '註冊' : '登入')}
          </button>
        </form>

        <button
          className="login-toggle"
          onClick={() => { setIsRegister(!isRegister); setError('') }}
        >
          {isRegister ? '已有帳號？登入' : '沒有帳號？註冊'}
        </button>
      </div>
    </div>
  )
}