// AjusteTicketModal.jsx
// NUEVA FUNCIONALIDAD: Modal para que vendedores reporten errores de stock
// sin modificar el inventario directamente. Solo genera un reporte visual.
import { useState } from 'react'
import { AlertTriangle, CheckCircle2, Printer, TicketX } from 'lucide-react'
import Modal from './Modal'
import { CATEGORIAS } from '../data/seed'
import { useStore } from '../store/StoreContext'
import { fechaHora } from '../utils/format'

export default function AjusteTicketModal({ onClose }) {
  const { productos, categorias, currentUser, notificar } = useStore()
  const [paso, setPaso] = useState('form') // 'form' | 'confirmado'
  const [form, setForm] = useState({
    productId: '',
    tipo: 'diferencia',
    cantidadReportada: '',
    motivo: '',
  })
  const [errores, setErrores] = useState({})
  const [ticket, setTicket] = useState(null)

  const productosActivos = productos.filter((p) => p.activo)

  const set = (campo, valor) => {
    setForm((f) => ({ ...f, [campo]: valor }))
    setErrores((e) => ({ ...e, [campo]: undefined }))
  }

  const enviar = (e) => {
    e.preventDefault()
    const errs = {}
    if (!form.productId) errs.productId = 'Selecciona un producto.'
    if (!form.cantidadReportada || Number(form.cantidadReportada) <= 0)
      errs.cantidadReportada = 'Ingresa una cantidad válida.'
    if (!form.motivo.trim()) errs.motivo = 'Describe el problema brevemente.'
    if (Object.keys(errs).length) {
      setErrores(errs)
      return
    }

    const producto = productos.find((p) => p.id === form.productId)
    const folioTicket = `TAJ-${Date.now().toString(36).toUpperCase()}`

    // Genera el objeto del ticket de ajuste (NO modifica stock)
    const ticketGenerado = {
      folio: folioTicket,
      fecha: new Date().toISOString(),
      vendedor: currentUser.nombre,
      producto: producto.nombre,
      sku: producto.sku,
      stockSistema: producto.stock,
      cantidadReportada: Number(form.cantidadReportada),
      tipo: form.tipo,
      motivo: form.motivo,
    }

    setTicket(ticketGenerado)
    setPaso('confirmado')
    notificar(`Ticket de ajuste ${folioTicket} generado — pendiente de revisión por almacén`, 'info')
  }

  const imprimir = () => window.print()

  return (
    <Modal
      titulo={paso === 'form' ? 'Reportar error de stock' : 'Ticket generado'}
      subtitulo={
        paso === 'form'
          ? 'El reporte será revisado por almacén. No modifica el inventario.'
          : `Folio: ${ticket?.folio}`
      }
      onClose={onClose}
      ancho={500}
    >
      {paso === 'form' ? (
        <form className="form-stack" onSubmit={enviar}>
          {/* Banner informativo */}
          <div className="ajuste-info-banner">
            <AlertTriangle size={16} />
            <p>
              Este formulario <strong>no modifica</strong> el stock del sistema. Solo genera un
              ticket de solicitud para que el equipo de almacén verifique y corrija.
            </p>
          </div>

          {/* Selector de producto */}
          <label className={`field ${errores.productId ? 'field-invalid' : ''}`}>
            <span>Producto con discrepancia</span>
            <select value={form.productId} onChange={(e) => set('productId', e.target.value)}>
              <option value="">— Selecciona un producto —</option>
              {productosActivos.map((p) => {
                const cat = (categorias || CATEGORIAS).find((c) => c.id === p.categoria)
                return (
                  <option key={p.id} value={p.id}>
                    {p.emoji} {p.nombre} · SKU {p.sku} · Stock: {p.stock}
                  </option>
                )
              })}
            </select>
            {errores.productId && <small className="field-error">{errores.productId}</small>}
          </label>

          {/* Tipo de discrepancia */}
          <label className="field">
            <span>Tipo de discrepancia</span>
            <select value={form.tipo} onChange={(e) => set('tipo', e.target.value)}>
              <option value="diferencia">Diferencia de conteo (hay más o menos que el sistema)</option>
              <option value="danado">Producto dañado / no vendible</option>
              <option value="perdida">Pérdida o extravío</option>
              <option value="otro">Otro</option>
            </select>
          </label>

          {/* Cantidad real observada */}
          <label className={`field ${errores.cantidadReportada ? 'field-invalid' : ''}`}>
            <span>Cantidad observada en físico</span>
            <input
              type="number"
              min="0"
              step="1"
              placeholder="¿Cuántas unidades hay físicamente?"
              value={form.cantidadReportada}
              onChange={(e) => set('cantidadReportada', e.target.value)}
              autoFocus
            />
            {errores.cantidadReportada && (
              <small className="field-error">{errores.cantidadReportada}</small>
            )}
          </label>

          {/* Descripción del problema */}
          <label className={`field ${errores.motivo ? 'field-invalid' : ''}`}>
            <span>Descripción del problema</span>
            <textarea
              rows={3}
              placeholder="Ej. Al contar el anaquel, encontré 8 unidades pero el sistema marca 15…"
              value={form.motivo}
              onChange={(e) => set('motivo', e.target.value)}
              style={{ resize: 'vertical', minHeight: 70 }}
            />
            {errores.motivo && <small className="field-error">{errores.motivo}</small>}
          </label>

          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary">
              <TicketX size={16} /> Generar ticket de ajuste
            </button>
          </div>
        </form>
      ) : (
        // Vista de confirmación del ticket generado
        <div className="ajuste-confirmado no-print-wrapper">
          <div className="ajuste-success-icon">
            <CheckCircle2 size={40} />
          </div>
          <h4>Ticket enviado a almacén</h4>
          <p>El equipo de almacén recibirá este reporte para verificar y corregir el inventario.</p>

          {/* Ticket imprimible */}
          <div className="ajuste-ticket-preview ticket-print" id="ticket-print">
            <div className="ticket-receipt">
              <div className="ticket-logo">⚠️</div>
              <h3>Ticket de Ajuste de Stock</h3>
              <p className="ticket-sub">Mercado Aurora · Reporte interno</p>

              <div className="ticket-divider" />

              <div className="ticket-row">
                <span>Folio</span>
                <strong>{ticket?.folio}</strong>
              </div>
              <div className="ticket-row">
                <span>Fecha</span>
                <span>{ticket?.fecha ? fechaHora(ticket.fecha) : ''}</span>
              </div>
              <div className="ticket-row">
                <span>Reportó</span>
                <span>{ticket?.vendedor}</span>
              </div>

              <div className="ticket-divider" />

              <div className="ticket-row">
                <span>Producto</span>
                <strong>{ticket?.producto}</strong>
              </div>
              <div className="ticket-row">
                <span>SKU</span>
                <span>{ticket?.sku}</span>
              </div>
              <div className="ticket-row">
                <span>Stock en sistema</span>
                <span>{ticket?.stockSistema} uds.</span>
              </div>
              <div className="ticket-row">
                <span>Conteo físico</span>
                <strong style={{ color: '#dc2626' }}>{ticket?.cantidadReportada} uds.</strong>
              </div>
              <div className="ticket-row">
                <span>Diferencia</span>
                <strong>
                  {ticket ? ticket.cantidadReportada - ticket.stockSistema : 0} uds.
                </strong>
              </div>

              <div className="ticket-divider" />

              <div style={{ fontSize: 11, lineHeight: 1.5 }}>
                <strong>Tipo:</strong> {ticket?.tipo}<br />
                <strong>Descripción:</strong> {ticket?.motivo}
              </div>

              <div className="ticket-divider" />
              <p className="ticket-thanks">Pendiente de revisión por almacén</p>
              <p className="ticket-sub">No modifica el inventario del sistema</p>
            </div>
          </div>

          <div className="modal-actions" style={{ marginTop: 16 }}>
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Cerrar
            </button>
            <button type="button" className="btn btn-primary" onClick={imprimir}>
              <Printer size={16} /> Imprimir ticket
            </button>
          </div>
        </div>
      )}
    </Modal>
  )
}
