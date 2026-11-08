import { useMemo, useState } from 'react'
import { Eye, ReceiptText, Search, X } from 'lucide-react'
import { METODOS_PAGO } from '../data/seed'
import { useStore } from '../store/StoreContext'
import { fechaHora, money, mismoDia } from '../utils/format'
import { PagoBadge } from '../components/Badges'
import TicketModal from '../components/TicketModal'

export default function Ventas() {
  const { ventas, currentUser } = useStore()
  const [busqueda, setBusqueda] = useState('')
  const [metodo, setMetodo] = useState('todos')
  const [periodo, setPeriodo] = useState('7d')
  const [ticketAbierto, setTicketAbierto] = useState(null)

  const esVendedor = currentUser.rol === 'vendedor'
  const base = useMemo(
    () => (esVendedor ? ventas.filter((v) => v.sellerId === currentUser.id) : ventas),
    [ventas, esVendedor, currentUser.id],
  )

  const filtradas = useMemo(() => {
    const texto = busqueda.trim().toLowerCase()
    const ahora = new Date()
    const hace7 = new Date(ahora.getTime() - 7 * 24 * 3600 * 1000)
    return base.filter((v) => {
      if (metodo !== 'todos' && v.metodoPago !== metodo) return false
      const f = new Date(v.fecha)
      if (periodo === 'hoy' && !mismoDia(f, ahora)) return false
      if (periodo === '7d' && f < hace7) return false
      if (!texto) return true
      return (
        v.folio.toLowerCase().includes(texto) ||
        v.sellerName.toLowerCase().includes(texto) ||
        v.items.some((it) => it.nombre.toLowerCase().includes(texto))
      )
    })
  }, [base, busqueda, metodo, periodo])

  const total = filtradas.reduce((s, v) => s + v.total, 0)
  const promedio = filtradas.length ? total / filtradas.length : 0

  return (
    <div className="page-stack">
      <div className="mini-stats">
        <div className="mini-stat">
          <span>Facturado</span>
          <strong>{money(total)}</strong>
        </div>
        <div className="mini-stat">
          <span>Tickets</span>
          <strong>{filtradas.length}</strong>
        </div>
        <div className="mini-stat">
          <span>Ticket promedio</span>
          <strong>{money(promedio)}</strong>
        </div>
        <div className="mini-stat mini-stat-note">
          <span>Alcance</span>
          <strong>{esVendedor ? 'Tus ventas' : 'Toda la tienda'}</strong>
          <small>
            {esVendedor
              ? 'Como vendedor solo ves los tickets que generaste.'
              : 'Incluye todos los vendedores y turnos.'}
          </small>
        </div>
      </div>

      <section className="card">
        <header className="card-head toolbar-head">
          <div>
            <h3>Historial de tickets</h3>
            <p>Consulta, filtra e imprime cualquier ticket generado.</p>
          </div>
          <div className="toolbar">
            <div className="search-box search-sm">
              <Search size={16} />
              <input
                type="text"
                placeholder="Folio, vendedor o producto…"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
              {busqueda && (
                <button type="button" className="icon-button" onClick={() => setBusqueda('')}>
                  <X size={14} />
                </button>
              )}
            </div>
            <select value={periodo} onChange={(e) => setPeriodo(e.target.value)}>
              <option value="hoy">Hoy</option>
              <option value="7d">Últimos 7 días</option>
              <option value="todos">Todo el historial</option>
            </select>
            <select value={metodo} onChange={(e) => setMetodo(e.target.value)}>
              <option value="todos">Todos los pagos</option>
              {METODOS_PAGO.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
        </header>

        {filtradas.length === 0 ? (
          <div className="empty-state">
            <ReceiptText size={32} />
            <h3>No hay tickets con esos filtros</h3>
            <p>Cambia el periodo, el método de pago o la búsqueda.</p>
          </div>
        ) : (
          <div className="table-wrap table-scroll">
            <table className="table">
              <thead>
                <tr>
                  <th>Folio</th>
                  <th>Fecha</th>
                  <th>Vendedor</th>
                  <th>Artículos</th>
                  <th>Pago</th>
                  <th className="num">Total</th>
                  <th>Estado</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {filtradas.map((v) => (
                  <tr key={v.id} onClick={() => setTicketAbierto(v)} className="row-click">
                    <td className="mono strong">{v.folio}</td>
                    <td className="muted">{fechaHora(v.fecha)}</td>
                    <td>{v.sellerName}</td>
                    <td className="muted">
                      {v.items.reduce((s, it) => s + it.qty, 0)} pzas ·{' '}
                      {v.items.length} producto{v.items.length === 1 ? '' : 's'}
                    </td>
                    <td>
                      <PagoBadge metodo={v.metodoPago} />
                    </td>
                    <td className="num strong">{money(v.total)}</td>
                    <td>
                      <span className="badge badge-emerald badge-sm">
                        <span className="badge-dot" /> Pagado
                      </span>
                    </td>
                    <td className="num">
                      <button
                        type="button"
                        className="icon-button"
                        title="Ver ticket"
                        onClick={(e) => {
                          e.stopPropagation()
                          setTicketAbierto(v)
                        }}
                      >
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <TicketModal venta={ticketAbierto} onClose={() => setTicketAbierto(null)} />
    </div>
  )
}
