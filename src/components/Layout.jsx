import Navbar from './Navbar'
import MatrixRain from './MatrixRain'
import MeteorShower from './MeteorShower'
import { useTheme } from '../contexts/ThemeContext'

export default function Layout({ children }) {
  const { theme, animationEnabled } = useTheme()

  return (
    <div className={`app-container theme-${theme}`}>
      {animationEnabled && theme === 'matrix' && <MatrixRain key="matrix-rain" />}
      {animationEnabled && theme === 'space' && <MeteorShower key="meteor-shower" />}
      
      {!animationEnabled && theme === 'matrix' && <div className="static-bg-matrix" />}
      {!animationEnabled && theme === 'space' && <div className="static-bg-space" />}

      <Navbar />
      <main className="main-content">
        {children}
      </main>
    </div>
  )
}