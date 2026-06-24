import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'
import MobileNav from '../components/MobileNav'
import mockData from '../data/mock-data.json'

export default function DefaultLayout() {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selectedBusiness, setSelectedBusiness] = useState(mockData.businesses[0]?.id || '')
  const selectedBusinessData = mockData.businesses.find((item) => item.id === selectedBusiness) || mockData.businesses[0]

  return (
    <div className="min-h-screen bg-background text-white">
      <div className="flex">
        <aside className="hidden md:block w-72">
          <Sidebar />
        </aside>
        <div className="flex-1 min-h-screen flex flex-col">
          <Header
            onMenuClick={() => setDrawerOpen(true)}
            selectedBusiness={selectedBusiness}
            businesses={mockData.businesses}
            onBusinessChange={setSelectedBusiness}
          />
          <main className="p-4 md:p-8">
            <Outlet context={{ selectedBusinessData }} />
          </main>
        </div>
      </div>
      <MobileNav open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </div>
  )
}
