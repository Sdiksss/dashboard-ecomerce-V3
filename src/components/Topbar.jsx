import { CalendarDays, Menu } from 'lucide-react'
import { fechaLarga } from '../utils/format'
import { useStore } from '../store/StoreContext'
import { RolBadge } from './Badges'

export default function Topbar({ titulo, subtitulo, onAbrirMenu }) {
  const { currentUser } = useStore()

  return (
    <header className="topbar">
      {/* Botón hamburguesa — solo visible en móvil */}
      <button
        type="button"
        className="topbar-menu-btn icon-button"
        onClick={onAbrirMenu}
        aria-label="Abrir menú"
      >
        <Menu size={22} />
      </button>

      <div className="topbar-title">
        <h1>{titulo}</h1>
        <p>{subtitulo}</p>
      </div>
      <div className="topbar-right">
        <span className="date-chip">
          <CalendarDays size={15} />
          {fechaLarga()}
        </span>
        <span className="topbar-user">
          {currentUser.nombre}
          <RolBadge rol={currentUser.rol} compact />
        </span>
      </div>
    </header>
  )
}
