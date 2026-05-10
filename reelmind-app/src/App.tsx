import { Routes, Route } from 'react-router-dom'
import Library from './pages/Library'
import Player from './pages/Player'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Library />} />
      <Route path="/play/:id" element={<Player />} />
    </Routes>
  )
}

export default App