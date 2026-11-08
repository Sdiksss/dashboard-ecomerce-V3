import { useEffect } from 'react'
import { X } from 'lucide-react'

export default function Modal({ titulo, subtitulo, onClose, children, ancho = 520 }) {
  useEffect(() => {
    const manejar = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', manejar)
    return () => window.removeEventListener('keydown', manejar)
  }, [onClose])

  return (
    <div
      className="modal-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="modal-card" style={{ maxWidth: ancho }} role="dialog" aria-modal="true">
        <div className="modal-head">
          <div>
            <h3>{titulo}</h3>
            {subtitulo && <p>{subtitulo}</p>}
          </div>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Cerrar">
            <X size={18} />
          </button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  )
}
