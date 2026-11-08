/**
 * API REST Service - Mercado Aurora / Tienda Dashboard
 * Configuración base: https://backend-ecommerce-ukji.onrender.com
 *
 * Mapeo completo de endpoints requeridos:
 * - Autenticación: POST /users/login (Guarda Token Bearer y rol del usuario)
 * - Usuarios: GET /users, POST /users, PUT /users/:id, DELETE /users/:id
 * - Productos y Categorías: GET/POST/PUT/DELETE /products y /categories (Manejo de query params title, categoryId, offset, perPage)
 * - Imágenes: GET/POST/DELETE /images (Vía FormData)
 * - Carrito y Compras: GET /carts, POST/PUT/DELETE /cartItems, GET/POST /purchases, GET/POST /purchaseItems
 */

export const API_BASE_URL = 'https://backend-ecommerce-6e8l.onrender.com'

const TOKEN_KEY = 'mercado_aurora_token'
const USER_ROLE_KEY = 'mercado_aurora_role'

// -----------------------------------------------------------------------------
// Utilidades de Autenticación y Token Bearer
// -----------------------------------------------------------------------------

export function getAuthToken() {
  try {
    return localStorage.getItem(TOKEN_KEY) || null
  } catch {
    return null
  }
}

export function setAuthToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token)
    else localStorage.removeItem(TOKEN_KEY)
  } catch (error) {
    console.warn('Error guardando token:', error)
  }
}

export function getStoredRole() {
  try {
    return localStorage.getItem(USER_ROLE_KEY) || null
  } catch {
    return null
  }
}

export function setStoredRole(role) {
  try {
    if (role) localStorage.setItem(USER_ROLE_KEY, role)
    else localStorage.removeItem(USER_ROLE_KEY)
  } catch (error) {
    console.warn('Error guardando rol:', error)
  }
}

export function clearAuthData() {
  try {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_ROLE_KEY)
  } catch (error) {
    console.warn('Error limpiando auth:', error)
  }
}

/**
 * Cliente HTTP base con inyección de cabecera Authorization: Bearer <token>
 */
async function request(endpoint, options = {}) {
  const token = getAuthToken()
  const headers = { ...options.headers }

  // Inyectar Token Bearer si existe
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  // Si no es FormData, fijar Content-Type como application/json
  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json'
  }

  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`

  const config = {
    ...options,
    headers,
  }

  const response = await fetch(url, config)

  // Si recibimos 401 no autorizado, limpiar token
  if (response.status === 401) {
    clearAuthData()
  }

  if (!response.ok) {
    let errorDetail = `Error HTTP ${response.status}`
    try {
      const errJson = await response.json()
      errorDetail = errJson.message || errJson.error || JSON.stringify(errJson)
    } catch {
      // Ignorar si no hay JSON
    }
    const error = new Error(errorDetail)
    error.status = response.status
    throw error
  }

  // Si no hay contenido (ej: DELETE con 204)
  if (response.status === 204) {
    return true
  }

  return response.json()
}

// -----------------------------------------------------------------------------
// 1. AUTENTICACIÓN
// -----------------------------------------------------------------------------

export const authApi = {
  /**
   * POST /users/login
   * Recibe { email, password }
   * Guarda Token Bearer y rol del usuario
   */
  async login(email, password) {
    const data = await request('/users/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })

    if (data?.token) {
      setAuthToken(data.token)
    }
    if (data?.role || data?.user?.rol || data?.user?.role) {
      const rol = data.role || data?.user?.rol || data?.user?.role
      setStoredRole(rol)
    }

    return data
  },

  logout() {
    clearAuthData()
  },
}

// -----------------------------------------------------------------------------
// 2. USUARIOS
// -----------------------------------------------------------------------------

export const usersApi = {
  /**
   * GET /users
   */
  async getAll() {
    return request('/users')
  },

  /**
   * POST /users
   */
  async create(userData) {
    return request('/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    })
  },

  /**
   * PUT /users/:id
   */
  async update(id, userData) {
    return request(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    })
  },

  /**
   * DELETE /users/:id
   */
  async delete(id) {
    return request(`/users/${id}`, {
      method: 'DELETE',
    })
  },
}

// -----------------------------------------------------------------------------
// 3. PRODUCTOS Y CATEGORÍAS (Query params: title, categoryId, offset, perPage)
// -----------------------------------------------------------------------------

export const productsApi = {
  /**
   * GET /products?title=&categoryId=&offset=&perPage=
   */
  async getAll({ title, categoryId, offset = 0, perPage = 20 } = {}) {
    const params = new URLSearchParams()
    if (title) params.append('title', title)
    if (categoryId && categoryId !== 'todas') params.append('categoryId', categoryId)
    if (offset !== undefined) params.append('offset', String(offset))
    if (perPage !== undefined) params.append('perPage', String(perPage))

    const qs = params.toString()
    return request(`/products${qs ? `?${qs}` : ''}`)
  },

  /**
   * GET /products/:id
   */
  async getById(id) {
    return request(`/products/${id}`)
  },

  /**
   * POST /products
   */
  async create(productData) {
    return request('/products', {
      method: 'POST',
      body: JSON.stringify(productData),
    })
  },

  /**
   * PUT /products/:id
   */
  async update(id, productData) {
    return request(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(productData),
    })
  },

  /**
   * DELETE /products/:id
   */
  async delete(id) {
    return request(`/products/${id}`, {
      method: 'DELETE',
    })
  },
}

export const categoriesApi = {
  /**
   * GET /categories?offset=&perPage=
   */
  async getAll({ offset = 0, perPage = 50 } = {}) {
    const params = new URLSearchParams()
    if (offset !== undefined) params.append('offset', String(offset))
    if (perPage !== undefined) params.append('perPage', String(perPage))

    const qs = params.toString()
    return request(`/categories${qs ? `?${qs}` : ''}`)
  },

  /**
   * POST /categories
   */
  async create(categoryData) {
    return request('/categories', {
      method: 'POST',
      body: JSON.stringify(categoryData),
    })
  },

  /**
   * PUT /categories/:id
   */
  async update(id, categoryData) {
    return request(`/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(categoryData),
    })
  },

  /**
   * DELETE /categories/:id
   */
  async delete(id) {
    return request(`/categories/${id}`, {
      method: 'DELETE',
    })
  },
}

// -----------------------------------------------------------------------------
// 4. IMÁGENES (Vía FormData)
// -----------------------------------------------------------------------------

export const imagesApi = {
  /**
   * POST /images
   * Sube archivo o imagen a través de FormData
   */
  async upload(fileOrFormData, extraFields = {}) {
    let body = fileOrFormData
    if (!(fileOrFormData instanceof FormData)) {
      body = new FormData()
      body.append('image', fileOrFormData)
      Object.entries(extraFields).forEach(([k, v]) => body.append(k, v))
    }

    return request('/images', {
      method: 'POST',
      body,
    })
  },

  /**
   * GET /images
   */
  async getAll() {
    return request('/images')
  },

  /**
   * DELETE /images/:id
   */
  async delete(id) {
    return request(`/images/${id}`, {
      method: 'DELETE',
    })
  },
}

// -----------------------------------------------------------------------------
// 5. CARRITO Y COMPRAS (Punto de Venta / Purchases)
// -----------------------------------------------------------------------------

export const cartApi = {
  /**
   * GET /carts
   */
  async getCarts() {
    return request('/carts')
  },

  /**
   * POST /cartItems
   */
  async addItem(itemData) {
    return request('/cartItems', {
      method: 'POST',
      body: JSON.stringify(itemData),
    })
  },

  /**
   * PUT /cartItems/:id
   */
  async updateItem(id, itemData) {
    return request(`/cartItems/${id}`, {
      method: 'PUT',
      body: JSON.stringify(itemData),
    })
  },

  /**
   * DELETE /cartItems/:id
   */
  async deleteItem(id) {
    return request(`/cartItems/${id}`, {
      method: 'DELETE',
    })
  },
}

export const purchasesApi = {
  /**
   * GET /purchases
   */
  async getAll() {
    return request('/purchases')
  },

  /**
   * POST /purchases
   * Registra la venta confirmada en el POS
   */
  async create(purchaseData) {
    return request('/purchases', {
      method: 'POST',
      body: JSON.stringify(purchaseData),
    })
  },

  /**
   * GET /purchaseItems
   */
  async getItems() {
    return request('/purchaseItems')
  },

  /**
   * POST /purchaseItems
   */
  async createItem(itemData) {
    return request('/purchaseItems', {
      method: 'POST',
      body: JSON.stringify(itemData),
    })
  },
}

export default {
  auth: authApi,
  users: usersApi,
  products: productsApi,
  categories: categoriesApi,
  images: imagesApi,
  cart: cartApi,
  purchases: purchasesApi,
}
