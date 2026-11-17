import Avatar from '../ui/Avatar'
import { rangeLabel } from '../lib/date'

// 예약 카드: 조사관 색 + 이름 + 시간 + 거래 품목
export default function BookingCard({ r, inv, onClick, past, compact = false, style }) {
  const color = inv?.color || '#a3a39e'
  return (
    <button
      onClick={onClick}
      style={{ background: `${color}14`, borderColor: `${color}40`, ...style }}
      className={`flex w-full items-start gap-2.5 overflow-hidden rounded-2xl border text-left active:scale-[.99] ${
        compact ? 'p-2' : 'p-3'
      } ${past ? 'opacity-55' : ''}`}
      aria-label={`${inv?.name || '알 수 없음'} ${rangeLabel(r.start_hour, r.end_hour)} ${r.memo || ''} 예약 보기`}
    >
      <Avatar inv={inv} size={compact ? 24 : 30} />
      <div className="min-w-0 flex-1">
        <div className="truncate text-[15px] font-bold" style={{ color }}>
          {inv?.name || '알 수 없음'}
          {inv && !inv.active && <span className="ml-1 text-xs font-medium text-sub">(삭제됨)</span>}
        </div>
        <div className="text-[13px] font-medium text-ink/80">{rangeLabel(r.start_hour, r.end_hour)}</div>
        {r.memo && !compact && <div className="truncate text-xs text-sub">{r.memo}</div>}
      </div>
    </button>
  )
}
