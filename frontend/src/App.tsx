import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Components from './pages/Components'
import Issues from './pages/Issues'
import Orders from './pages/Orders'
import Raports from './pages/Raports'
import Settings from './pages/Settings'
import { ThemeProvider } from './utils/ThemeContext'

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/main" replace />} />
          <Route path="/main/*" element={<Dashboard />} />
          <Route path="/components/*" element={<Components />} />
          <Route path="/issues/*" element={<Issues />} />
          <Route path="/orders/*" element={<Orders />} />
          <Route path="/raports/*" element={<Raports />} />
          <Route path="/settings/*" element={<Settings />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>

  )
}

export default App