import { useMemo, useState } from 'react'
import {
  AlertTriangle,
  Banknote,
  CreditCard,
  Landmark,
  Minus,
  Plus,
  Search,
  ShoppingCart,
  Trash2,
  X,
} from 'lucide-react'
import { METODOS_PAGO } from '../data/seed'
import { useStore } from '../store/StoreContext'
import { money, redondear } from '../utils/format'
import TicketModal from '../components/TicketModal'
import AjusteTicketModal from '../components/AjusteTicketModal'

const ICONOS_PAGO = { Efectivo: Banknote, Tarjeta: CreditCard, Transferencia: Landmark }

export default function POS() {
  const { productos, categorias, currentUser, crearVenta, notificar } = useStore()
  const [busqueda, setBusqueda] = useState('')
  const [categoria, setCategoria] = useState('todas')
  const [carrito, setCarrito] = useState([])
  const [metodoPago, setMetodoPago] = useState('Efectivo')
  const [recibido, setRecibido] = useState('')
  const [ticket, setTicket] = useState(null)
  const [autoImprimir, setAutoImprimir] = useState(false)
  
  // NUEVA FUNCIONALIDAD: Modal para vendedores de ajuste de stock sin alterar BD
  const [ajusteOpen, setAjusteOpen] = useState(false)

  // NUEVA FUNCIONALIDAD: Control de carrito deslizable bottom-sheet para móviles (<640px / <900px)
  const [cartMobileOpen, setCartMobileOpen] = useState(false)

  // Detectar si el usuario es vendedor (permite seller y vendedor)
  const esVendedor = currentUser?.rol === 'vendedor' || currentUser?.rol === 'seller'

  const visibles = useMemo(() => {
    const texto = busqueda.trim().toLowerCase()
    return productos.filter((p) => {
      if (!p.activo) return false
      if (categoria !== 'todas' && String(p.categoria) !== String(categoria)) return false
      if (!texto) return true
      const cat = categorias?.find((c) => String(c.id) === String(p.categoria))?.nombre || p.categoriaNombre || ''
      return (
        p.nombre.toLowerCase().includes(texto) ||
        p.sku.toLowerCase().includes(texto) ||
        cat.toLowerCase().includes(texto)
      )
    })
  }, [productos, busqueda, categoria, categorias])

  const lineas = carrito
    .map((c) => {
      const prod = productos.find((p) => p.id === c.productId)
      return prod ? { ...c, prod } : null
    })
    .filter(Boolean)

  const subtotal = redondear(lineas.reduce((s, l) => s + l.prod.precio * l.qty, 0))
  const iva = redondear(subtotal * 0.16)
  const total = redondear(subtotal + iva)
  const cantidadArticulos = lineas.reduce((s, l) => s + l.qty, 0)
  const recibidoNum = Number(recibido) || 0
  const cambio = redondear(recibidoNum - total)
  const efectivoInsuficiente = metodoPago === 'Efectivo' && recibidoNum < total
  const puedeCobrar = lineas.length > 0 && !efectivoInsuficiente

  const enCarrito = (productId) =>
    carrito.find((c) => c.productId === productId)?.qty || 0

  const agregar = (producto) => {
    if (producto.stock <= 0) {
      notificar(`${producto.nombre} está agotado`, 'error')
      return
    }
    if (enCarrito(producto.id) >= producto.stock) {
      notificar(`Solo hay ${producto.stock} unidades de ${producto.nombre}`, 'info')
      return
    }
    setCarrito((prev) => {
      const existe = prev.find((c) => c.productId === producto.id)
      if (existe) {
        return prev.map((c) =>
          c.productId === producto.id ? { ...c, qty: c.qty + 1 } : c,
        )
      }
      return [...prev, { productId: producto.id, qty: 1 }]
    })
  }

  const cambiarCantidad = (productId, delta) => {
    const prod = productos.find((p) => p.id === productId)
    if (!prod) return
    if (delta > 0 && enCarrito(productId) >= prod.stock) {
      notificar(`Stock máximo alcanzado (${prod.stock})`, 'info')
      return
    }
    setCarrito((prev) =>
      prev
        .map((c) => (c.productId === productId ? { ...c, qty: c.qty + delta } : c))
        .filter((c) => c.qty > 0),
    )
  }

  const quitar = (productId) =>
    setCarrito((prev) => prev.filter((c) => c.productId !== productId))

  const vaciar = () => {
    setCarrito([])
    setRecibido('')
  }

  /**
   * Cobrar y generar ticket: Al completar la venta con POST /purchases,
   * se muestra el ticket de 80mm y se activa window.print().
   */
  const cobrar = async () => {
    if (!puedeCobrar) return
    const venta = await crearVenta({
      items: lineas.map((l) => ({ productId: l.prod.id, qty: l.qty })),
      metodoPago,
      recibido: metodoPago === 'Efectivo' ? recibidoNum : total,
    })
    if (venta) {
      setTicket(venta)
      setAutoImprimir(true) // Activar window.print() automático
      setCarrito([])
      setRecibido('')
      setCartMobileOpen(false)
    }
  }

  // Renderizador reutilizable del contenido del Carrito (usado en Desktop y en Bottom Sheet móvil)
  const renderContenidoCarrito = (enModal = false) => (
    <>
      <header className="cart-head">
        <div>
          <h3>
            <ShoppingCart size={18} /> Ticket actual
          </h3>
          <p>
            Atiende: <strong>{currentUser?.nombre}</strong>
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {cantidadArticulos > 0 && (
            <button type="button" className="link-btn danger" onClick={vaciar}>
              <Trash2 size={14} /> Vaciar
            </button>
          )}
          {enModal && (
            <button
              type="button"
              className="icon-button"
              onClick={() => setCartMobileOpen(false)}
              aria-label="Cerrar ticket móvil"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </header>

      <div className="cart-items">
        {lineas.length === 0 ? (
          <div className="cart-empty">
            <ShoppingCart size={34} />
            <h4>El ticket está vacío</h4>
            <p>Selecciona productos del catálogo para comenzar la venta.</p>
          </div>
        ) : (
          lineas.map((l) => (
            <div className="cart-line" key={l.prod.id}>
              <span className="product-emoji">{l.prod.emoji}</span>
              <div className="cart-line-info">
                <strong>{l.prod.nombre}</strong>
                <span>{money(l.prod.precio)} c/u</span>
                <div className="qty-control">
                  <button
                    type="button"
                    onClick={() => cambiarCantidad(l.prod.id, -1)}
                    aria-label="Quitar uno"
                  >
                    <Minus size={13} />
                  </button>
                  <span>{l.qty}</span>
                  <button
                    type="button"
                    onClick={() => cambiarCantidad(l.prod.id, 1)}
                    aria-label="Agregar uno"
                  >
                    <Plus size={13} />
                  </button>
                </div>
              </div>
              <div className="cart-line-right">
                <strong>{money(l.prod.precio * l.qty)}</strong>
                <button
                  type="button"
                  className="icon-button"
                  onClick={() => quitar(l.prod.id)}
                  aria-label="Eliminar producto"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="cart-summary">
        <div className="summary-row">
          <span>Subtotal</span>
          <span>{money(subtotal)}</span>
        </div>
        <div className="summary-row">
          <span>IVA (16%)</span>
          <span>{money(iva)}</span>
        </div>
        <div className="summary-row summary-total">
          <span>Total</span>
          <strong>{money(total)}</strong>
        </div>
      </div>

      <div className="pay-section">
        <span className="section-label">Método de pago</span>
        <div className="pay-methods">
          {METODOS_PAGO.map((m) => {
            const Icono = ICONOS_PAGO[m]
            return (
              <button
                key={m}
                type="button"
                className={`pay-btn ${metodoPago === m ? 'pay-active' : ''}`}
                onClick={() => setMetodoPago(m)}
              >
                <Icono size={16} />
                {m}
              </button>
            )
          })}
        </div>

        {metodoPago === 'Efectivo' && (
          <div className="cash-section">
            <div className="cash-row">
              <label htmlFor={enModal ? 'recibido-modal' : 'recibido'}>Efectivo recibido</label>
              <div className="cash-input">
                <span>$</span>
                <input
                  id={enModal ? 'recibido-modal' : 'recibido'}
                  type="number"
                  min="0"
                  step="0.50"
                  placeholder={total ? total.toFixed(2) : '0.00'}
                  value={recibido}
                  onChange={(e) => setRecibido(e.target.value)}
                />
                {total > 0 && (
                  <button
                    type="button"
                    className="exact-btn"
                    onClick={() => setRecibido(total.toFixed(2))}
                  >
                    Exacto
                  </button>
                )}
              </div>
            </div>
            <div className={`change-row ${efectivoInsuficiente ? 'change-bad' : ''}`}>
              <span>Cambio</span>
              <strong>{money(Math.max(0, cambio))}</strong>
            </div>
            {efectivoInsuficiente && lineas.length > 0 && (
              <p className="field-error">El efectivo recibido no cubre el total.</p>
            )}
          </div>
        )}

        <button
          type="button"
          className="btn btn-success btn-block"
          onClick={cobrar}
          disabled={!puedeCobrar}
        >
          Cobrar y generar ticket · {money(total)}
        </button>

        {/* NUEVA FUNCIONALIDAD: Botón exclusivo para vendedores para generar ticket de ajuste */}
        {esVendedor && (
          <button
            type="button"
            className="btn btn-warning btn-block btn-ajuste-stock"
            onClick={() => setAjusteOpen(true)}
            style={{ marginTop: 8 }}
          >
            <AlertTriangle size={16} /> Generar Ticket de Ajuste de Stock
          </button>
        )}

        <p className="cart-note">
          El stock se descuenta automáticamente con POST /purchases. Solo almacén y administración
          tienen autorización de modificar catálogo directamente.
        </p>
      </div>
    </>
  )

  return (
    <div className="pos-layout">
      <section className="pos-catalogo">
        <div className="pos-toolbar">
          <div className="search-box">
            <Search size={17} />
            <input
              type="text"
              placeholder="Buscar por nombre, SKU o categoría…"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
            {busqueda && (
              <button type="button" className="icon-button" onClick={() => setBusqueda('')}>
                <X size={15} />
              </button>
            )}
          </div>
          <span className="pos-count">{visibles.length} productos</span>
        </div>

        {/* Chips de filtro por categorías dinámicas */}
        <div className="chips">
          <button
            type="button"
            className={`chip ${categoria === 'todas' ? 'chip-active' : ''}`}
            onClick={() => setCategoria('todas')}
          >
            Todos
          </button>
          {categorias?.map((c) => (
            <button
              key={c.id}
              type="button"
              className={`chip ${categoria === c.id ? 'chip-active' : ''}`}
              onClick={() => setCategoria(c.id)}
            >
              <span>{c.emoji || '📦'}</span>
              {c.nombre}
            </button>
          ))}
        </div>

        {visibles.length === 0 ? (
          <div className="empty-state">
            <Search size={30} />
            <h3>Sin resultados</h3>
            <p>Prueba con otro nombre, SKU o categoría.</p>
          </div>
        ) : (
          <div className="product-grid">
            {visibles.map((p) => {
              const agotado = p.stock <= 0
              const cat = categorias?.find((c) => c.id === p.categoria)
              return (
                <button
                  key={p.id}
                  type="button"
                  className={`product-card ${agotado ? 'agotado' : ''}`}
                  onClick={() => agregar(p)}
                  disabled={agotado}
                >
                  {p.imagenUrl ? (
                    <div style={{ width: '100%', height: 110, borderRadius: 10, overflow: 'hidden', background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <img
                        src={p.imagenUrl}
                        alt={p.nombre}
                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                        }}
                      />
                    </div>
                  ) : (
                    <span className="product-emoji product-emoji-lg">{p.emoji}</span>
                  )}
                  <span className="product-cat">{cat?.nombre || p.categoriaNombre || 'General'}</span>
                  <strong className="product-name">{p.nombre}</strong>
                  <span className="product-sku mono">{p.sku}</span>
                  <span className="product-foot">
                    <span className="product-price">{money(p.precio)}</span>
                    <span className={`stock-pill ${p.stock <= p.minStock ? 'stock-low' : ''}`}>
                      {agotado ? 'Agotado' : `${p.stock} pzas`}
                    </span>
                  </span>
                  {!agotado && (
                    <span className="product-add">
                      <Plus size={15} /> Agregar
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        )}
      </section>

      {/* Carrito lateral en escritorio */}
      <aside className="pos-carrito card">
        {renderContenidoCarrito(false)}
      </aside>

      {/* Botón flotante para abrir el carrito en móviles (<900px / <640px) */}
      <button
        type="button"
        className="pos-cart-toggle"
        onClick={() => setCartMobileOpen(true)}
      >
        <ShoppingCart size={18} />
        <span>Ver ticket</span>
        {cantidadArticulos > 0 && <span className="cart-badge">{cantidadArticulos}</span>}
        <span>· {money(total)}</span>
      </button>

      {/* Overlay para fondo oscuro al abrir el carrito en móvil */}
      {cartMobileOpen && (
        <div
          className="cart-overlay cart-overlay-open"
          onClick={() => setCartMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Bottom Sheet deslizable del carrito en móvil */}
      <div className={`pos-carrito-sheet ${cartMobileOpen ? 'sheet-open' : ''}`}>
        <div className="sheet-drag-handle" />
        {renderContenidoCarrito(true)}
      </div>

      {/* Modal de Solicitud de Ajuste de Stock (exclusivo para vendedores) */}
      {ajusteOpen && <AjusteTicketModal onClose={() => setAjusteOpen(false)} />}

      {/* Modal de Comprobante / Ticket con @media print y window.print() */}
      <TicketModal
        venta={ticket}
        autoPrint={autoImprimir}
        onClose={() => {
          setTicket(null)
          setAutoImprimir(false)
        }}
      />
    </div>
  )
}
