import { Outlet } from 'react-router-dom'
import { type FC } from 'react'
import Header from '../../components/HeaderComponents/Header'
import Footer from '../../components/FooterComponents/Footer'

const DashboardPage: FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <Header />

      <main className="container mx-auto p-6 flex-1">
        <h2 className="text-2xl font-semibold mb-4">Dashboard</h2>

        {/* Tu wstawisz zawartość dashboardu */}
        <section>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded shadow">Card 1</div>
            <div className="bg-white p-4 rounded shadow">Card 2</div>
            <div className="bg-white p-4 rounded shadow">Card 3</div>
          </div>
        </section>

        {/* Outlet pozwala na zagnieżdżone trasy, jeśli potrzebne */}
        <Outlet />
      </main>

      <Footer />
    </div>
  )
}

export default DashboardPage