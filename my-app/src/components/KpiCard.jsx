import { LineChart, Line, ResponsiveContainer } from 'recharts'

export default function KpiCard({ title, value, change, data, color = '#22C55E', icon }) {
  return (
    <div className="bg-card/60 backdrop-blur-md p-4 rounded-2xl shadow-md border border-white/6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm text-muted">{title}</div>
          <div className="text-2xl font-semibold">{value}</div>
        </div>
        <div className="text-sm text-muted">{change}</div>
      </div>

      <div className="mt-3 h-12">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <Line type="monotone" dataKey="v" stroke={color} strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
