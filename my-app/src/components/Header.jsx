import { useState } from 'react'

export default function Header({ onMenuClick, user, onSignOut, selectedBusiness, businesses, onBusinessChange }) {
  const [range, setRange] = useState('Last 30 days')

  return (
    <header className="flex flex-col gap-4 border-b border-white/6 bg-background/40 p-4 backdrop-blur-sm md:flex-row md:items-center md:justify-between md:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        <div>
          <div className="text-sm text-muted">Zambian SME Platform</div>
          <div className="font-semibold text-white">Sentiment Insights</div>
        </div>
        {businesses?.length ? (
          <div className="hidden items-center gap-2 rounded-2xl bg-white/5 px-4 py-2 text-sm text-white md:flex">
            <span className="text-muted">Business</span>
            <select
              className="bg-transparent text-white outline-none"
              value={selectedBusiness}
              onChange={(event) => onBusinessChange(event.target.value)}
            >
              {businesses.map((business) => (
                <option key={business.id} value={business.id} className="bg-background text-white">
                  {business.name}
                </option>
              ))}
            </select>
          </div>
        ) : null}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2 rounded-2xl bg-white/5 p-2 text-sm">
          <select className="bg-transparent text-white outline-none" value={range} onChange={(event) => setRange(event.target.value)}>
            <option>Last 7 days</option>
            <option>Last 30 days</option>
            <option>Last 90 days</option>
          </select>
          <span className="text-muted">▾</span>
        </div>

        <button className="flex items-center gap-2 rounded-2xl bg-primary px-3 py-2 text-sm text-black">
          <span>⬇</span>
          Export
        </button>

        <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-sm font-semibold">
            {user?.displayName?.charAt(0) || 'U'}
          </div>
          <div className="text-sm">
            <div className="font-medium text-white">{user?.displayName || 'Demo user'}</div>
            <button type="button" className="text-xs text-muted transition hover:text-white" onClick={onSignOut}>
              Sign out
            </button>
          </div>
        </div>

        <button className="rounded-md bg-white/5 p-2 md:hidden" onClick={onMenuClick}>☰</button>
      </div>
    </header>
  )
}
