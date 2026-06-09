import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import StaminaPlan from './pages/StaminaPlan'
import GachaPlanner from './pages/GachaPlanner'
import TeamComp from './pages/TeamComp'
import TodoList from './pages/TodoList'
import Scratchpad from './pages/Scratchpad'
import ClearRecords from './pages/ClearRecords'
import Settings from './pages/Settings'
import Admin from './pages/Admin'


function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return <div className="loading-screen">載入中...</div>
  }

  if (!user) {
    return <Login />
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/stamina" replace />} />
        <Route path="/stamina" element={<StaminaPlan />} />
        <Route path="/gacha" element={<GachaPlanner />} />
        <Route path="/teams" element={<TeamComp />} />
        <Route path="/todo" element={<TodoList />} />
        <Route path="/scratchpad" element={<Scratchpad />} />
        <Route path="/records" element={<ClearRecords />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </Layout>
  )
}

export default App