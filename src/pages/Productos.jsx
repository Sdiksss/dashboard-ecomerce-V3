import { useMemo, useRef, useState } from 'react'
import {
  Image as ImageIcon,
  Package,
  Pencil,
  Plus,
  Search,
  UploadCloud,
  X,
} from 'lucide-react'
import { EMOJIS } from '../data/seed'
import { useStore } from '../store/StoreContext'
import { money } from '../utils/format'
import Modal from '../components/Modal'
import { StockBadge } from '../components/Badges'

// -----------------------------------------------------------------------------
// Formulario de Producto: Alta (POST /products) y Edición (PUT /products/:id)
// Incluye subida de imágenes por FormData a POST /images
// -----------------------------------------------------------------------------
function ProductoForm({ producto, onClose }) {
  const { productos, categorias, agregarProducto, actualizarProducto, subirImagen } = useStore()
  const fileInputRef = useRef(null)

  const [form, setForm] = useState(() =>
    producto
      ? {
          nombre: producto.nombre,
          sku: producto.sku,
          categoria: producto.categoria,
          precio: String(producto.precio),
          costo: String(producto.costo),
          stock: String(producto.stock),
          minStock: String(producto.minStock),
          emoji: producto.emoji || '📦',
          imagenUrl: producto.imagenUrl || '',
        }
      : {
          nombre: '',
          sku: '',
          categoria: categorias?.[0]?.id || 'bebidas',
          precio: '',
          costo: '',
          stock: '0',
          minStock: '5',
          emoji: '📦',
          imagenUrl: '',
        },
  )
  const [errores, setErrores] = useState({})
  const [subiendoImg, setSubiendoImg] = useState(false)

  const set = (campo, valor) => {
    setForm((f) => ({ ...f, [campo]: valor }))
    setErrores((e) => ({ ...e, [campo]: undefined }))
  }

  // NUEVA FUNCIONALIDAD: Manejo de subida de imágenes vía FormData a POST /images
  const handleSeleccionarArchivo = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setSubiendoImg(true)
    try {
      const url = await subirImagen(file)
      if (url) {
        set('imagenUrl', url)
      }
    } catch (err) {
      console.warn('Error al subir imagen:', err)
    } finally {
      setSubiendoImg(false)
    }
  }

  const enviar = async (e) => {
    e.preventDefault()
    const errs = {}
    if (!form.nombre.trim()) errs.nombre = 'El nombre es obligatorio.'
    if (!form.sku.trim()) errs.sku = 'El SKU es obligatorio.'
    else if (
      productos.some(
        (p) =>
          p.sku.toLowerCase() === form.sku.trim().toLowerCase() &&
          p.id !== producto?.id,
      )
    ) {
      errs.sku = 'Ya existe un producto con ese SKU.'
    }
    if (form.precio === '' || Number(form.precio) <= 0) errs.precio = 'Ingresa un precio válido.'
    if (form.costo === '' || Number(form.costo) < 0) errs.costo = 'Ingresa un costo válido.'
    if (form.stock === '' || Number(form.stock) < 0 || !Number.isInteger(Number(form.stock)))
      errs.stock = 'Stock inválido.'
    if (
      form.minStock === '' ||
      Number(form.minStock) < 0 ||
      !Number.isInteger(Number(form.minStock))
    )
      errs.minStock = 'Mínimo inválido.'

    if (Object.keys(errs).length) {
      setErrores(errs)
      return
    }

    if (producto) {
      // Edición por ID: PUT /products/:id
      await actualizarProducto(producto.id, form)
    } else {
      // Alta de producto: POST /products
      await agregarProducto(form)
    }
    onClose()
  }

  const margen =
    Number(form.precio) > 0
      ? Math.round(((Number(form.precio) - Number(form.costo)) / Number(form.precio)) * 100)
      : 0

  return (
    <Modal
      titulo={producto ? 'Editar producto' : 'Nuevo producto'}
      subtitulo={producto ? `${producto.sku} · ${producto.nombre}` : 'Agrega un artículo al catálogo comercial'}
      onClose={onClose}
      ancho={620}
    >
      <form className="form-stack" onSubmit={enviar}>
        <div className="form-grid">
          <label className={`field field-full ${errores.nombre ? 'field-invalid' : ''}`}>
            <span>Nombre del producto</span>
            <input
              type="text"
              value={form.nombre}
              onChange={(e) => set('nombre', e.target.value)}
              placeholder="Ej. Café molido 250 g"
              autoFocus
            />
            {errores.nombre && <small className="field-error">{errores.nombre}</small>}
          </label>

          <label className={`field ${errores.sku ? 'field-invalid' : ''}`}>
            <span>SKU</span>
            <input
              type="text"
              value={form.sku}
              onChange={(e) => set('sku', e.target.value)}
              placeholder="BEB-001"
            />
            {errores.sku && <small className="field-error">{errores.sku}</small>}
          </label>

          <label className="field">
            <span>Categoría</span>
            <select
              value={form.categoria}
              onChange={(e) => set('categoria', e.target.value)}
            >
              {categorias?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.emoji || '📦'} {c.nombre}
                </option>
              ))}
            </select>
          </label>

          <label className={`field ${errores.precio ? 'field-invalid' : ''}`}>
            <span>Precio de venta</span>
            <div className="input-prefix">
              <span>$</span>
              <input
                type="number"
                min="0"
                step="0.50"
                value={form.precio}
                onChange={(e) => set('precio', e.target.value)}
                placeholder="0.00"
              />
            </div>
            {errores.precio && <small className="field-error">{errores.precio}</small>}
          </label>

          <label className={`field ${errores.costo ? 'field-invalid' : ''}`}>
            <span>Costo de compra</span>
            <div className="input-prefix">
              <span>$</span>
              <input
                type="number"
                min="0"
                step="0.50"
                value={form.costo}
                onChange={(e) => set('costo', e.target.value)}
                placeholder="0.00"
              />
            </div>
            {errores.costo && <small className="field-error">{errores.costo}</small>}
          </label>

          <label className={`field ${errores.stock ? 'field-invalid' : ''}`}>
            <span>Stock {producto ? 'actual' : 'inicial'}</span>
            <input
              type="number"
              min="0"
              step="1"
              value={form.stock}
              onChange={(e) => set('stock', e.target.value)}
            />
            {errores.stock && <small className="field-error">{errores.stock}</small>}
          </label>

          <label className={`field ${errores.minStock ? 'field-invalid' : ''}`}>
            <span>Stock mínimo</span>
            <input
              type="number"
              min="0"
              step="1"
              value={form.minStock}
              onChange={(e) => set('minStock', e.target.value)}
            />
            {errores.minStock && <small className="field-error">{errores.minStock}</small>}
          </label>

          {/* NUEVA FUNCIONALIDAD: Zona de subida de imágenes (POST /images vía FormData) */}
          <div className="field field-full">
            <span>Imagen del producto (POST /images)</span>
            <div
              style={{
                border: '2px dashed var(--border-strong)',
                borderRadius: 12,
                padding: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                background: 'var(--surface-2)',
              }}
            >
              {form.imagenUrl ? (
                <div style={{ position: 'relative', width: 64, height: 64, borderRadius: 10, overflow: 'hidden', border: '1px solid var(--border)' }}>
                  <img
                    src={form.imagenUrl}
                    alt="Preview"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <button
                    type="button"
                    onClick={() => set('imagenUrl', '')}
                    style={{
                      position: 'absolute',
                      top: 2,
                      right: 2,
                      background: 'rgba(0,0,0,0.6)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '50%',
                      width: 18,
                      height: 18,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                    }}
                    title="Quitar imagen"
                  >
                    <X size={12} />
                  </button>
                </div>
              ) : (
                <div
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 10,
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 28,
                    flexShrink: 0,
                  }}
                >
                  {form.emoji}
                </div>
              )}

              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text)' }}>
                  {form.imagenUrl ? 'Imagen asociada' : 'Sube una imagen o foto comercial'}
                </p>
                <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
                  Soporta PNG, JPG o WEBP. Se enviará vía FormData a <code>POST /images</code>.
                </p>
                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleSeleccionarArchivo}
                    style={{ display: 'none' }}
                  />
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={subiendoImg}
                  >
                    <UploadCloud size={14} />
                    {subiendoImg ? 'Subiendo...' : form.imagenUrl ? 'Cambiar imagen' : 'Seleccionar archivo'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="field field-full">
            <span>O selecciona un icono representativo</span>
            <div className="emoji-picker">
              {EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  className={`emoji-option ${form.emoji === emoji ? 'emoji-active' : ''}`}
                  onClick={() => set('emoji', emoji)}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="form-note">
          Margen estimado: <strong>{margen}%</strong>
          {producto && ' · Los cambios de stock quedan registrados en el historial de almacén.'}
        </div>

        <div className="modal-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" className="btn btn-primary">
            {producto ? 'Guardar cambios (PUT)' : 'Crear producto (POST)'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

// -----------------------------------------------------------------------------
// Componente de Catálogo de Productos
// -----------------------------------------------------------------------------
export default function Productos() {
  const { productos, categorias, alternarProducto } = useStore()
  const [busqueda, setBusqueda] = useState('')
  const [categoria, setCategoria] = useState('todas')
  const [editando, setEditando] = useState(null)
  const [creando, setCreando] = useState(false)

  const filtrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase()
    return productos.filter((p) => {
      if (categoria !== 'todas' && String(p.categoria) !== String(categoria)) return false
      if (!texto) return true
      return p.nombre.toLowerCase().includes(texto) || p.sku.toLowerCase().includes(texto)
    })
  }, [productos, busqueda, categoria])

  return (
    <div className="page-stack">
      <section className="card">
        <header className="card-head toolbar-head">
          <div>
            <h3>Catálogo de productos</h3>
            <p>{productos.length} productos · {productos.filter((p) => p.activo).length} activos</p>
          </div>
          <button type="button" className="btn btn-primary" onClick={() => setCreando(true)}>
            <Plus size={17} />
            Nuevo producto (POST)
          </button>
        </header>

        <div className="table-toolbar">
          <div className="search-box search-sm">
            <Search size={16} />
            <input
              type="text"
              placeholder="Buscar por nombre o SKU…"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
            {busqueda && (
              <button type="button" className="icon-button" onClick={() => setBusqueda('')}>
                <X size={14} />
              </button>
            )}
          </div>
          <select value={categoria} onChange={(e) => setCategoria(e.target.value)}>
            <option value="todas">Todas las categorías</option>
            {categorias?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.emoji || '📦'} {c.nombre}
              </option>
            ))}
          </select>
        </div>

        <div className="table-wrap table-scroll">
          <table className="table">
            <thead>
              <tr>
                <th>Producto</th>
                <th>Categoría</th>
                <th className="num">Precio</th>
                <th className="num">Costo</th>
                <th className="num">Margen</th>
                <th className="num">Stock</th>
                <th>Estado</th>
                <th className="num">Activo</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filtrados.map((p) => {
                const cat = categorias?.find((c) => String(c.id) === String(p.categoria))
                const margen =
                  p.precio > 0 ? Math.round(((p.precio - p.costo) / p.precio) * 100) : 0
                return (
                  <tr key={p.id} className={p.activo ? '' : 'row-inactive'}>
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
                    <td className="num strong">{money(p.precio)}</td>
                    <td className="num muted">{money(p.costo)}</td>
                    <td className="num">{margen}%</td>
                    <td className="num">
                      <span className={p.stock <= p.minStock ? 'text-red strong' : ''}>{p.stock}</span>
                      <span className="muted"> / {p.minStock}</span>
                    </td>
                    <td>
                      <StockBadge stock={p.stock} minStock={p.minStock} />
                    </td>
                    <td className="num">
                      <button
                        type="button"
                        className={`switch ${p.activo ? 'switch-on' : ''}`}
                        onClick={() => alternarProducto(p.id)}
                        aria-label={p.activo ? 'Desactivar producto' : 'Activar producto'}
                        title={p.activo ? 'Desactivar' : 'Activar'}
                      >
                        <span />
                      </button>
                    </td>
                    <td className="num">
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() => setEditando(p)}
                      >
                        <Pencil size={14} /> Editar
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
              <p>Prueba con otra búsqueda o categoría.</p>
            </div>
          )}
        </div>
      </section>

      {creando && <ProductoForm onClose={() => setCreando(false)} />}
      {editando && <ProductoForm producto={editando} onClose={() => setEditando(null)} />}
    </div>
  )
}
