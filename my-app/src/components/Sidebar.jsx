import { NavLink } from 'react-router-dom'

const items = [
  { id: 'dashboard', label: 'Dashboard', icon: '', to: '/' },
  { id: 'sentiment', label: 'Sentiment Analysis', icon: '', to: '/sentiment' },
  { id: 'aspects', label: 'Aspect Analysis', icon: '', to: '/aspects' },
  { id: 'trends', label: 'Trend Analysis', icon: '', to: '/trends' },
  { id: 'alerts', label: 'Alerts', icon: '', to: '/alerts' },
  { id: 'reports', label: 'Reports', icon: '', to: '/reports' },
  { id: 'businesses', label: 'Businesses', icon: '', to: '/businesses' },
  { id: 'settings', label: 'Settings', icon: '', to: '/settings' },
]

export default function Sidebar() {
  return (
    <div className="h-full min-h-screen p-6 bg-sidebar/80 backdrop-blur-md border-r border-white/6 text-sm">
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-black font-bold">ZS</div>
          <div>
            <div className="text-white font-semibold">Zambian SME</div>
            <div className="text-muted text-xs">Sentiment Insights</div>
          </div>
        </div>
      </div>

      <nav className="flex flex-col gap-1">
        {items.map((it) => (
          <NavLink
            key={it.id}
            to={it.to}
            className={({ isActive }) =>
              `flex items-center gap-3 p-3 rounded-xl hover:bg-white/3 transition ${isActive ? 'bg-white/5' : ''}`
            }
          >
            <div className="text-xl">{it.icon}</div>
            <span className="text-sm">{it.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto pt-6">
        <div className="text-muted text-xs">© {new Date().getFullYear()} Zambian SME</div>
      </div>
    </div>
  )
}
