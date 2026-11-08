import { useState } from 'react'
import {
  AlertTriangle,
  ArrowRight,
  CircleDollarSign,
  Package,
  ReceiptText,
  TrendingUp,
} from 'lucide-react'
import { useStore } from '../store/StoreContext'
import { ROLES } from '../data/seed'
import { money, mismoDia, porcentaje } from '../utils/format'
import StatCard from '../components/StatCard'
import { StockBadge } from '../components/Badges'
import TicketModal from '../components/TicketModal'

const DIAS = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb']

export default function Dashboard({ onNavegar }) {
  const { productos, ventas, currentUser } = useStore()
  const [ticketAbierto, setTicketAbierto] = useState(null)

  const hoy = new Date()
  const ventasHoy = ventas.filter((v) => mismoDia(new Date(v.fecha), hoy))
  const ingresosHoy = ventasHoy.reduce((s, v) => s + v.total, 0)
  const promedio = ventasHoy.length ? ingresosHoy / ventasHoy.length : 0
  const activos = productos.filter((p) => p.activo)
  const stockCritico = activos
    .filter((p) => p.stock <= p.minStock)
    .sort((a, b) => a.stock - b.stock)
  const conStock = activos.filter((p) => p.stock > 0).length

  const ultimos7 = Array.from({ length: 7 }, (_, k) => {
    const dia = new Date()
    dia.setHours(0, 0, 0, 0)
    dia.setDate(dia.getDate() - (6 - k))
    const fin = new Date(dia)
    fin.setDate(fin.getDate() + 1)
    const total = ventas
      .filter((v) => {
        const f = new Date(v.fecha)
        return f >= dia && f < fin
      })
      .reduce((s, v) => s + v.total, 0)
    return { total, etiqueta: DIAS[dia.getDay()], esHoy: k === 6 }
  })
  const maxDia = Math.max(...ultimos7.map((d) => d.total), 1)

  const mapaTop = new Map()
  ventas.forEach((v) =>
    v.items.forEach((it) => {
      const actual = mapaTop.get(it.productId) || {
        nombre: it.nombre,
        emoji: it.emoji,
        qty: 0,
        ingresos: 0,
      }
      actual.qty += it.qty
      actual.ingresos += it.importe
      mapaTop.set(it.productId, actual)
    }),
  )
  const topProductos = [...mapaTop.values()].sort((a, b) => b.qty - a.qty).slice(0, 5)
  const maxTop = Math.max(...topProductos.map((t) => t.qty), 1)
  const recientes = ventas.slice(0, 5)

  const nombreCorto = currentUser.nombre.split(' ')[0]
  const paginas = ROLES[currentUser.rol].paginas
  const puedeVender = paginas.includes('pos')
  const puedeVerVentas = paginas.includes('ventas')
  const puedeVerAlmacen = paginas.includes('almacen')
  const destinoCta = puedeVender ? 'pos' : 'almacen'

  return (
    <div className="page-stack">
      <div className="welcome-line">
        <div>
          <h2>Hola, {nombreCorto} 👋</h2>
          <p>Este es el resumen de {ROLES[currentUser.rol].nombre.toLowerCase()} para hoy.</p>
        </div>
        {(puedeVender || puedeVerAlmacen) && (
          <button type="button" className="btn btn-primary" onClick={() => onNavegar?.(destinoCta)}>
            {puedeVender ? 'Abrir punto de venta' : 'Revisar almacén'}
            <ArrowRight size={17} />
          </button>
        )}
      </div>

      <div className="kpi-grid">
        <StatCard
          icono={CircleDollarSign}
          etiqueta="Ingresos de hoy"
          valor={money(ingresosHoy)}
          detalle={`${ventasHoy.length} ticket${ventasHoy.length === 1 ? '' : 's'} generados`}
          tono="indigo"
        />
        <StatCard
          icono={ReceiptText}
          etiqueta="Tickets de hoy"
          valor={ventasHoy.length}
          detalle="Ventas cobradas y cerradas"
          tono="emerald"
        />
        <StatCard
          icono={TrendingUp}
          etiqueta="Ticket promedio"
          valor={money(promedio)}
          detalle={promedio ? 'Incluye IVA' : 'Aún sin ventas hoy'}
          tono="sky"
        />
        <StatCard
          icono={AlertTriangle}
          etiqueta="Stock crítico"
          valor={stockCritico.length}
          detalle={
            stockCritico.length
              ? `${stockCritico.filter((p) => p.stock === 0).length} agotados · ${stockCritico.length} por reponer`
              : 'Todo el inventario está sano'
          }
          tono="amber"
        />
      </div>

      <div className="dashboard-grid">
        <section className="card chart-card">
          <header className="card-head">
            <div>
              <h3>Ventas de los últimos 7 días</h3>
              <p>Total facturado por día (IVA incluido)</p>
            </div>
            <span className="chip chip-soft">7 días</span>
          </header>
          <div className="bar-chart">
            {ultimos7.map((dia, k) => (
              <div className="bar-col" key={k} title={`${dia.etiqueta}: ${money(dia.total)}`}>
                <span className="bar-value">{dia.total > 0 ? money(dia.total) : '—'}</span>
                <div className="bar-track">
                  <div
                    className={`bar ${dia.esHoy ? 'bar-hoy' : ''}`}
                    style={{ height: `${Math.max(5, (dia.total / maxDia) * 100)}%` }}
                  />
                </div>
                <span className="bar-label">{dia.esHoy ? 'hoy' : dia.etiqueta}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="card">
          <header className="card-head">
            <div>
              <h3>Stock crítico</h3>
              <p>Productos en o por debajo del mínimo</p>
            </div>
            {puedeVerAlmacen && (
              <button type="button" className="link-btn" onClick={() => onNavegar?.('almacen')}>
                Ver almacén <ArrowRight size={14} />
              </button>
            )}
          </header>

          {stockCritico.length === 0 ? (
            <div className="empty-mini">
              <Package size={26} />
              <p>Todo el inventario está por encima del mínimo.</p>
            </div>
          ) : (
            <ul className="critical-list">
              {stockCritico.slice(0, 5).map((p) => (
                <li key={p.id}>
                  <span className="product-emoji">{p.emoji}</span>
                  <div className="critical-info">
                    <strong>{p.nombre}</strong>
                    <span>
                      {p.stock} en stock · mínimo {p.minStock}
                    </span>
                  </div>
                  <StockBadge stock={p.stock} minStock={p.minStock} />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <div className="dashboard-grid">
        <section className="card">
          <header className="card-head">
            <div>
              <h3>Últimas ventas</h3>
              <p>Los tickets más recientes del equipo</p>
            </div>
            {puedeVerVentas && (
              <button type="button" className="link-btn" onClick={() => onNavegar?.('ventas')}>
                Ver todas <ArrowRight size={14} />
              </button>
            )}
          </header>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Folio</th>
                  <th>Vendedor</th>
                  <th>Artículos</th>
                  <th className="num">Total</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {recientes.map((v) => (
                  <tr key={v.id}>
                    <td className="mono">{v.folio}</td>
                    <td>{v.sellerName}</td>
                    <td className="muted">
                      {v.items.reduce((s, it) => s + it.qty, 0)} pzas
                    </td>
                    <td className="num strong">{money(v.total)}</td>
                    <td className="num">
                      <button
                        type="button"
                        className="link-btn"
                        onClick={() => setTicketAbierto(v)}
                      >
                        Ver ticket
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="card">
          <header className="card-head">
            <div>
              <h3>Más vendidos</h3>
              <p>Por unidades vendidas</p>
            </div>
            <span className="chip chip-soft">
              {conStock} productos con stock
            </span>
          </header>
          <ul className="top-list">
            {topProductos.map((p, k) => (
              <li key={p.nombre}>
                <span className="rank">{k + 1}</span>
                <span className="product-emoji">{p.emoji}</span>
                <div className="top-info">
                  <div className="top-line">
                    <strong>{p.nombre}</strong>
                    <span>{p.qty} pzas</span>
                  </div>
                  <div className="progress">
                    <div
                      className="progress-fill"
                      style={{ width: `${porcentaje(p.qty, maxTop)}%` }}
                    />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <TicketModal venta={ticketAbierto} onClose={() => setTicketAbierto(null)} />
    </div>
  )
}
