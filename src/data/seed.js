// Datos de demostración de la tienda "Mercado Aurora"

export const CATEGORIAS = [
  { id: 'bebidas', nombre: 'Bebidas', emoji: '🥤' },
  { id: 'snacks', nombre: 'Snacks', emoji: '🍿' },
  { id: 'abarrotes', nombre: 'Abarrotes', emoji: '🛒' },
  { id: 'limpieza', nombre: 'Limpieza', emoji: '🧼' },
  { id: 'cuidado', nombre: 'Cuidado personal', emoji: '🧴' },
]

export const EMOJIS = [
  '🥤', '💧', '🧃', '☕', '🍿', '🍪', '🍫', '🥨', '🍚', '🫘',
  '🫒', '🥛', '🍞', '🧼', '🧻', '🧴', '🪥', '🧹', '📦', '🍬',
]

export const METODOS_PAGO = ['Efectivo', 'Tarjeta', 'Transferencia']

export const ROLES = {
  admin: {
    id: 'admin',
    nombre: 'Administrador',
    descripcion: 'Acceso total al sistema',
    color: 'violet',
    paginas: ['pos', 'ventas', 'almacen', 'productos', 'usuarios'],
  },
  vendedor: {
    id: 'vendedor',
    nombre: 'Vendedor',
    descripcion: 'Punto de venta y tickets',
    color: 'emerald',
    paginas: ['pos', 'ventas'],
  },
  // alias API: 'seller' mapea a vendedor
  seller: {
    id: 'vendedor',
    nombre: 'Vendedor',
    descripcion: 'Punto de venta y tickets',
    color: 'emerald',
    paginas: ['pos', 'ventas'],
  },
  almacen: {
    id: 'almacen',
    nombre: 'Almacén',
    descripcion: 'Inventario y movimientos',
    color: 'amber',
    paginas: ['pos', 'ventas', 'almacen', 'productos'],
  },
  // alias API: 'warehouse' mapea a almacen
  warehouse: {
    id: 'almacen',
    nombre: 'Almacén',
    descripcion: 'Inventario y movimientos',
    color: 'amber',
    paginas: ['pos', 'ventas', 'almacen', 'productos'],
  },
}

const redondear = (n) => Math.round(n * 100) / 100

const PRODUCTOS = [
  { id: 'p1', sku: 'BEB-001', nombre: 'Coca-Cola 600 ml', categoria: 'bebidas', precio: 19, costo: 13.5, stock: 48, minStock: 12, emoji: '🥤' },
  { id: 'p2', sku: 'BEB-002', nombre: 'Agua natural 1 L', categoria: 'bebidas', precio: 14, costo: 8, stock: 64, minStock: 20, emoji: '💧' },
  { id: 'p3', sku: 'BEB-003', nombre: 'Jugo de naranja 1 L', categoria: 'bebidas', precio: 26, costo: 18, stock: 22, minStock: 10, emoji: '🧃' },
  { id: 'p4', sku: 'ABR-001', nombre: 'Café molido 250 g', categoria: 'abarrotes', precio: 42, costo: 31, stock: 15, minStock: 6, emoji: '☕' },
  { id: 'p5', sku: 'SNK-001', nombre: 'Sabritas original 45 g', categoria: 'snacks', precio: 18, costo: 12, stock: 36, minStock: 15, emoji: '🍿' },
  { id: 'p6', sku: 'SNK-002', nombre: 'Galletas Oreo 54 g', categoria: 'snacks', precio: 16, costo: 10.5, stock: 8, minStock: 12, emoji: '🍪' },
  { id: 'p7', sku: 'SNK-003', nombre: 'Chocolate Carlos V 32 g', categoria: 'snacks', precio: 12, costo: 8, stock: 40, minStock: 10, emoji: '🍫' },
  { id: 'p8', sku: 'SNK-004', nombre: 'Palomitas microondas 90 g', categoria: 'snacks', precio: 22, costo: 15, stock: 0, minStock: 8, emoji: '🍿' },
  { id: 'p9', sku: 'ABR-002', nombre: 'Arroz 1 kg', categoria: 'abarrotes', precio: 28, costo: 21, stock: 30, minStock: 10, emoji: '🍚' },
  { id: 'p10', sku: 'ABR-003', nombre: 'Frijol negro 1 kg', categoria: 'abarrotes', precio: 32, costo: 24, stock: 25, minStock: 10, emoji: '🫘' },
  { id: 'p11', sku: 'ABR-004', nombre: 'Aceite vegetal 900 ml', categoria: 'abarrotes', precio: 38, costo: 30, stock: 18, minStock: 8, emoji: '🫒' },
  { id: 'p12', sku: 'LAC-001', nombre: 'Leche entera 1 L', categoria: 'abarrotes', precio: 26, costo: 20, stock: 12, minStock: 12, emoji: '🥛' },
  { id: 'p13', sku: 'PAN-001', nombre: 'Pan de caja 680 g', categoria: 'abarrotes', precio: 42, costo: 33, stock: 9, minStock: 6, emoji: '🍞' },
  { id: 'p14', sku: 'LIM-001', nombre: 'Cloro 1 L', categoria: 'limpieza', precio: 24, costo: 16, stock: 26, minStock: 10, emoji: '🧼' },
  { id: 'p15', sku: 'LIM-002', nombre: 'Papel higiénico 4 rollos', categoria: 'limpieza', precio: 46, costo: 34, stock: 14, minStock: 12, emoji: '🧻' },
  { id: 'p16', sku: 'LIM-003', nombre: 'Jabón en polvo 1 kg', categoria: 'limpieza', precio: 38, costo: 28, stock: 20, minStock: 8, emoji: '🧴' },
  { id: 'p17', sku: 'CUI-001', nombre: 'Shampoo 400 ml', categoria: 'cuidado', precio: 68, costo: 49, stock: 11, minStock: 6, emoji: '🧴' },
  { id: 'p18', sku: 'CUI-002', nombre: 'Pasta dental 100 ml', categoria: 'cuidado', precio: 32, costo: 22, stock: 17, minStock: 10, emoji: '🪥' },
]

const USUARIOS = [
  { id: 'u1', nombre: 'Ana Torres', email: 'ana@aurora.mx', rol: 'admin', activo: true, iniciales: 'AT', color: '#7c3aed' },
  { id: 'u2', nombre: 'Luis Ramírez', email: 'luis@aurora.mx', rol: 'vendedor', activo: true, iniciales: 'LR', color: '#059669' },
  { id: 'u3', nombre: 'María Gómez', email: 'maria@aurora.mx', rol: 'vendedor', activo: true, iniciales: 'MG', color: '#0284c7' },
  { id: 'u4', nombre: 'Diego Salas', email: 'diego@aurora.mx', rol: 'almacen', activo: true, iniciales: 'DS', color: '#d97706' },
]

function haceHoras(horas) {
  return new Date(Date.now() - horas * 3600 * 1000).toISOString()
}

function crearVentaSemilla({ folio, horas, sellerId, items, metodoPago, recibido }) {
  const vendedor = USUARIOS.find((u) => u.id === sellerId)
  const detalle = items.map(([productId, qty]) => {
    const p = PRODUCTOS.find((prod) => prod.id === productId)
    return {
      productId: p.id,
      nombre: p.nombre,
      emoji: p.emoji,
      precio: p.precio,
      qty,
      importe: redondear(p.precio * qty),
    }
  })
  const subtotal = redondear(detalle.reduce((s, it) => s + it.importe, 0))
  const impuesto = redondear(subtotal * 0.16)
  const total = redondear(subtotal + impuesto)
  const pagado = recibido ?? total
  return {
    id: 's-' + folio,
    folio,
    fecha: haceHoras(horas),
    sellerId,
    sellerName: vendedor.nombre,
    items: detalle,
    subtotal,
    impuesto,
    total,
    metodoPago,
    recibido: pagado,
    cambio: redondear(Math.max(0, pagado - total)),
  }
}

export function crearSeed() {
  const ventas = [
    crearVentaSemilla({ folio: 'A-000101', horas: 1.5, sellerId: 'u2', items: [['p1', 2], ['p5', 1], ['p12', 1]], metodoPago: 'Efectivo', recibido: 100 }),
    crearVentaSemilla({ folio: 'A-000102', horas: 3, sellerId: 'u3', items: [['p9', 1], ['p11', 1], ['p15', 1]], metodoPago: 'Tarjeta' }),
    crearVentaSemilla({ folio: 'A-000103', horas: 5, sellerId: 'u2', items: [['p4', 1], ['p6', 2], ['p7', 1]], metodoPago: 'Efectivo', recibido: 100 }),
    crearVentaSemilla({ folio: 'A-000104', horas: 26, sellerId: 'u1', items: [['p1', 6], ['p5', 4], ['p7', 2]], metodoPago: 'Tarjeta' }),
    crearVentaSemilla({ folio: 'A-000105', horas: 30, sellerId: 'u2', items: [['p17', 1], ['p18', 2]], metodoPago: 'Transferencia' }),
    crearVentaSemilla({ folio: 'A-000106', horas: 50, sellerId: 'u3', items: [['p14', 2], ['p16', 1], ['p15', 2]], metodoPago: 'Efectivo', recibido: 200 }),
    crearVentaSemilla({ folio: 'A-000107', horas: 74, sellerId: 'u2', items: [['p2', 4], ['p3', 2]], metodoPago: 'Tarjeta' }),
    crearVentaSemilla({ folio: 'A-000108', horas: 98, sellerId: 'u1', items: [['p9', 2], ['p10', 2], ['p12', 2], ['p13', 1]], metodoPago: 'Efectivo', recibido: 300 }),
  ]

  // Movimientos: carga inicial de inventario + salidas por ventas.
  // La carga inicial incluye lo ya vendido para que el stock final cuadre.
  const vendidos = {}
  ventas.forEach((v) =>
    v.items.forEach((it) => {
      vendidos[it.productId] = (vendidos[it.productId] || 0) + it.qty
    }),
  )
  const movimientos = []
  PRODUCTOS.forEach((p, k) => {
    movimientos.push({
      id: 'm-ini-' + p.id,
      fecha: haceHoras(120 + k),
      productId: p.id,
      productName: p.nombre,
      tipo: 'entrada',
      cantidad: p.stock + (vendidos[p.id] || 0),
      motivo: 'Carga inicial de inventario',
      userName: 'Diego Salas',
    })
  })
  ventas.forEach((v) => {
    v.items.forEach((it, k) => {
      movimientos.push({
        id: `m-${v.folio}-${k}`,
        fecha: v.fecha,
        productId: it.productId,
        productName: it.nombre,
        tipo: 'salida',
        cantidad: it.qty,
        motivo: `Venta ${v.folio}`,
        userName: v.sellerName,
      })
    })
  })
  movimientos.sort((a, b) => new Date(b.fecha) - new Date(a.fecha))

  return {
    categories: CATEGORIAS,
    products: PRODUCTOS.map((p) => ({ ...p, activo: true })),
    sales: ventas,
    users: USUARIOS,
    movements: movimientos,
    nextFolio: 109,
  }
}
