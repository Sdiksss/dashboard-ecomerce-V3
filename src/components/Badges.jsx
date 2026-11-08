import { AlertTriangle, Check, PackageX } from 'lucide-react'
import { ROLES } from '../data/seed'

export function RolBadge({ rol, compact = false }) {
  const info = ROLES[rol]
  if (!info) return null
  return (
    <span className={`badge badge-${info.color} ${compact ? 'badge-sm' : ''}`}>
      <span className="badge-dot" />
      {info.nombre}
    </span>
  )
}

export function StockBadge({ stock, minStock }) {
  if (stock <= 0) {
    return (
      <span className="badge badge-rose badge-sm">
        <PackageX size={12} /> Agotado
      </span>
    )
  }
  if (stock <= minStock) {
    return (
      <span className="badge badge-amber badge-sm">
        <AlertTriangle size={12} /> Bajo
      </span>
    )
  }
  return (
    <span className="badge badge-emerald badge-sm">
      <Check size={12} /> Disponible
    </span>
  )
}

export function PagoBadge({ metodo }) {
  const clase =
    metodo === 'Efectivo' ? 'badge-emerald' : metodo === 'Tarjeta' ? 'badge-sky' : 'badge-violet'
  return <span className={`badge ${clase} badge-sm`}>{metodo}</span>
}
