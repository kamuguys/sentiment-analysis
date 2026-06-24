import { useState } from 'react'

export default function Header({ onMenuClick, selectedBusiness, businesses, onBusinessChange }) {
  const [range, setRange] = useState('Last 30 days')

  return (
    <header className="flex flex-col gap-4 p-4 md:p-6 border-b border-white/6 bg-background/40 backdrop-blur-sm md:flex-row md:items-center md:justify-between">
      <div className="flex items-center gap-4">
        <div className="md:hidden">
          <button className="p-2 rounded-md bg-white/5" onClick={onMenuClick}>☰</button>
        </div>
        <div>
          <div className="text-sm text-muted">Zambian SME Platform</div>
          <div className="font-semibold text-white">Sentiment Insights</div>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="hidden sm:flex items-center gap-2 bg-white/5 p-2 rounded-2xl text-sm">
          <span className="text-muted">Business</span>
          <select className="bg-transparent text-white outline-none" value={selectedBusiness} onChange={(e) => onBusinessChange(e.target.value)}>
            {businesses.map((business) => (
              <option key={business.id} value={business.id}>{business.name}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 bg-white/5 p-2 rounded-2xl text-sm">
          <select className="bg-transparent text-white outline-none" value={range} onChange={(e) => setRange(e.target.value)}>
            <option>Last 7 days</option>
            <option>Last 30 days</option>
            <option>Last 90 days</option>
          </select>
          <span className="text-muted">▾</span>
        </div>

        <button className="flex items-center gap-2 bg-primary text-black px-3 py-2 rounded-2xl text-sm">
          <span>⬇</span>
          Export
        </button>

        <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-sm font-semibold">U</div>
      </div>
    </header>
  )
}
