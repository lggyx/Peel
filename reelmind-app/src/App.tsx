import { useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import { StatusBar } from '@capacitor/status-bar'
import Library from './pages/Library'
import Player from './pages/Player'

function App() {
  useEffect(() => {
    // 全局隐藏状态栏
    StatusBar.hide().catch(() => {})
  }, [])

  return (
    <Routes>
      <Route path="/" element={<Library />} />
      <Route path="/play/:id" element={<Player />} />
    </Routes>
  )
}

export default App
