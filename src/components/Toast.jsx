import { useEffect } from 'react'
import { CheckCircle2, Info, XCircle } from 'lucide-react'
import { useStore } from '../store/StoreContext'

export default function Toast() {
  const { toast } = useStore()
  if (!toast) return null

  const Icono = toast.tipo === 'error' ? XCircle : toast.tipo === 'info' ? Info : CheckCircle2

  return (
    <div className={`toast toast-${toast.tipo}`} role="status">
      <Icono size={20} />
      <span>{toast.mensaje}</span>
    </div>
  )
}
