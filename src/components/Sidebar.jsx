import { useState } from 'react'
import {
  LayoutDashboard,
  ShoppingCart,
  Receipt,
  Warehouse,
  Package,
  Users,
  LogOut,
  Store,
  X,
  Menu,
} from 'lucide-react'
import { ROLES } from '../data/seed'
import { useStore } from '../store/StoreContext'
import Avatar from './Avatar'
import { RolBadge } from './Badges'

const NAV = [
  {
    grupo: 'Ventas',
    items: [
      { id: 'pos', nombre: 'Punto de venta', icono: ShoppingCart },
      { id: 'ventas', nombre: 'Ventas y tickets', icono: Receipt },
    ],
  },
  {
    grupo: 'Administración',
    items: [
      { id: 'almacen', nombre: 'Almacén', icono: Warehouse },
      { id: 'productos', nombre: 'Productos', icono: Package },
      { id: 'usuarios', nombre: 'Usuarios', icono: Users },
    ],
  },
]

// Hook para manejar el estado del drawer del sidebar en móvil
export function useSidebarDrawer() {
  const [open, setOpen] = useState(false)
  return { open, abrir: () => setOpen(true), cerrar: () => setOpen(false) }
}

export default function Sidebar({ pagina, onNavegar, drawerOpen, onCerrarDrawer }) {
  const { currentUser, logout } = useStore()
  const permitidas = ROLES[currentUser.rol]?.paginas || ['pos']
  const grupos = NAV.map((g) => ({
    ...g,
    items: g.items.filter((i) => permitidas.includes(i.id)),
  })).filter((g) => g.items.length > 0)

  const navegarY = (id) => {
    onNavegar(id)
    onCerrarDrawer?.() // Cerrar drawer al navegar en móvil
  }

  const contenido = (
    <>
      <div className="brand">
        <div className="brand-mark">
          <Store size={22} />
        </div>
        <div className="brand-text">
          <strong>Mercado Aurora</strong>
          <span>Panel de gestión</span>
        </div>
        {/* Botón cerrar drawer en móvil */}
        {onCerrarDrawer && (
          <button
            type="button"
            className="icon-button sidebar-close-btn"
            onClick={onCerrarDrawer}
            aria-label="Cerrar menú"
          >
            <X size={20} />
          </button>
        )}
      </div>

      <nav className="nav">
        {grupos.map((grupo) => (
          <div className="nav-group" key={grupo.grupo}>
            <span className="nav-group-title">{grupo.grupo}</span>
            {grupo.items.map((item) => {
              const Icono = item.icono
              const activo = pagina === item.id
              return (
                <button
                  key={item.id}
                  type="button"
                  className={`nav-item ${activo ? 'activo' : ''}`}
                  onClick={() => navegarY(item.id)}
                  title={item.nombre}
                >
                  <Icono size={19} strokeWidth={2} />
                  <span className="nav-label">{item.nombre}</span>
                </button>
              )
            })}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <Avatar user={currentUser} size={38} />
          <div className="sidebar-user-meta">
            <strong>{currentUser.nombre}</strong>
            <RolBadge rol={currentUser.rol} compact />
          </div>
          <button
            type="button"
            className="icon-button"
            onClick={logout}
            title="Cerrar sesión"
          >
            <LogOut size={17} />
          </button>
        </div>
      </div>
    </>
  )

  return (
    <>
      {/* Sidebar fijo en escritorio */}
      <aside className="sidebar sidebar-desktop">
        {contenido}
      </aside>

      {/* Overlay oscuro al abrir drawer en móvil */}
      {drawerOpen && (
        <div className="sidebar-overlay" onClick={onCerrarDrawer} aria-hidden="true" />
      )}
      {/* Drawer deslizable en móvil */}
      <aside className={`sidebar sidebar-drawer ${drawerOpen ? 'sidebar-drawer-open' : ''}`}>
        {contenido}
      </aside>
    </>
  )
}
