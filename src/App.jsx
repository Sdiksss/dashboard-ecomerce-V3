import { useEffect, useState } from 'react'
import { ROLES } from './data/seed'
import { useStore } from './store/StoreContext'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import POS from './pages/POS'
import Ventas from './pages/Ventas'
import Almacen from './pages/Almacen'
import Productos from './pages/Productos'
import Usuarios from './pages/Usuarios'
import Sidebar from './components/Sidebar'
import Topbar from './components/Topbar'
import Toast from './components/Toast'

const PAGINAS = {
  dashboard: {
    titulo: 'Panel general',
    subtitulo: 'Resumen de tu tienda en tiempo real',
    componente: Dashboard,
  },
  pos: {
    titulo: 'Punto de venta',
    subtitulo: 'Registra una venta y genera el ticket',
    componente: POS,
  },
  ventas: {
    titulo: 'Ventas y tickets',
    subtitulo: 'Historial de operaciones y reimpresión de tickets',
    componente: Ventas,
  },
  almacen: {
    titulo: 'Almacén',
    subtitulo: 'Control de existencias y movimientos',
    componente: Almacen,
  },
  productos: {
    titulo: 'Productos',
    subtitulo: 'Catálogo, precios y disponibilidad',
    componente: Productos,
  },
  usuarios: {
    titulo: 'Usuarios',
    subtitulo: 'Equipo, roles y permisos de acceso',
    componente: Usuarios,
  },
}

export default function App() {
  const { currentUser, token } = useStore()
  // REGLA DE NEGOCIO: Todos los roles aterrizan en POS (Ventas) tras el login
  const [pagina, setPagina] = useState('pos')
  // Control del drawer del sidebar en móvil
  const [drawerOpen, setDrawerOpen] = useState(false)

  useEffect(() => {
    if (currentUser && token) {
      // Primera vista obligatoria siempre es POS para todos los roles (seller, warehouse, admin)
      setPagina('pos')
    }
  }, [currentUser?.id, token])

  // REGLA DE NEGOCIO: Redirigir siempre a /login si no hay token
  if (!token || !currentUser) {
    return (
      <>
        <Login />
        <Toast />
      </>
    )
  }

  const permitidas = ROLES[currentUser.rol]?.paginas || ['pos']
  const activa = permitidas.includes(pagina) ? pagina : permitidas[0]
  const { titulo, subtitulo, componente: Componente } = PAGINAS[activa] || PAGINAS.pos

  return (
    <div className="app-shell">
      <Sidebar
        pagina={activa}
        onNavegar={setPagina}
        drawerOpen={drawerOpen}
        onCerrarDrawer={() => setDrawerOpen(false)}
      />
      <div className="app-main">
        <Topbar
          titulo={titulo}
          subtitulo={subtitulo}
          onAbrirMenu={() => setDrawerOpen(true)}
        />
        <main className="page">
          <Componente onNavegar={setPagina} />
        </main>
      </div>
      <Toast />
    </div>
  )
}
