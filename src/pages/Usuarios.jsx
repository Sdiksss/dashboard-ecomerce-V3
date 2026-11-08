import { useState } from 'react'
import { Check, Minus, ShieldCheck, UserPlus } from 'lucide-react'
import { ROLES } from '../data/seed'
import { useStore } from '../store/StoreContext'
import { money } from '../utils/format'
import Avatar from '../components/Avatar'
import Modal from '../components/Modal'
import { RolBadge } from '../components/Badges'

const SECCIONES = [
  { id: 'dashboard', nombre: 'Panel general' },
  { id: 'pos', nombre: 'Punto de venta' },
  { id: 'ventas', nombre: 'Ventas y tickets' },
  { id: 'almacen', nombre: 'Almacén' },
  { id: 'productos', nombre: 'Edición de productos' },
  { id: 'usuarios', nombre: 'Usuarios' },
]

function UsuarioForm({ onClose }) {
  const { usuarios, agregarUsuario } = useStore()
  const [form, setForm] = useState({ nombre: '', email: '', rol: 'vendedor' })
  const [errores, setErrores] = useState({})

  const set = (campo, valor) => {
    setForm((f) => ({ ...f, [campo]: valor }))
    setErrores((e) => ({ ...e, [campo]: undefined }))
  }

  const enviar = (e) => {
    e.preventDefault()
    const errs = {}
    if (!form.nombre.trim()) errs.nombre = 'El nombre es obligatorio.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) errs.email = 'Correo inválido.'
    else if (usuarios.some((u) => u.email.toLowerCase() === form.email.trim().toLowerCase()))
      errs.email = 'Ese correo ya está registrado.'

    if (Object.keys(errs).length) {
      setErrores(errs)
      return
    }
    agregarUsuario(form)
    onClose()
  }

  return (
    <Modal
      titulo="Nuevo usuario"
      subtitulo="Crea una cuenta y asígnale un rol con permisos específicos."
      onClose={onClose}
      ancho={500}
    >
      <form className="form-stack" onSubmit={enviar}>
        <label className={`field ${errores.nombre ? 'field-invalid' : ''}`}>
          <span>Nombre completo</span>
          <input
            type="text"
            value={form.nombre}
            onChange={(e) => set('nombre', e.target.value)}
            placeholder="Ej. Sofía Herrera"
            autoFocus
          />
          {errores.nombre && <small className="field-error">{errores.nombre}</small>}
        </label>

        <label className={`field ${errores.email ? 'field-invalid' : ''}`}>
          <span>Correo electrónico</span>
          <input
            type="email"
            value={form.email}
            onChange={(e) => set('email', e.target.value)}
            placeholder="sofia@aurora.mx"
          />
          {errores.email && <small className="field-error">{errores.email}</small>}
        </label>

        <label className="field">
          <span>Rol</span>
          <select value={form.rol} onChange={(e) => set('rol', e.target.value)}>
            {Object.values(ROLES).map((r) => (
              <option key={r.id} value={r.id}>
                {r.nombre} — {r.descripcion}
              </option>
            ))}
          </select>
        </label>

        <div className="form-note">
          El vendedor solo puede usar el punto de venta y consultar sus tickets; nunca
          puede modificar el inventario ni el catálogo.
        </div>

        <div className="modal-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" className="btn btn-primary">
            Crear usuario
          </button>
        </div>
      </form>
    </Modal>
  )
}

export default function Usuarios() {
  const { usuarios, ventas, currentUser, alternarUsuario } = useStore()
  const [creando, setCreando] = useState(false)

  return (
    <div className="page-stack">
      <div className="card-head standalone">
        <div>
          <h3>Equipo de la tienda</h3>
          <p>Cada usuario accede solo a las secciones permitidas por su rol.</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => setCreando(true)}>
          <UserPlus size={17} />
          Nuevo usuario
        </button>
      </div>

      <div className="user-grid">
        {usuarios.map((u) => {
          const misVentas = ventas.filter((v) => v.sellerId === u.id)
          const totalVendido = misVentas.reduce((s, v) => s + v.total, 0)
          const esYo = u.id === currentUser.id
          return (
            <article key={u.id} className={`user-card ${u.activo ? '' : 'user-inactive'}`}>
              <div className="user-card-head">
                <Avatar user={u} size={52} />
                <div className="user-card-id">
                  <strong>
                    {u.nombre} {esYo && <span className="you-tag">Tú</span>}
                  </strong>
                  <span>{u.email}</span>
                </div>
                <button
                  type="button"
                  className={`switch ${u.activo ? 'switch-on' : ''}`}
                  onClick={() => alternarUsuario(u.id)}
                  disabled={esYo}
                  title={
                    esYo
                      ? 'No puedes desactivar tu propio usuario'
                      : u.activo
                        ? 'Desactivar usuario'
                        : 'Activar usuario'
                  }
                  aria-label={u.activo ? 'Desactivar usuario' : 'Activar usuario'}
                >
                  <span />
                </button>
              </div>

              <div className="user-card-badges">
                <RolBadge rol={u.rol} />
                <span className={`badge badge-sm ${u.activo ? 'badge-emerald' : 'badge-slate'}`}>
                  {u.activo ? 'Activo' : 'Inactivo'}
                </span>
              </div>

              <div className="user-card-stats">
                <div>
                  <span>Tickets</span>
                  <strong>{misVentas.length}</strong>
                </div>
                <div>
                  <span>Vendido</span>
                  <strong>{money(totalVendido)}</strong>
                </div>
              </div>

              <p className="user-card-scope">
                Puede entrar a:{' '}
                <strong>
                  {ROLES[u.rol].paginas
                    .map((p) => SECCIONES.find((s) => s.id === p)?.nombre)
                    .join(', ')}
                </strong>
              </p>
            </article>
          )
        })}
      </div>

      <section className="card">
        <header className="card-head">
          <div>
            <h3>Matriz de permisos</h3>
            <p>Así se protege la operación según cada rol.</p>
          </div>
          <span className="chip chip-soft">
            <ShieldCheck size={14} /> Control de acceso
          </span>
        </header>

        <div className="table-wrap">
          <table className="table permissions-table">
            <thead>
              <tr>
                <th>Sección</th>
                {Object.values(ROLES).map((r) => (
                  <th key={r.id} className="center">
                    <RolBadge rol={r.id} compact />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {SECCIONES.map((s) => (
                <tr key={s.id}>
                  <td className="strong">{s.nombre}</td>
                  {Object.values(ROLES).map((r) => (
                    <td key={r.id} className="center">
                      {r.paginas.includes(s.id) ? (
                        <span className="perm-yes">
                          <Check size={16} />
                        </span>
                      ) : (
                        <span className="perm-no">
                          <Minus size={16} />
                        </span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="matrix-note">
          El rol <strong>Vendedor</strong> no tiene acceso a Almacén ni a Productos: el
          inventario solo se modifica desde la sección Almacén (Administrador y Almacén) o
          automáticamente al cobrar una venta.
        </p>
      </section>

      {creando && <UsuarioForm onClose={() => setCreando(false)} />}
    </div>
  )
}
