import type { Friend } from '../data'

export default function Avatar({ friend, size = 40, showStatus = true }: { friend: Friend; size?: number; showStatus?: boolean }) {
  const initials = friend.name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
  return (
    <span className="avatar" style={{ width: size, height: size, background: friend.color, fontSize: size * 0.4 }}>
      {initials}
      {showStatus && <span className={`status-dot ${friend.status}`} />}
    </span>
  )
}
