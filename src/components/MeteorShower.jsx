import { useEffect, useRef } from 'react'

export default function MeteorShower() {
  const canvasRef = useRef(null)
  const rafRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()

    const stars = []
    const meteors = []

    // 建立星星
    for (let i = 0; i < 250; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 1.8 + 0.2,
        opacity: Math.random() * 0.8 + 0.2,
        twinkleSpeed: Math.random() * 0.03 + 0.005,
        phase: Math.random() * Math.PI * 2
      })
    }

    function createMeteor() {
      const startX = Math.random() * canvas.width * 1.5
      return {
        x: startX,
        y: -10,
        length: Math.random() * 100 + 50,
        speed: Math.random() * 6 + 4,
        opacity: 1,
        thickness: Math.random() * 1.5 + 0.5,
        angle: Math.PI / 4 + (Math.random() * 0.4 - 0.2)
      }
    }

    let frame = 0

    // 先畫一次背景
    ctx.fillStyle = '#080a1e'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    function draw() {
      frame++

      // 半透明覆蓋產生拖尾效果
      ctx.fillStyle = 'rgba(8, 10, 30, 0.12)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // 畫星星
      stars.forEach(star => {
        const flicker = Math.sin(frame * star.twinkleSpeed + star.phase) * 0.4 + 0.6
        ctx.beginPath()
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(200, 220, 255, ${star.opacity * flicker})`
        ctx.fill()
      })

      // 隨機產生流星
      if (Math.random() < 0.025 && meteors.length < 5) {
        meteors.push(createMeteor())
      }

      // 畫流星
      for (let i = meteors.length - 1; i >= 0; i--) {
        const m = meteors[i]
        
        const headX = m.x
        const headY = m.y
        const tailX = m.x + Math.cos(m.angle + Math.PI) * m.length
        const tailY = m.y - Math.sin(m.angle) * m.length

        // 漸變尾巴
        const gradient = ctx.createLinearGradient(headX, headY, tailX, tailY)
        gradient.addColorStop(0, `rgba(220, 240, 255, ${m.opacity})`)
        gradient.addColorStop(0.3, `rgba(180, 200, 255, ${m.opacity * 0.6})`)
        gradient.addColorStop(1, 'rgba(100, 150, 255, 0)')

        ctx.beginPath()
        ctx.moveTo(headX, headY)
        ctx.lineTo(tailX, tailY)
        ctx.strokeStyle = gradient
        ctx.lineWidth = m.thickness
        ctx.stroke()

        // 頭部光暈
        ctx.beginPath()
        ctx.arc(headX, headY, 2.5, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255, 255, 255, ${m.opacity})`
        ctx.fill()

        // 移動
        m.x -= Math.cos(m.angle) * m.speed
        m.y += Math.sin(m.angle) * m.speed
        m.opacity -= 0.008

        if (m.opacity <= 0 || m.y > canvas.height + 100 || m.x < -200) {
          meteors.splice(i, 1)
        }
      }

      rafRef.current = requestAnimationFrame(draw)
    }

    rafRef.current = requestAnimationFrame(draw)

    const handleResize = () => {
      resize()
      // 重新分佈星星
      stars.forEach(star => {
        star.x = Math.random() * canvas.width
        star.y = Math.random() * canvas.height
      })
      ctx.fillStyle = '#080a1e'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
    }
    window.addEventListener('resize', handleResize)

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="animated-bg-canvas"
    />
  )
}