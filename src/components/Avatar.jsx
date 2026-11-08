export default function Avatar({ user, size = 40 }) {
  return (
    <span
      className="avatar"
      style={{
        width: size,
        height: size,
        background: user?.color || '#64748b',
        fontSize: Math.round(size * 0.36),
      }}
      aria-hidden="true"
    >
      {user?.iniciales || '??'}
    </span>
  )
}
