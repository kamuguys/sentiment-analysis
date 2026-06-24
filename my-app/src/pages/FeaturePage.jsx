export default function FeaturePage({ title, subtitle }) {
  return (
    <section className="space-y-6">
      <div className="bg-card/70 p-6 rounded-3xl border border-white/10 shadow-xl shadow-black/10">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold">{title}</h1>
            <p className="text-sm text-muted mt-1">{subtitle}</p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-2xl bg-white/5 px-4 py-2 text-sm text-white">
            Live insights · mock demo mode
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="bg-card/70 p-5 rounded-3xl border border-white/10">
          <h2 className="text-lg font-semibold mb-3">Overview</h2>
          <p className="text-sm text-muted leading-relaxed">
            This workspace shows a SaaS-style analytics page for the selected feature. Replace this placeholder with real charts, filters, and trend cards as the integration expands.
          </p>
        </div>
        <div className="bg-card/70 p-5 rounded-3xl border border-white/10">
          <h2 className="text-lg font-semibold mb-3">Next steps</h2>
          <ul className="space-y-3 text-sm text-muted">
            <li>Connect Firestore summaries for real customer comments.</li>
            <li>Load sentiment and aspect predictions from the AfriBERTa service.</li>
            <li>Add business-specific filtering and report export flows.</li>
          </ul>
        </div>
      </div>
    </section>
  )
}
