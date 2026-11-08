import { createContext, useContext, useEffect, useState } from 'react'
import { CATEGORIAS, crearSeed, ROLES } from '../data/seed'
import { redondear } from '../utils/format'
import api, { authApi, categoriesApi, imagesApi, productsApi, purchasesApi, getAuthToken, setAuthToken, clearAuthData } from '../services/api'

const StoreContext = createContext(null)

const STORAGE_KEY = 'mercado-aurora-v1'
const SESSION_KEY = 'mercado-aurora-sesion'

function cargarEstado() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const data = JSON.parse(raw)
      if (data && data.products && data.sales && data.users) {
        if (!data.categories) {
          data.categories = CATEGORIAS
        }
        return data
      }
    }
  } catch (error) {
    console.warn('No se pudo leer el estado guardado:', error)
  }
  return crearSeed()
}

function cargarSesion() {
  try {
    return localStorage.getItem(SESSION_KEY) || null
  } catch {
    return null
  }
}

export function StoreProvider({ children }) {
  const [estado, setEstado] = useState(cargarEstado)
  const [sesionId, setSesionId] = useState(cargarSesion)
  const [token, setToken] = useState(getAuthToken)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(estado))
    } catch (error) {
      console.warn('No se pudo guardar el estado:', error)
    }
  }, [estado])

  useEffect(() => {
    try {
      if (sesionId) localStorage.setItem(SESSION_KEY, sesionId)
      else localStorage.removeItem(SESSION_KEY)
    } catch {
      /* ignorar */
    }
  }, [sesionId])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 3400)
    return () => clearTimeout(t)
  }, [toast])

  const currentUser = estado.users.find((u) => u.id === sesionId && u.activo) || null

  const notificar = (mensaje, tipo = 'success') => {
    setToast({ id: Date.now(), mensaje, tipo })
  }

  // ------------------------------------------------------------------
  // Sincronización en vivo con Base de Datos / Backend REST
  // GET https://backend-ecommerce-6e8l.onrender.com/products
  // GET https://backend-ecommerce-6e8l.onrender.com/categories
  // ------------------------------------------------------------------
  const sincronizarConApi = async () => {
    try {
      const [prodsRes, catsRes] = await Promise.allSettled([
        productsApi.getAll({ perPage: 100 }),
        categoriesApi.getAll({ perPage: 100 }),
      ])

      let nuevosProductos = null
      let nuevasCategorias = null

      if (prodsRes.status === 'fulfilled' && prodsRes.value) {
        // Soporta { total, results: [...] } o [...] directo
        const rawProds = Array.isArray(prodsRes.value)
          ? prodsRes.value
          : (prodsRes.value?.results || prodsRes.value?.products || prodsRes.value?.data || [])

        if (rawProds.length > 0) {
          nuevosProductos = rawProds.map((p, idx) => {
            // Extraer URL de imagen desde Cloudinary o array images: [{ id, url, productId }]
            let imgUrl = null
            if (Array.isArray(p.images) && p.images.length > 0) {
              imgUrl = typeof p.images[0] === 'object' ? p.images[0].url : p.images[0]
            } else if (p.image) {
              imgUrl = typeof p.image === 'object' ? p.image.url : p.image
            } else if (p.imagenUrl) {
              imgUrl = p.imagenUrl
            }

            const catId = p.category && typeof p.category === 'object' 
              ? String(p.category.id) 
              : String(p.categoryId || p.categoria || '1')

            const catNombre = p.category && typeof p.category === 'object'
              ? p.category.name
              : 'General'

            const precio = Number(p.price !== undefined ? p.price : (p.precio || 0))
            const stock = Number(p.stock !== undefined ? p.stock : 10)
            const costo = Number(p.cost || p.costo || redondear(precio * 0.7))

            return {
              id: p.id !== undefined ? String(p.id) : `p-${idx}`,
              nombre: p.title || p.nombre || `Producto ${idx + 1}`,
              sku: p.sku || `PRD-${String(p.id || idx).padStart(3, '0')}`,
              categoria: catId,
              categoriaNombre: catNombre,
              precio,
              costo,
              stock,
              minStock: Number(p.minStock !== undefined ? p.minStock : 3),
              description: p.description || p.descripcion || '',
              emoji: p.emoji || (catNombre.toLowerCase().includes('android') ? '🤖' : '📦'),
              imagenUrl: imgUrl,
              images: p.images || [],
              activo: p.activo !== undefined ? p.activo : true,
              specs: p.specs || {},
            }
          })

          // Extraer categorías dinámicas descubiertas en los productos
          const catsMap = new Map()
          rawProds.forEach((p) => {
            if (p.category && typeof p.category === 'object' && p.category.id) {
              const cid = String(p.category.id)
              if (!catsMap.has(cid)) {
                catsMap.set(cid, {
                  id: cid,
                  nombre: p.category.name || `Categoría ${cid}`,
                  emoji: String(p.category.name).toLowerCase().includes('android') ? '🤖' : '🏷️',
                })
              }
            }
          })

          if (catsMap.size > 0) {
            nuevasCategorias = Array.from(catsMap.values())
          }
        }
      }

      if (catsRes.status === 'fulfilled' && catsRes.value) {
        const rawCats = Array.isArray(catsRes.value)
          ? catsRes.value
          : (catsRes.value?.results || catsRes.value?.categories || catsRes.value?.data || [])

        if (rawCats.length > 0) {
          const mapActual = new Map((nuevasCategorias || []).map((c) => [c.id, c]))
          rawCats.forEach((c, idx) => {
            const cid = String(c.id || `cat-${idx}`)
            if (!mapActual.has(cid)) {
              mapActual.set(cid, {
                id: cid,
                nombre: c.name || c.nombre || c.title || `Categoría ${idx + 1}`,
                emoji: c.emoji || (String(c.name || '').toLowerCase().includes('android') ? '🤖' : '🏷️'),
              })
            }
          })
          nuevasCategorias = Array.from(mapActual.values())
        }
      }

      if (nuevosProductos || nuevasCategorias) {
        setEstado((prev) => ({
          ...prev,
          ...(nuevosProductos ? { products: nuevosProductos } : {}),
          ...(nuevasCategorias ? { categories: nuevasCategorias } : {}),
        }))
        console.info('Productos y categorías sincronizados con https://backend-ecommerce-6e8l.onrender.com')
      }
    } catch (err) {
      console.warn('Conexión con base de datos remota:', err.message)
    }
  }

  // Cargar datos remotos desde https://backend-ecommerce-6e8l.onrender.com al iniciar
  useEffect(() => {
    sincronizarConApi()
  }, [])

  // ------------------------------------------------------------------
  // Autenticación (Local + Mapeo API POST /users/login)
  // ------------------------------------------------------------------
  const login = (userId) => {
    setSesionId(userId)
    const user = estado.users.find((u) => u.id === userId)
    if (user) {
      // Si el rol es seller o warehouse, mapear internamente
      const tokenDemo = `mock_bearer_${user.rol}_${Date.now()}`
      setToken(tokenDemo)
      setAuthToken(tokenDemo)
      notificar(`Sesión iniciada como ${user.nombre} (${ROLES[user.rol]?.nombre || user.rol})`)
    }
  }

  /**
   * Login vía API REST: POST /users/login
   * Guarda Token Bearer y rol del usuario
   */
  const loginApi = async (email, password) => {
    try {
      const resp = await authApi.login(email, password)
      if (resp?.token) {
        setToken(resp.token)
      }
      
      const roleFromApi = resp?.role || resp?.user?.role || resp?.user?.rol || 'seller'
      // Mapear role recibido si viene en inglés
      const rolMapeado = roleFromApi === 'seller' ? 'vendedor' : roleFromApi === 'warehouse' ? 'almacen' : roleFromApi

      // Buscar si el usuario ya existe en nuestra base local o crearlo en la sesión
      let usuario = estado.users.find((u) => u.email.toLowerCase() === email.toLowerCase())
      if (!usuario) {
        usuario = {
          id: resp?.user?.id ? String(resp.user.id) : `u-${Date.now()}`,
          nombre: resp?.user?.nombre || resp?.user?.name || email.split('@')[0],
          email,
          rol: rolMapeado,
          activo: true,
          iniciales: email.slice(0, 2).toUpperCase(),
          color: '#7c3aed',
        }
        setEstado((prev) => ({ ...prev, users: [...prev.users, usuario] }))
      }

      setSesionId(usuario.id)
      notificar(`Bienvenido, ${usuario.nombre}`)
      return { success: true, user: usuario }
    } catch (error) {
      console.warn('API /users/login no disponible o credenciales inválidas. Probando modo local...', error)
      // Fallback a login local por email
      const usuarioLocal = estado.users.find((u) => u.email.toLowerCase() === email.toLowerCase() && u.activo)
      if (usuarioLocal) {
        login(usuarioLocal.id)
        return { success: true, user: usuarioLocal }
      }
      notificar(error.message || 'Error al iniciar sesión', 'error')
      return { success: false, error: error.message }
    }
  }

  const logout = () => {
    setSesionId(null)
    setToken(null)
    clearAuthData()
    notificar('Sesión cerrada correctamente', 'info')
  }

  // ------------------------------------------------------------------
  // Categorías (GET /categories, POST /categories)
  // ------------------------------------------------------------------
  const agregarCategoria = async ({ nombre, emoji = '📦' }) => {
    const id = nombre.toLowerCase().trim().replace(/\s+/g, '-')
    const nueva = { id, nombre: nombre.trim(), emoji }

    // Intentar POST /categories en backend
    try {
      await categoriesApi.create({ name: nueva.nombre, emoji: nueva.emoji })
    } catch (e) {
      console.info('POST /categories ejecutado en modo local:', e.message)
    }

    setEstado((prev) => {
      const existe = (prev.categories || CATEGORIAS).some((c) => c.id === id)
      if (existe) return prev
      return {
        ...prev,
        categories: [...(prev.categories || CATEGORIAS), nueva],
      }
    })

    notificar(`Categoría "${nueva.nombre}" creada correctamente`)
    return nueva
  }

  // ------------------------------------------------------------------
  // Imágenes (POST /images vía FormData)
  // ------------------------------------------------------------------
  const subirImagen = async (archivoOFormData) => {
    try {
      const respuesta = await imagesApi.upload(archivoOFormData)
      const url = respuesta?.imageUrl || respuesta?.url || respuesta?.data?.url
      if (url) {
        notificar('Imagen subida con éxito al servidor')
        return url
      }
    } catch (e) {
      console.info('POST /images usará URL local de previsualización:', e.message)
    }

    // Fallback: si se pasó un File/Blob, crear URL local de objeto
    if (archivoOFormData instanceof File || archivoOFormData instanceof Blob) {
      const urlLocal = URL.createObjectURL(archivoOFormData)
      notificar('Imagen cargada localmente')
      return urlLocal
    }
    return null
  }

  // ------------------------------------------------------------------
  // Productos (GET/POST/PUT/DELETE /products)
  // ------------------------------------------------------------------
  const agregarProducto = async (datos) => {
    let nuevoId = 'p' + Date.now()
    let imgSubidaUrl = datos.imagenUrl || null

    // Intentar POST /products en backend https://backend-ecommerce-6e8l.onrender.com
    try {
      const respProd = await productsApi.create({
        title: datos.nombre.trim(),
        price: Number(datos.precio),
        stock: Number(datos.stock) || 0,
        description: datos.description || datos.nombre.trim(),
        categoryId: Number(datos.categoria) || 1,
      })

      if (respProd?.id) {
        nuevoId = String(respProd.id)
      }

      // Si hay archivo de imagen, subirlo a POST /images vinculándolo a nuevoId
      if (datos.imagenArchivo) {
        try {
          const respImg = await imagesApi.upload(datos.imagenArchivo, { productId: nuevoId })
          if (respImg?.url || respImg?.imageUrl) {
            imgSubidaUrl = respImg.url || respImg.imageUrl
          }
        } catch (errImg) {
          console.warn('Error subiendo imagen a POST /images:', errImg)
        }
      }
    } catch (e) {
      console.info('POST /products guardado localmente:', e.message)
    }

    const catObj = (estado.categories || CATEGORIAS).find((c) => String(c.id) === String(datos.categoria))
    const nuevo = {
      id: nuevoId,
      nombre: datos.nombre.trim(),
      sku: datos.sku ? datos.sku.trim().toUpperCase() : `PRD-${nuevoId}`,
      categoria: String(datos.categoria),
      categoriaNombre: catObj?.nombre || 'General',
      precio: Number(datos.precio),
      costo: Number(datos.costo) || redondear(Number(datos.precio) * 0.7),
      stock: Number(datos.stock) || 0,
      minStock: Number(datos.minStock) || 3,
      description: datos.description || datos.nombre.trim(),
      emoji: datos.emoji || '📦',
      imagenUrl: imgSubidaUrl,
      activo: true,
    }

    setEstado((prev) => ({
      ...prev,
      products: [nuevo, ...prev.products],
      movements:
        nuevo.stock > 0
          ? [
              {
                id: 'm-' + Date.now(),
                fecha: new Date().toISOString(),
                productId: nuevo.id,
                productName: nuevo.nombre,
                tipo: 'entrada',
                cantidad: nuevo.stock,
                motivo: 'Stock inicial del producto',
                userName: currentUser?.nombre || 'Sistema',
              },
              ...prev.movements,
            ]
          : prev.movements,
    }))
    notificar(`Producto "${nuevo.nombre}" agregado al catálogo`)
    return nuevo
  }

  const actualizarProducto = async (id, datos) => {
    let imgSubidaUrl = datos.imagenUrl

    // Intentar PUT /products/:id en backend
    try {
      await productsApi.update(id, {
        title: datos.nombre.trim(),
        price: Number(datos.precio),
        stock: Number(datos.stock),
        description: datos.description || datos.nombre.trim(),
        categoryId: Number(datos.categoria) || 1,
      })

      if (datos.imagenArchivo) {
        try {
          const respImg = await imagesApi.upload(datos.imagenArchivo, { productId: id })
          if (respImg?.url || respImg?.imageUrl) {
            imgSubidaUrl = respImg.url || respImg.imageUrl
          }
        } catch (errImg) {
          console.warn('Error subiendo imagen en PUT:', errImg)
        }
      }
    } catch (e) {
      console.info('PUT /products guardado localmente:', e.message)
    }

    setEstado((prev) => {
      const anterior = prev.products.find((p) => p.id === id)
      if (!anterior) return prev
      const actualizado = {
        ...anterior,
        nombre: datos.nombre.trim(),
        sku: datos.sku ? datos.sku.trim().toUpperCase() : anterior.sku,
        categoria: String(datos.categoria),
        precio: Number(datos.precio),
        costo: Number(datos.costo) || anterior.costo,
        stock: Number(datos.stock),
        minStock: Number(datos.minStock),
        emoji: datos.emoji || anterior.emoji,
        imagenUrl: imgSubidaUrl !== undefined ? imgSubidaUrl : anterior.imagenUrl,
        description: datos.description || anterior.description,
      }
      const delta = actualizado.stock - anterior.stock
      const movements = [...prev.movements]
      if (delta !== 0) {
        movements.unshift({
          id: 'm-' + Date.now(),
          fecha: new Date().toISOString(),
          productId: id,
          productName: actualizado.nombre,
          tipo: delta > 0 ? 'entrada' : 'salida',
          cantidad: Math.abs(delta),
          motivo: 'Ajuste desde el catálogo de productos',
          userName: currentUser?.nombre || 'Sistema',
        })
      }
      return {
        ...prev,
        products: prev.products.map((p) => (p.id === id ? actualizado : p)),
        movements,
      }
    })
    notificar('Producto actualizado correctamente')
  }

  const alternarProducto = (id) => {
    const producto = estado.products.find((p) => p.id === id)
    if (!producto) return
    const activo = !producto.activo
    setEstado((prev) => ({
      ...prev,
      products: prev.products.map((p) => (p.id === id ? { ...p, activo } : p)),
    }))
    notificar(activo ? 'Producto activado' : 'Producto desactivado', activo ? 'success' : 'info')
  }

  // ------------------------------------------------------------------
  // Inventario y Movimientos de Stock
  // ------------------------------------------------------------------
  const ajustarStock = ({ productId, tipo, cantidad, motivo }) => {
    const producto = estado.products.find((p) => p.id === productId)
    if (!producto) return false
    const qty = Math.abs(Number(cantidad)) || 0
    if (qty <= 0) {
      notificar('La cantidad debe ser mayor a cero', 'error')
      return false
    }
    if (tipo === 'salida' && qty > producto.stock) {
      notificar(`Solo hay ${producto.stock} unidades disponibles`, 'error')
      return false
    }
    const delta = tipo === 'entrada' ? qty : -qty
    setEstado((prev) => ({
      ...prev,
      products: prev.products.map((p) =>
        p.id === productId ? { ...p, stock: Math.max(0, p.stock + delta) } : p,
      ),
      movements: [
        {
          id: 'm-' + Date.now(),
          fecha: new Date().toISOString(),
          productId,
          productName: producto.nombre,
          tipo,
          cantidad: qty,
          motivo: motivo?.trim() || (tipo === 'entrada' ? 'Entrada de mercancía' : 'Salida de mercancía'),
          userName: currentUser?.nombre || 'Sistema',
        },
        ...prev.movements,
      ],
    }))
    notificar(
      tipo === 'entrada'
        ? `Entrada registrada: +${qty} ${producto.nombre}`
        : `Salida registrada: -${qty} ${producto.nombre}`,
    )
    return true
  }

  // ------------------------------------------------------------------
  // Ventas y Tickets (POST /purchases, POST /purchaseItems)
  // ------------------------------------------------------------------
  const crearVenta = async ({ items, metodoPago, recibido }) => {
    if (!currentUser) return null
    if (!items.length) return null

    // Validación de stock con el estado actual
    for (const item of items) {
      const prod = estado.products.find((p) => p.id === item.productId)
      if (!prod || !prod.activo) {
        notificar('Uno de los productos ya no está disponible', 'error')
        return null
      }
      if (item.qty > prod.stock) {
        notificar(`Stock insuficiente de ${prod.nombre}`, 'error')
        return null
      }
    }

    const detalle = items.map((item) => {
      const prod = estado.products.find((p) => p.id === item.productId)
      return {
        productId: prod.id,
        nombre: prod.nombre,
        emoji: prod.emoji,
        precio: prod.precio,
        qty: item.qty,
        importe: redondear(prod.precio * item.qty),
      }
    })
    const subtotal = redondear(detalle.reduce((s, it) => s + it.importe, 0))
    const impuesto = redondear(subtotal * 0.16)
    const total = redondear(subtotal + impuesto)
    const folio = `A-${String(estado.nextFolio).padStart(6, '0')}`
    const pagado = metodoPago === 'Efectivo' ? Number(recibido) : total

    const venta = {
      id: 'sale-' + Date.now(),
      folio,
      fecha: new Date().toISOString(),
      sellerId: currentUser.id,
      sellerName: currentUser.nombre,
      items: detalle,
      subtotal,
      impuesto,
      total,
      metodoPago,
      recibido: redondear(pagado),
      cambio: redondear(Math.max(0, pagado - total)),
    }

    // Intentar POST /purchases y POST /purchaseItems en backend
    try {
      await purchasesApi.create({
        folio: venta.folio,
        total: venta.total,
        paymentMethod: venta.metodoPago,
        items: detalle.map((it) => ({
          productId: it.productId,
          quantity: it.qty,
          price: it.precio,
        })),
      })
    } catch (e) {
      console.info('POST /purchases guardado en almacén local:', e.message)
    }

    setEstado((prev) => {
      const products = prev.products.map((p) => {
        const item = detalle.find((d) => d.productId === p.id)
        return item ? { ...p, stock: Math.max(0, p.stock - item.qty) } : p
      })
      const nuevosMovimientos = detalle.map((it, k) => ({
        id: `m-${venta.id}-${k}`,
        fecha: venta.fecha,
        productId: it.productId,
        productName: it.nombre,
        tipo: 'salida',
        cantidad: it.qty,
        motivo: `Venta ${folio}`,
        userName: currentUser.nombre,
      }))
      return {
        ...prev,
        products,
        sales: [venta, ...prev.sales],
        movements: [...nuevosMovimientos, ...prev.movements],
        nextFolio: prev.nextFolio + 1,
      }
    })

    notificar(`Ticket ${folio} generado correctamente`)
    return venta
  }

  // ------------------------------------------------------------------
  // Usuarios
  // ------------------------------------------------------------------
  const agregarUsuario = (datos) => {
    const id = 'u' + Date.now()
    const nombre = datos.nombre.trim()
    const iniciales = nombre
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0].toUpperCase())
      .join('')
    const colores = ['#7c3aed', '#059669', '#0284c7', '#d97706', '#db2777', '#0891b2']
    const nuevo = {
      id,
      nombre,
      email: datos.email.trim().toLowerCase(),
      rol: datos.rol,
      activo: true,
      iniciales,
      color: colores[estado.users.length % colores.length],
    }
    setEstado((prev) => ({ ...prev, users: [...prev.users, nuevo] }))
    notificar(`Usuario "${nombre}" creado como ${ROLES[datos.rol]?.nombre || datos.rol}`)
    return nuevo
  }

  const alternarUsuario = (id) => {
    if (id === currentUser?.id) {
      notificar('No puedes desactivar tu propio usuario', 'error')
      return
    }
    const usuario = estado.users.find((u) => u.id === id)
    if (!usuario) return
    const activo = !usuario.activo
    setEstado((prev) => ({
      ...prev,
      users: prev.users.map((u) => (u.id === id ? { ...u, activo } : u)),
    }))
    notificar(`${usuario.nombre} ${activo ? 'activado' : 'desactivado'}`, activo ? 'success' : 'info')
  }

  const value = {
    productos: estado.products,
    categorias: estado.categories || CATEGORIAS,
    ventas: estado.sales,
    usuarios: estado.users,
    movimientos: estado.movements,
    nextFolio: estado.nextFolio,
    currentUser,
    token,
    rol: currentUser ? ROLES[currentUser.rol] : null,
    toast,
    notificar,
    login,
    loginApi,
    logout,
    agregarProducto,
    actualizarProducto,
    alternarProducto,
    ajustarStock,
    crearVenta,
    agregarCategoria,
    subirImagen,
    agregarUsuario,
    alternarUsuario,
    sincronizarConApi,
  }

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore debe usarse dentro de StoreProvider')
  return ctx
}
