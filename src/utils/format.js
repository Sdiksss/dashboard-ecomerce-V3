export const money = (n) =>
  new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(n) ? n : 0)

export const redondear = (n) => Math.round(n * 100) / 100

export const fechaCorta = (iso) =>
  new Date(iso).toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })

export const horaCorta = (iso) =>
  new Date(iso).toLocaleTimeString('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
  })

export const fechaHora = (iso) => `${fechaCorta(iso)} · ${horaCorta(iso)}`

export const fechaLarga = (date = new Date()) => {
  const txt = date.toLocaleDateString('es-MX', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
  return txt.charAt(0).toUpperCase() + txt.slice(1)
}

export const mismoDia = (a, b) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate()

export const porcentaje = (parte, total) => {
  if (!total) return 0
  return Math.round((parte / total) * 100)
}
