export default function StatCard({ icono: Icono, etiqueta, valor, detalle, tono = 'indigo' }) {
  return (
    <article className="stat-card">
      <div className={`stat-icon stat-${tono}`}>
        <Icono size={22} strokeWidth={2.1} />
      </div>
      <div className="stat-info">
        <span className="stat-label">{etiqueta}</span>
        <strong className="stat-value">{valor}</strong>
        {detalle && <span className="stat-detail">{detalle}</span>}
      </div>
    </article>
  )
}
