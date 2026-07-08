export default function EmptyState({ title, description, action }) {
  return (
    <div className="rounded-[24px] border border-dashed border-white/10 bg-white/5 p-5 text-sm text-muted">
      <div className="font-semibold text-white">{title}</div>
      <p className="mt-2">{description}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  )
}
