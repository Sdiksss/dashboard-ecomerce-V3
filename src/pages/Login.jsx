import { useState } from 'react'
import {
  ArrowRight,
  BarChart3,
  KeyRound,
  Lock,
  Mail,
  ReceiptText,
  ShieldCheck,
  ShoppingBag,
  UserCheck,
  Warehouse,
} from 'lucide-react'
import { ROLES } from '../data/seed'
import { useStore } from '../store/StoreContext'
import Avatar from '../components/Avatar'
import { RolBadge } from '../components/Badges'

export default function Login() {
  const { usuarios, login, loginApi } = useStore()
  // Por defecto autenticación directa con la API REST (POST /users/login)
  const [modo, setModo] = useState('api') // 'api' | 'demo'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [cargando, setCargando] = useState(false)
  const [errorApi, setErrorApi] = useState('')

  const handleLoginApi = async (e) => {
    e.preventDefault()
    if (!email || !password) {
      setErrorApi('Por favor completa correo y contraseña')
      return
    }

    setCargando(true)
    setErrorApi('')
    try {
      const resp = await loginApi(email, password)
      if (!resp.success) {
        setErrorApi(resp.error || 'Credenciales inválidas')
      }
    } catch (err) {
      setErrorApi(err.message || 'Error de conexión')
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="login-page">
      <section className="login-brand">
        <div className="login-brand-top">
          <div className="brand-mark brand-mark-lg">
            <ShoppingBag size={30} />
          </div>
          <span className="brand-name">Mercado Aurora</span>
        </div>

        <div className="login-brand-copy">
          <span className="eyebrow eyebrow-light">Panel de gestión comercial</span>
          <h1>Tu tienda,<br />bajo control.</h1>
          <p>
            Punto de venta, inventario y tickets en un solo lugar. Cada rol ve
            únicamente lo que necesita para trabajar.
          </p>

          <ul className="login-features">
            <li>
              <span className="feature-icon"><ReceiptText size={18} /></span>
              <div>
                <strong>Caja rápida y POS</strong>
                <span>Cobra en segundos e imprime tickets de 80mm al instante.</span>
              </div>
            </li>
            <li>
              <span className="feature-icon"><Warehouse size={18} /></span>
              <div>
                <strong>Inventario protegido</strong>
                <span>Vendedores reportan stock mediante tickets sin alterar la BD.</span>
              </div>
            </li>
            <li>
              <span className="feature-icon"><BarChart3 size={18} /></span>
              <div>
                <strong>API REST Integrada</strong>
                <span>Autenticación Bearer, productos, categorías y compras.</span>
              </div>
            </li>
          </ul>
        </div>

        <div className="login-brand-footer">
          <ShieldCheck size={15} />
          Autenticación segura con Roles · POS inicial obligatorio
        </div>
      </section>

      <section className="login-panel">
        <div className="login-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span className="eyebrow">Acceso al panel</span>
            {/* Toggle de modo de acceso */}
            <div className="tabs" style={{ marginBottom: 0, borderBottom: 'none' }}>
              <button
                type="button"
                className={`tab ${modo === 'demo' ? 'tab-active' : ''}`}
                style={{ padding: '6px 10px', fontSize: 12 }}
                onClick={() => setModo('demo')}
              >
                <UserCheck size={14} /> Roles Demo
              </button>
              <button
                type="button"
                className={`tab ${modo === 'api' ? 'tab-active' : ''}`}
                style={{ padding: '6px 10px', fontSize: 12 }}
                onClick={() => setModo('api')}
              >
                <KeyRound size={14} /> Credenciales API
              </button>
            </div>
          </div>

          <h2>¿Quién está trabajando hoy?</h2>
          <p className="login-help">
            {modo === 'demo'
              ? 'Elige un usuario para entrar. La primera vista obligatoria será el Punto de Venta (POS).'
              : 'Inicia sesión con tu correo y contraseña (POST /users/login con Token Bearer).'}
          </p>

          {modo === 'api' ? (
            <form onSubmit={handleLoginApi} className="form-stack" style={{ marginTop: 8 }}>
              <label className="field">
                <span>Correo electrónico</span>
                <div className="input-prefix">
                  <span><Mail size={16} /></span>
                  <input
                    type="email"
                    placeholder="ej. vendedor@aurora.mx"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
              </label>

              <label className="field">
                <span>Contraseña</span>
                <div className="input-prefix">
                  <span><Lock size={16} /></span>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </label>

              {errorApi && (
                <p className="field-error" style={{ fontSize: 12 }}>{errorApi}</p>
              )}

              <button
                type="submit"
                className="btn btn-primary btn-block"
                disabled={cargando}
                style={{ marginTop: 6 }}
              >
                {cargando ? 'Autenticando...' : 'Iniciar Sesión (Bearer Token)'}
              </button>
            </form>
          ) : (
            <div className="user-list">
              {usuarios.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  className={`login-user ${!u.activo ? 'inactivo' : ''}`}
                  onClick={() => u.activo && login(u.id)}
                  disabled={!u.activo}
                >
                  <Avatar user={u} size={44} />
                  <span className="login-user-info">
                    <strong>{u.nombre}</strong>
                    <span>{u.email}</span>
                  </span>
                  <span className="login-user-role">
                    <RolBadge rol={u.rol} compact />
                    <span className="login-user-scope">{ROLES[u.rol]?.descripcion}</span>
                  </span>
                  {u.activo ? (
                    <ArrowRight size={18} className="login-arrow" />
                  ) : (
                    <span className="login-inactive">Inactivo</span>
                  )}
                </button>
              ))}
            </div>
          )}

          <div className="login-demo-note">
            <ShieldCheck size={16} />
            <p>
              <strong>Control por roles:</strong> Tanto <code>admin</code> como <code>warehouse</code> (almacén)
              tienen acceso completo entre catálogo, almacén y ventas. <code>seller</code> (vendedor)
              está limitado a ventas y reportes de ajuste de stock.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
