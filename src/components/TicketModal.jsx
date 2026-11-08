import { useEffect } from 'react'
import { Printer, X } from 'lucide-react'
import { fechaHora, money } from '../utils/format'

export default function TicketModal({ venta, onClose, autoPrint = false }) {
  useEffect(() => {
    const manejar = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', manejar)
    return () => window.removeEventListener('keydown', manejar)
  }, [onClose])

  // NUEVA FUNCIONALIDAD: Activa window.print() automáticamente al confirmar venta
  useEffect(() => {
    if (venta && autoPrint) {
      const timer = setTimeout(() => {
        window.print()
      }, 450)
      return () => clearTimeout(timer)
    }
  }, [venta, autoPrint])

  if (!venta) return null

  return (
    <div
      className="modal-overlay ticket-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="ticket-card">
        {/* Contenedor imprimible formato 80mm */}
        <div className="ticket-print" id="ticket-print">
          <div className="ticket-receipt">
            <div className="ticket-logo">🛍️</div>
            <h3>Mercado Aurora</h3>
            <p className="ticket-sub">Av. Reforma 120, Centro · Tel. 55 1234 5678</p>
            <p className="ticket-sub">RFC: MAU230101H23</p>

            <div className="ticket-divider" />

            <div className="ticket-row">
              <span>Folio</span>
              <strong>{venta.folio}</strong>
            </div>
            <div className="ticket-row">
              <span>Fecha</span>
              <span>{fechaHora(venta.fecha)}</span>
            </div>
            <div className="ticket-row">
              <span>Atendió</span>
              <span>{venta.sellerName}</span>
            </div>
            <div className="ticket-row">
              <span>Pago</span>
              <span>{venta.metodoPago}</span>
            </div>

            <div className="ticket-divider" />

            <div className="ticket-items">
              {venta.items.map((it) => (
                <div className="ticket-item" key={it.productId}>
                  <div className="ticket-item-info">
                    <span className="ticket-item-name">
                      {it.emoji} {it.nombre}
                    </span>
                    <span className="ticket-item-qty">
                      {it.qty} × {money(it.precio)}
                    </span>
                  </div>
                  <span className="ticket-item-amount">{money(it.importe)}</span>
                </div>
              ))}
            </div>

            <div className="ticket-divider" />

            <div className="ticket-row">
              <span>Subtotal</span>
              <span>{money(venta.subtotal)}</span>
            </div>
            <div className="ticket-row">
              <span>IVA (16%)</span>
              <span>{money(venta.impuesto)}</span>
            </div>
            <div className="ticket-row ticket-total">
              <span>TOTAL</span>
              <strong>{money(venta.total)}</strong>
            </div>

            {venta.metodoPago === 'Efectivo' && (
              <>
                <div className="ticket-divider" />
                <div className="ticket-row">
                  <span>Recibido</span>
                  <span>{money(venta.recibido)}</span>
                </div>
                <div className="ticket-row">
                  <span>Cambio</span>
                  <span>{money(venta.cambio)}</span>
                </div>
              </>
            )}

            <div className="ticket-divider" />
            <p className="ticket-thanks">¡Gracias por su compra!</p>
            <p className="ticket-sub">Conserve su ticket para cambios y aclaraciones</p>
            <div className="ticket-barcode" aria-hidden="true" />
            <p className="ticket-folio-small">{venta.folio}</p>
          </div>
        </div>

        <div className="ticket-actions no-print">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            <X size={17} />
            Cerrar
          </button>
          <button type="button" className="btn btn-primary" onClick={() => window.print()}>
            <Printer size={17} />
            Imprimir ticket (80mm)
          </button>
        </div>
      </div>
    </div>
  )
}
