// 이름 첫 글자 + 조사관 고유 색 → 어느 화면에서든 같은 사람을 같은 색으로 알아보게
export default function Avatar({ inv, size = 32, ring = false }) {
  const color = inv?.color || '#a3a39e'
  const letter = inv?.name?.trim()?.[0] || '?'
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-bold text-white ${ring ? 'ring-2 ring-white' : ''}`}
      style={{ width: size, height: size, background: color, fontSize: size * 0.44, opacity: inv && !inv.active ? 0.45 : 1 }}
      aria-hidden="true"
    >
      {letter}
    </span>
  )
}
