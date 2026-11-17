import Avatar from '../ui/Avatar'
import Icon from '../ui/Icon'
import ProgressRing from '../ui/ProgressRing'
import { CLOSE, OPEN, hourLabel, isWeekend, rangeLabel } from '../lib/date'

// 열자마자 "지금 조사실 쓸 수 있나?"에 답하는 카드 (시스템 상태 가시성)
export default function NowCard({ todays, invMap, now, onBook, onOpen }) {
  const h = now.getHours()
  const booked = todays.reduce((s, r) => s + (r.end_hour - r.start_hour), 0)
  const current = todays.find((r) => r.start_hour <= h && h < r.end_hour)
  const next = todays.filter((r) => r.start_hour > h).sort((a, b) => a.start_hour - b.start_hour)[0]
  const closedToday = isWeekend(now)
  const afterHours = h >= CLOSE
  const beforeHours = h < OPEN

  let state
  if (closedToday) state = { tone: 'idle', title: '오늘은 운영하지 않아요', sub: '평일 09:00–18:00에 예약할 수 있어요' }
  else if (afterHours) state = { tone: 'idle', title: '오늘 운영이 끝났어요', sub: '내일 일정을 미리 예약해 두세요' }
  else if (current) {
    const inv = invMap[current.investigator_id]
    state = { tone: 'busy', title: '지금 사용 중', sub: `${inv?.name || '알 수 없음'} · ${hourLabel(current.end_hour)}까지`, inv }
  } else {
    const until = next ? next.start_hour : CLOSE
    state = {
      tone: 'free',
      title: beforeHours ? '오늘 아직 시작 전이에요' : '지금 비어 있어요',
      sub: next ? `${hourLabel(until)}부터 다음 예약` : '오늘 남은 예약이 없어요',
    }
  }

  return (
    <section className="anim-rise rounded-[28px] bg-white p-5 soft-shadow" aria-live="polite">
      <div className="flex items-center gap-4">
        <ProgressRing value={booked} max={CLOSE - OPEN}>
          <div className="text-center leading-tight">
            <div className="text-sm font-bold">{booked}/{CLOSE - OPEN}</div>
            <div className="text-[10px] text-sub">시간</div>
          </div>
        </ProgressRing>
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-1.5">
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                state.tone === 'free' ? 'bg-go' : state.tone === 'busy' ? 'bg-warn' : 'bg-faint'
              }`}
            />
            <span className="text-xs font-medium text-sub">오늘 조사실</span>
          </div>
          <div className="text-xl font-bold">{state.title}</div>
          <div className="mt-0.5 flex items-center gap-1.5 truncate text-sm text-sub">
            {state.inv && <Avatar inv={state.inv} size={18} />}
            {state.sub}
          </div>
        </div>
      </div>

      {state.tone === 'free' && !beforeHours && (
        <button
          onClick={() => onBook(h)}
          className="mt-4 flex min-h-12 w-full items-center justify-center gap-1.5 rounded-full bg-go text-[15px] font-semibold text-white active:opacity-85"
        >
          <Icon name="plus" size={18} /> 지금 바로 예약하기
        </button>
      )}
      {state.tone === 'busy' && next && (
        <button
          onClick={() => onOpen(next)}
          className="mt-4 flex min-h-12 w-full items-center justify-between rounded-2xl bg-mist px-4 text-left text-sm active:opacity-85"
        >
          <span className="text-sub">다음 예약</span>
          <span className="font-semibold">
            {rangeLabel(next.start_hour, next.end_hour)} · {invMap[next.investigator_id]?.name}
          </span>
        </button>
      )}
    </section>
  )
}
