import { useMemo, useState } from 'react'
import {
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  Boxes,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  FolderPlus,
  Package,
  PackageSearch,
  Plus,
  Search,
  Tag,
  Warehouse,
  X,
} from 'lucide-react'
import { EMOJIS } from '../data/seed'
import { useStore } from '../store/StoreContext'
import { fechaHora, money } from '../utils/format'
import Modal from '../components/Modal'
import StatCard from '../components/StatCard'
import { StockBadge } from '../components/Badges'

// -----------------------------------------------------------------------------
// Modal de Ajuste Directo de Stock (Exclusivo Almacén / Admin)
// -----------------------------------------------------------------------------
function AjusteModal({ producto, onClose }) {
  const { ajustarStock } = useStore()
  const [tipo, setTipo] = useState('entrada')
  const [cantidad, setCantidad] = useState('')
  const [motivo, setMotivo] = useState('')
  const [error, setError] = useState('')

  const enviar = (e) => {
    e.preventDefault()
    const qty = Number.parseInt(cantidad, 10)
    if (!qty || qty <= 0) {
      setError('Ingresa una cantidad mayor a cero.')
      return
    }
    if (tipo === 'salida' && qty > producto.stock) {
      setError(`No puedes retirar más de ${producto.stock} unidades.`)
      return
    }
    const ok = ajustarStock({
      productId: producto.id,
      tipo,
      cantidad: qty,
      motivo,
    })
    if (ok) onClose()
  }

  return (
    <Modal
      titulo="Ajustar inventario"
      subtitulo={`${producto.emoji} ${producto.nombre} · SKU ${producto.sku}`}
      onClose={onClose}
      ancho={480}
    >
      <form className="form-stack" onSubmit={enviar}>
        <div className="stock-now">
          <span>Stock actual</span>
          <strong>
            {producto.stock} <small>unidades</small>
          </strong>
          <StockBadge stock={producto.stock} minStock={producto.minStock} />
        </div>

        <div className="field">
          <span className="section-label">Tipo de movimiento</span>
          <div className="tipo-toggle">
            <button
              type="button"
              className={`tipo-btn ${tipo === 'entrada' ? 'tipo-activo entrada' : ''}`}
              onClick={() => setTipo('entrada')}
            >
              <ArrowDownLeft size={16} /> Entrada
            </button>
            <button
              type="button"
              className={`tipo-btn ${tipo === 'salida' ? 'tipo-activo salida' : ''}`}
              onClick={() => setTipo('salida')}
            >
              <ArrowUpRight size={16} /> Salida
            </button>
          </div>
        </div>

        <label className="field">
          <span>Cantidad</span>
          <input
            type="number"
            min="1"
            step="1"
            placeholder="0"
            value={cantidad}
            onChange={(e) => {
              setCantidad(e.target.value)
              setError('')
            }}
            autoFocus
          />
        </label>

        <label className="field">
          <span>Motivo (opcional)</span>
          <input
            type="text"
            placeholder={tipo === 'entrada' ? 'Compra a proveedor, devolución…' : 'Merma, producto dañado…'}
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
          />
        </label>

        {error && <p className="field-error">{error}</p>}

        <div className="modal-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" className="btn btn-primary">
            {tipo === 'entrada' ? 'Registrar entrada' : 'Registrar salida'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

// -----------------------------------------------------------------------------
// NUEVA FUNCIONALIDAD: Modal de Gestión de Categorías (POST /categories)
// -----------------------------------------------------------------------------
function CategoriasModal({ onClose }) {
  const { categorias, agregarCategoria } = useStore()
  const [nombre, setNombre] = useState('')
  const [emoji, setEmoji] = useState('🏷️')
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)

  const handleCrear = async (e) => {
    e.preventDefault()
    if (!nombre.trim()) {
      setError('El nombre de la categoría es requerido')
      return
    }

    setGuardando(true)
    setError('')
    try {
      await agregarCategoria({ nombre: nombre.trim(), emoji })
      setNombre('')
      setEmoji('🏷️')
    } catch (err) {
      setError(err.message || 'Error al guardar categoría')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <Modal
      titulo="Gestión de Categorías"
      subtitulo="Administra las categorías de productos (POST /categories)"
      onClose={onClose}
      ancho={540}
    >
      <div className="form-stack">
        <form onSubmit={handleCrear} className="form-stack" style={{ background: 'var(--surface-2)', padding: 14, borderRadius: 12 }}>
          <h4 style={{ fontSize: 13, fontWeight: 700 }}>Nueva Categoría</h4>
          <div style={{ display: 'flex', gap: 10 }}>
            <label className="field" style={{ flex: 1 }}>
              <span>Nombre</span>
              <input
                type="text"
                placeholder="Ej. Lácteos, Panadería..."
                value={nombre}
                onChange={(e) => {
                  setNombre(e.target.value)
                  setError('')
                }}
              />
            </label>
            <label className="field" style={{ width: 80 }}>
              <span>Emoji</span>
              <select value={emoji} onChange={(e) => setEmoji(e.target.value)}>
                {EMOJIS.map((em) => (
                  <option key={em} value={em}>
                    {em}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {error && <p className="field-error">{error}</p>}

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" className="btn btn-primary btn-sm" disabled={guardando}>
              <Plus size={14} /> {guardando ? 'Guardando...' : 'Crear categoría'}
            </button>
          </div>
        </form>

        <div style={{ marginTop: 8 }}>
          <h4 style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Categorías registradas ({categorias?.length || 0})</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 8, maxHeight: 180, overflowY: 'auto' }}>
            {categorias?.map((c) => (
              <div
                key={c.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 10px',
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  fontSize: 12.5,
                }}
              >
                <span>{c.emoji || '📦'}</span>
                <strong style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.nombre}</strong>
              </div>
            ))}
          </div>
        </div>

        <div className="modal-actions" style={{ marginTop: 12 }}>
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
    </Modal>
  )
}

// -----------------------------------------------------------------------------
// Componente Principal: Módulo de Almacén / Inventario
// -----------------------------------------------------------------------------
export default function Almacen() {
  const { productos, movimientos, categorias } = useStore()
  const [tab, setTab] = useState('inventario')
  const [busqueda, setBusqueda] = useState('')
  const [soloCritico, setSoloCritico] = useState(false)
  const [ajuste, setAjuste] = useState(null)
  const [catModalOpen, setCatModalOpen] = useState(false)
  const [movBusqueda, setMovBusqueda] = useState('')

  // NUEVA FUNCIONALIDAD: Soporte para paginación (offset, perPage)
  const [perPage, setPerPage] = useState(8)
  const [offset, setOffset] = useState(0)

  const activos = productos.filter((p) => p.activo)
  const unidades = activos.reduce((s, p) => s + p.stock, 0)
  const valor = activos.reduce((s, p) => s + p.stock * p.costo, 0)
  const criticos = activos.filter((p) => p.stock <= p.minStock)

  const filtrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase()
    return productos.filter((p) => {
      if (soloCritico && !(p.stock <= p.minStock)) return false
      if (!texto) return true
      return p.nombre.toLowerCase().includes(texto) || p.sku.toLowerCase().includes(texto)
    })
  }, [productos, busqueda, soloCritico])

  // Reset offset cuando cambia la búsqueda o filtro
  const handleBusqueda = (val) => {
    setBusqueda(val)
    setOffset(0)
  }

  const handleSoloCritico = (val) => {
    setSoloCritico(val)
    setOffset(0)
  }

  // Paginación calculada
  const totalItems = filtrados.length
  const paginados = filtrados.slice(offset, offset + perPage)
  const paginaActual = Math.floor(offset / perPage) + 1
  const totalPaginas = Math.ceil(totalItems / perPage) || 1

  const cambiarPagina = (nuevaPagina) => {
    const nuevoOffset = (nuevaPagina - 1) * perPage
    if (nuevoOffset >= 0 && nuevoOffset < totalItems) {
      setOffset(nuevoOffset)
    }
  }

  const movFiltrados = useMemo(() => {
    const texto = movBusqueda.trim().toLowerCase()
    if (!texto) return movimientos
    return movimientos.filter(
      (m) =>
        m.productName.toLowerCase().includes(texto) ||
        m.motivo.toLowerCase().includes(texto) ||
        m.userName.toLowerCase().includes(texto),
    )
  }, [movimientos, movBusqueda])

  return (
    <div className="page-stack">
      {/* Tarjetas KPI de Estado de Inventario */}
      <div className="kpi-grid">
        <StatCard
          icono={Boxes}
          etiqueta="SKUs activos"
          valor={activos.length}
          detalle={`${productos.length - activos.length} desactivados`}
          tono="indigo"
        />
        <StatCard
          icono={Package}
          etiqueta="Unidades en stock"
          valor={unidades.toLocaleString('es-MX')}
          detalle="Suma de todas las existencias"
          tono="emerald"
        />
        <StatCard
          icono={CircleDollarSign}
          etiqueta="Valor del inventario"
          valor={money(valor)}
          detalle="Valorizado a costo de compra"
          tono="sky"
        />
        <StatCard
          icono={AlertTriangle}
          etiqueta="Requieren reposición"
          valor={criticos.length}
          detalle={criticos.length ? `${criticos.filter((p) => p.stock === 0).length} agotados` : 'Sin alertas'}
          tono="amber"
        />
      </div>

      <section className="card">
        <div className="tabs">
          <button
            type="button"
            className={`tab ${tab === 'inventario' ? 'tab-active' : ''}`}
            onClick={() => setTab('inventario')}
          >
            <Warehouse size={16} /> Inventario
          </button>
          <button
            type="button"
            className={`tab ${tab === 'movimientos' ? 'tab-active' : ''}`}
            onClick={() => setTab('movimientos')}
          >
            <PackageSearch size={16} /> Movimientos
            <span className="tab-count">{movimientos.length}</span>
          </button>
        </div>

        {tab === 'inventario' ? (
          <>
            <div className="table-toolbar" style={{ justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                <div className="search-box search-sm">
                  <Search size={16} />
                  <input
                    type="text"
                    placeholder="Buscar producto o SKU…"
                    value={busqueda}
                    onChange={(e) => handleBusqueda(e.target.value)}
                  />
                  {busqueda && (
                    <button type="button" className="icon-button" onClick={() => handleBusqueda('')}>
                      <X size={14} />
                    </button>
                  )}
                </div>
                <label className="check-toggle">
                  <input
                    type="checkbox"
                    checked={soloCritico}
                    onChange={(e) => handleSoloCritico(e.target.checked)}
                  />
                  <span>Solo stock crítico</span>
                </label>
              </div>

              {/* Botón para abrir modal de gestión de categorías (POST /categories) */}
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setCatModalOpen(true)}
              >
                <FolderPlus size={15} /> Gestionar categorías
              </button>
            </div>

            <div className="table-wrap table-scroll">
              <table className="table">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Categoría</th>
                    <th className="num">Stock</th>
                    <th className="num">Mínimo</th>
                    <th>Estado</th>
                    <th className="num">Valor</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {paginados.map((p) => {
                    const cat = categorias?.find((c) => String(c.id) === String(p.categoria))
                    return (
                      <tr key={p.id}>
                        <td>
                          <div className="product-cell">
                            {p.imagenUrl ? (
                              <img
                                src={p.imagenUrl}
                                alt={p.nombre}
                                style={{
                                  width: 34,
                                  height: 34,
                                  borderRadius: 10,
                                  objectFit: 'cover',
                                  border: '1px solid var(--border)',
                                  flexShrink: 0,
                                }}
                              />
                            ) : (
                              <span className="product-emoji">{p.emoji}</span>
                            )}
                            <div>
                              <strong>{p.nombre}</strong>
                              <span className="mono muted">{p.sku}</span>
                            </div>
                          </div>
                        </td>
                        <td className="muted">{cat?.nombre || p.categoriaNombre || p.categoria}</td>
                        <td className={`num stock-number ${p.stock === 0 ? 'stock-zero' : p.stock <= p.minStock ? 'stock-low' : ''}`}>
                          {p.stock}
                        </td>
                        <td className="num muted">{p.minStock}</td>
                        <td>
                          {/* Badges visuales de alerta */}
                          <StockBadge stock={p.stock} minStock={p.minStock} />
                        </td>
                        <td className="num">{money(p.stock * p.costo)}</td>
                        <td className="num">
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            onClick={() => setAjuste(p)}
                          >
                            Ajustar
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>

              {filtrados.length === 0 && (
                <div className="empty-state">
                  <Package size={30} />
                  <h3>Sin productos</h3>
                  <p>No hay artículos que coincidan con el filtro.</p>
                </div>
              )}
            </div>

            {/* NUEVA FUNCIONALIDAD: Controles de Paginación (offset y perPage) */}
            {totalItems > 0 && (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 6px 0',
                  borderTop: '1px solid var(--border)',
                  marginTop: 10,
                  fontSize: 12.5,
                  color: 'var(--text-2)',
                  flexWrap: 'wrap',
                  gap: 10,
                }}
              >
                <div>
                  Mostrando <strong>{offset + 1}</strong> a <strong>{Math.min(offset + perPage, totalItems)}</strong> de <strong>{totalItems}</strong> productos
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span>Filas:</span>
                    <select
                      value={perPage}
                      onChange={(e) => {
                        setPerPage(Number(e.target.value))
                        setOffset(0)
                      }}
                      style={{ height: 28, padding: '0 6px', borderRadius: 6, fontSize: 12 }}
                    >
                      <option value={5}>5</option>
                      <option value={8}>8</option>
                      <option value={15}>15</option>
                      <option value={25}>25</option>
                    </select>
                  </label>

                  <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => cambiarPagina(paginaActual - 1)}
                      disabled={paginaActual <= 1}
                      style={{ padding: '4px 8px' }}
                    >
                      <ChevronLeft size={14} />
                    </button>
                    <span>
                      Pág. {paginaActual} de {totalPaginas}
                    </span>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => cambiarPagina(paginaActual + 1)}
                      disabled={paginaActual >= totalPaginas}
                      style={{ padding: '4px 8px' }}
                    >
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            <div className="table-toolbar">
              <div className="search-box search-sm">
                <Search size={16} />
                <input
                  type="text"
                  placeholder="Buscar por producto, motivo o usuario…"
                  value={movBusqueda}
                  onChange={(e) => setMovBusqueda(e.target.value)}
                />
                {movBusqueda && (
                  <button type="button" className="icon-button" onClick={() => setMovBusqueda('')}>
                    <X size={14} />
                  </button>
                )}
              </div>
              <span className="muted small">Los movimientos más recientes aparecen primero.</span>
            </div>

            <div className="table-wrap table-scroll">
              <table className="table">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Producto</th>
                    <th>Tipo</th>
                    <th className="num">Cantidad</th>
                    <th>Motivo</th>
                    <th>Usuario</th>
                  </tr>
                </thead>
                <tbody>
                  {movFiltrados.map((m) => (
                    <tr key={m.id}>
                      <td className="muted">{fechaHora(m.fecha)}</td>
                      <td className="strong">{m.productName}</td>
                      <td>
                        <span
                          className={`badge badge-sm ${m.tipo === 'entrada' ? 'badge-emerald' : 'badge-rose'}`}
                        >
                          {m.tipo === 'entrada' ? <ArrowDownLeft size={12} /> : <ArrowUpRight size={12} />}
                          {m.tipo === 'entrada' ? 'Entrada' : 'Salida'}
                        </span>
                      </td>
                      <td className={`num strong ${m.tipo === 'entrada' ? 'text-green' : 'text-red'}`}>
                        {m.tipo === 'entrada' ? '+' : '−'}
                        {m.cantidad}
                      </td>
                      <td className="muted">{m.motivo}</td>
                      <td>{m.userName}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {movFiltrados.length === 0 && (
                <div className="empty-state">
                  <PackageSearch size={30} />
                  <h3>Sin movimientos</h3>
                  <p>No hay registros que coincidan con la búsqueda.</p>
                </div>
              )}
            </div>
          </>
        )}
      </section>

      {/* Modal de ajuste de stock para almacén */}
      {ajuste && <AjusteModal producto={ajuste} onClose={() => setAjuste(null)} />}

      {/* Modal de gestión de categorías */}
      {catModalOpen && <CategoriasModal onClose={() => setCatModalOpen(false)} />}
    </div>
  )
}
