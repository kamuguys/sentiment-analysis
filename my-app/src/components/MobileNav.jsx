import { NavLink } from 'react-router-dom'

const items = [
  { id: 'dashboard', label: 'Dashboard', icon: '🏠', to: '/' },
  { id: 'sentiment', label: 'Sentiment Analysis', icon: '🙂', to: '/sentiment' },
  { id: 'aspects', label: 'Aspect Analysis', icon: '📊', to: '/aspects' },
  { id: 'trends', label: 'Trend Analysis', icon: '📈', to: '/trends' },
  { id: 'alerts', label: 'Alerts', icon: '🔔', to: '/alerts' },
  { id: 'reports', label: 'Reports', icon: '📄', to: '/reports' },
]

export default function MobileNav({ open, onClose, selectedBusiness, businesses, onBusinessChange }) {
  return (
    <div className={`fixed inset-0 z-50 md:hidden transition-opacity ${open ? 'opacity-100 visible pointer-events-auto' : 'opacity-0 invisible pointer-events-none'}`}>
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="absolute left-0 top-0 h-full w-72 bg-sidebar/95 border-r border-white/10 backdrop-blur-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="text-sm text-muted">Navigation</div>
            <div className="text-lg font-semibold">Zambian SME</div>
          </div>
          <button className="text-white text-xl" onClick={onClose}>×</button>
        </div>

        <div className="mb-6 flex items-center gap-2 bg-white/5 p-3 rounded-2xl text-sm">
          <span className="text-muted">Business</span>
          <select className="bg-transparent text-white outline-none flex-1" value={selectedBusiness} onChange={(e) => onBusinessChange(e.target.value)}>
            {businesses.map((business) => (
              <option key={business.id} value={business.id}>{business.name}</option>
            ))}
          </select>
        </div>

        <nav className="flex flex-col gap-2">
          {items.map((item) => (
            <NavLink
              key={item.id}
              to={item.to}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 p-3 rounded-2xl transition ${isActive ? 'bg-white/10' : 'hover:bg-white/5'}`
              }
            >
              <span className="text-xl">{item.icon}</span>
              <span className="text-sm">{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  )
}
