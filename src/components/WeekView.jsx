import { useMemo } from 'react'
import Icon from '../ui/Icon'
import BookingCard from './BookingCard'
import { HOURS, DAY_NAMES, addDays, hourLabel, isPast, mondayOf, nearestWeekday, ymd } from '../lib/date'

const ROW = 60 // 1시간 칸 높이(px)

function DayColumn({ date, list, invMap, onNew, onEdit, now, showNow }) {
  const covered = new Set()
  list.forEach((r) => {
    for (let h = r.start_hour; h < r.end_hour; h++) covered.add(h)
  })
  const nowTop = (now.getHours() - 9 + now.getMinutes() / 60) * ROW
  return (
    <div className="relative grid" style={{ gridTemplateRows: `repeat(${HOURS.length}, ${ROW}px)` }}>
      {HOURS.map((h) =>
        covered.has(h) ? null : isPast(date, h, now) ? (
          <div key={`p${h}`} style={{ gridRow: `${h - 8} / span 1` }} className="m-0.5 rounded-2xl bg-mist/50" />
        ) : (
          <button
            key={`f${h}`}
            onClick={() => onNew(date, h)}
            style={{ gridRow: `${h - 8} / span 1` }}
            className="m-0.5 flex items-center justify-center gap-1 rounded-2xl border border-dashed border-line text-[13px] text-faint hover:border-go hover:text-go active:bg-go-soft"
            aria-label={`${date} ${hourLabel(h)} 예약하기`}
          >
            <Icon name="plus" size={14} /> 비어 있음
          </button>
        ),
      )}
      {list.map((r) => (
        <div key={r.id} style={{ gridRow: `${r.start_hour - 8} / span ${r.end_hour - r.start_hour}` }} className="m-0.5 flex">
          <BookingCard
            r={r}
            inv={invMap[r.investigator_id]}
            onClick={() => onEdit(r)}
            past={isPast(date, r.end_hour - 1, now)}
            compact={r.end_hour - r.start_hour === 1}
          />
        </div>
      ))}
      {showNow && nowTop >= 0 && nowTop <= ROW * HOURS.length && (
        <div className="pointer-events-none absolute inset-x-0 z-10 flex items-center" style={{ top: nowTop }} aria-hidden="true">
          <span className="-ml-1 h-2.5 w-2.5 rounded-full bg-warn" />
          <span className="h-0.5 flex-1 bg-warn/70" />
        </div>
      )}
    </div>
  )
}

function TimeAxis() {
  return (
    <div className="grid" style={{ gridTemplateRows: `repeat(${HOURS.length}, ${ROW}px)` }}>
      {HOURS.map((h) => (
        <div key={h} className="pt-1.5 pr-2 text-right text-xs font-medium text-faint">
          {h}시
        </div>
      ))}
    </div>
  )
}

export default function WeekView({ anchor, setAnchor, reservations, invMap, onNew, onEdit, now }) {
  const monday = mondayOf(anchor)
  const days = [0, 1, 2, 3, 4].map((i) => addDays(monday, i))
  const today = ymd(now)
  const selected = ymd(anchor)
  const thisWeek = ymd(mondayOf(now)) === ymd(monday)

  const byDate = useMemo(() => {
    const m = {}
    reservations.forEach((r) => (m[r.date] ||= []).push(r))
    return m
  }, [reservations])

  const friday = days[4]
  const title = `${monday.getMonth() + 1}월 ${monday.getDate()}일 – ${
    friday.getMonth() !== monday.getMonth() ? `${friday.getMonth() + 1}월 ` : ''
  }${friday.getDate()}일`

  const navBtn = 'soft-shadow flex h-11 w-11 items-center justify-center rounded-full bg-white active:bg-mist'

  return (
    <section className="anim-rise">
      <div className="mb-3 flex items-center gap-2">
        <h2 className="flex-1 text-lg font-bold">{title}</h2>
        {!thisWeek && (
          <button onClick={() => setAnchor(nearestWeekday(now))} className="min-h-11 rounded-full bg-white px-4 text-sm font-semibold soft-shadow active:bg-mist">
            오늘
          </button>
        )}
        <button className={navBtn} onClick={() => setAnchor(addDays(monday, -7))} aria-label="이전 주">
          <Icon name="left" />
        </button>
        <button className={navBtn} onClick={() => setAnchor(addDays(monday, 7))} aria-label="다음 주">
          <Icon name="right" />
        </button>
      </div>

      {/* 폰: 요일 고르기 + 하루 시간표 */}
      <div className="md:hidden">
        <div className="mb-3 grid grid-cols-5 gap-2" role="tablist" aria-label="요일 선택">
          {days.map((d, i) => {
            const key = ymd(d)
            const count = byDate[key]?.length || 0
            const on = key === selected
            const isToday = key === today
            return (
              <button
                key={key}
                role="tab"
                aria-selected={on}
                onClick={() => setAnchor(d)}
                className={`flex flex-col items-center rounded-[20px] py-2 ${on ? 'bg-white soft-shadow' : ''}`}
              >
                <span className={`text-xs ${isToday ? 'font-bold text-go' : 'text-sub'}`}>{isToday ? '오늘' : DAY_NAMES[i]}</span>
                <span
                  className={`mt-1 flex h-10 w-10 items-center justify-center rounded-full text-lg font-bold ${
                    on ? 'go-grad' : isToday ? 'bg-mist' : ''
                  }`}
                >
                  {d.getDate()}
                </span>
                <span className="mt-1 h-4 text-[11px] text-sub">{count ? `${count}건` : ''}</span>
              </button>
            )
          })}
        </div>
        <div className="grid grid-cols-[2.75rem_1fr] rounded-[28px] bg-white p-2 soft-shadow">
          <TimeAxis />
          <DayColumn
            date={selected}
            list={byDate[selected] || []}
            invMap={invMap}
            onNew={onNew}
            onEdit={onEdit}
            now={now}
            showNow={selected === today}
          />
        </div>
      </div>

      {/* 태블릿·PC: 주간 표 */}
      <div className="hidden rounded-[28px] bg-white p-3 soft-shadow md:block">
        <div className="grid grid-cols-[3.25rem_repeat(5,1fr)]">
          <div />
          {days.map((d, i) => {
            const isToday = ymd(d) === today
            return (
              <div key={ymd(d)} className="flex items-center justify-center gap-1.5 pb-3 text-sm">
                <span className={isToday ? 'font-bold text-go' : 'text-sub'}>{DAY_NAMES[i]}</span>
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-full font-bold ${isToday ? 'go-grad' : ''}`}
                >
                  {d.getDate()}
                </span>
              </div>
            )
          })}
          <TimeAxis />
          {days.map((d) => (
            <DayColumn
              key={ymd(d)}
              date={ymd(d)}
              list={byDate[ymd(d)] || []}
              invMap={invMap}
              onNew={onNew}
              onEdit={onEdit}
              now={now}
              showNow={ymd(d) === today}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
