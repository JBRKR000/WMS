import DashboardPage from './pages/DashboardPage';

function App() {
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto">
        <header className="bg-white shadow">
          <div className="mx-auto px-4 py-6">
            <h1 className="text-3xl font-bold text-gray-900">
              WMS - Warehouse Management System
            </h1>
          </div>
        </header>
        
        <main>
          <DashboardPage />
        </main>
      </div>
    </div>
  )
}

export default App
