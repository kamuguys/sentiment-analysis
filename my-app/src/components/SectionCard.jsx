export default function SectionCard({ title, description, children, className = '' }) {
  return (
    <section className={`rounded-[28px] border border-white/10 bg-card/70 p-5 shadow-xl shadow-black/10 ${className}`.trim()}>
      {(title || description) && (
        <div className="mb-4">
          {title ? <h3 className="text-lg font-semibold">{title}</h3> : null}
          {description ? <p className="mt-1 text-sm text-muted">{description}</p> : null}
        </div>
      )}
      {children}
    </section>
  )
}
