import { useEffect, useRef } from 'react'

export default function MatrixRain() {
  const canvasRef = useRef(null)
  const animRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()

    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*<>{}[]'
    const fontSize = 14
    let columns = Math.floor(canvas.width / fontSize)
    let drops = Array(columns).fill(1)

    // 先填滿黑色背景
    ctx.fillStyle = '#0a0f14'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    function draw() {
      ctx.fillStyle = 'rgba(10, 15, 20, 0.05)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      ctx.font = `${fontSize}px monospace`

      for (let i = 0; i < drops.length; i++) {
        const text = chars[Math.floor(Math.random() * chars.length)]
        
        // 頭部亮色
        if (Math.random() > 0.8) {
          ctx.fillStyle = '#ffffff'
        } else {
          ctx.fillStyle = `rgba(10, 255, 157, ${Math.random() * 0.5 + 0.3})`
        }
        
        ctx.fillText(text, i * fontSize, drops[i] * fontSize)

        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
          drops[i] = 0
        }
        drops[i]++
      }
    }

    const interval = setInterval(draw, 40)

    window.addEventListener('resize', () => {
      resize()
      columns = Math.floor(canvas.width / fontSize)
      drops = Array(columns).fill(1)
      ctx.fillStyle = '#0a0f14'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
    })

    return () => {
      clearInterval(interval)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="animated-bg-canvas"
    />
  )
}