import { useEffect, useMemo, useState } from 'react'
import { Outlet } from 'react-router-dom'
import Header from '../components/Header'
import MobileNav from '../components/MobileNav'
import Sidebar from '../components/Sidebar'
import { useAuth } from '../hooks/useAuth'
import mockData from '../data/mock-data.json'
import { listBusinesses } from '../services/businessService'

const SELECTED_BUSINESS_STORAGE_KEY = 'sme-selected-business'

const baseDashboardData = {
  comments: [
    { text: 'Customer feedback will appear here after your analysis workflow begins.', sentiment: 'neutral', aspect: 'Other', confidence: 0.7, lang: 'English' },
  ],
  kpiTrend: [{ name: 'Live', v: 0 }],
  sentimentTrend: {
    Weekly: [{ name: 'Mon', positive: 0, negative: 0, neutral: 100 }],
    Monthly: [{ name: 'Week 1', positive: 0, negative: 0, neutral: 100 }],
    Quarterly: [{ name: 'Q1', positive: 0, negative: 0, neutral: 100 }],
  },
  aspects: [
    { name: 'Product Quality', pos: 0, neg: 0, neu: 100 },
    { name: 'Pricing', pos: 0, neg: 0, neu: 100 },
    { name: 'Customer Service', pos: 0, neg: 0, neu: 100 },
    { name: 'Delivery', pos: 0, neg: 0, neu: 100 },
    { name: 'Other', pos: 0, neg: 0, neu: 100 },
  ],
  warnings: [],
  languages: [{ name: 'English', value: 100 }],
  modelMetrics: [{ label: 'Accuracy', value: 0.8 }],
  modelComparison: [{ model: 'AfriBERTa', score: 0.8 }],
}

export default function DefaultLayout() {
  const { user, signOut } = useAuth()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [businesses, setBusinesses] = useState([])
  const [selectedBusiness, setSelectedBusiness] = useState(() => {
    if (typeof window === 'undefined') return ''
    return localStorage.getItem(SELECTED_BUSINESS_STORAGE_KEY) || ''
  })

  useEffect(() => {
    async function loadBusinesses() {
      if (!user?.uid) {
        setBusinesses([])
        setSelectedBusiness('')
        return
      }

      const data = await listBusinesses(user.uid)
      setBusinesses(data)
      setSelectedBusiness((current) => {
        const savedBusinessId = current || localStorage.getItem(SELECTED_BUSINESS_STORAGE_KEY) || ''
        const hasSaved = data.some((business) => business.id === savedBusinessId)
        return hasSaved ? savedBusinessId : data[0]?.id || ''
      })
    }

    loadBusinesses()
  }, [user?.uid])

  useEffect(() => {
    if (!selectedBusiness) {
      localStorage.removeItem(SELECTED_BUSINESS_STORAGE_KEY)
      return
    }
    localStorage.setItem(SELECTED_BUSINESS_STORAGE_KEY, selectedBusiness)
  }, [selectedBusiness])

  const businessOptions = useMemo(() => {
    if (businesses.length) {
      return businesses.map((business) => ({ id: business.id, name: business.name }))
    }

    return mockData.businesses.map((business) => ({ id: business.id, name: business.name }))
  }, [businesses])

  const selectedBusinessData = useMemo(() => {
    const selected = businessOptions.find((item) => item.id === selectedBusiness)
    if (!selected) {
      return {
        ...baseDashboardData,
        id: 'demo-business',
        name: 'Your business',
      }
    }

    const actualMatch = businesses.find((business) => business.id === selected.id)
    if (actualMatch) {
      return {
        ...baseDashboardData,
        ...actualMatch,
        id: actualMatch.id,
        name: actualMatch.name,
        description: actualMatch.description || actualMatch.industry || 'Create a business profile to start personalizing this workspace.',
      }
    }

    const fallbackMatch = mockData.businesses.find((item) => item.id === selected.id)
    if (fallbackMatch) {
      return fallbackMatch
    }

    return {
      ...baseDashboardData,
      id: selected.id,
      name: selected.name,
    }
  }, [businessOptions, selectedBusiness, businesses])

  return (
    <div className="min-h-screen bg-background text-white">
      <div className="flex">
        <aside className="hidden md:block w-72">
          <Sidebar />
        </aside>
        <div className="flex-1 min-h-screen flex flex-col">
          <Header
            onMenuClick={() => setDrawerOpen(true)}
            user={user}
            onSignOut={signOut}
            selectedBusiness={selectedBusiness}
            businesses={businessOptions}
            onBusinessChange={setSelectedBusiness}
          />
          <main className="p-4 md:p-8">
            <Outlet context={{ selectedBusinessData, businesses: businessOptions, selectedBusiness, onBusinessChange: setSelectedBusiness }} />
          </main>
        </div>
      </div>
      <MobileNav
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        selectedBusiness={selectedBusiness}
        businesses={businessOptions}
        onBusinessChange={setSelectedBusiness}
      />
    </div>
  )
}
