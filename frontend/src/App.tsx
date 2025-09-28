import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Dashboard from './pages/Dashboard'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/main" replace />} />
        <Route path="/main" element={<Dashboard />}>
          {/* Dodaj tu kolejne trasy: /items, /categories, /auth itd. */}
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App