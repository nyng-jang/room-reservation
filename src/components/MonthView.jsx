import { useMemo } from 'react'
import Icon from '../ui/Icon'
import BookingCard from './BookingCard'
import { DAY_NAMES, addDays, dayLabel, isPast, mondayOf, ymd } from '../lib/date'

export default function MonthView({ anchor, setAnchor, reservations, invMap, onNew, onEdit, now }) {
  const y = anchor.getFullYear()
  const m = anchor.getMonth()
  const first = new Date(y, m, 1)
  const last = new Date(y, m + 1, 0)
  const today = ymd(now)
  const selected = ymd(anchor)

  const weeks = []
  for (let mon = mondayOf(first); mon <= last; mon = addDays(mon, 7)) weeks.push([0, 1, 2, 3, 4].map((i) => addDays(mon, i)))

  const byDate = useMemo(() => {
    const map = {}
    reservations.forEach((r) => (map[r.date] ||= []).push(r))
    return map
  }, [reservations])

  function moveMonth(n) {
    const d = new Date(y, m + n, 1)
    while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() + 1)
    setAnchor(d)
  }

  const dayList = byDate[selected] || []
  const navBtn = 'soft-shadow flex h-11 w-11 items-center justify-center rounded-full bg-white active:bg-mist'
  const canBookSelected = !isPast(selected, 17, now)

  return (
    <section className="anim-rise space-y-3">
      <div className="rounded-[28px] bg-white p-4 soft-shadow">
        <div className="mb-3 flex items-center gap-2">
          <h2 className="flex-1 pl-1 text-lg font-bold">
            {y}년 {m + 1}월
          </h2>
          <button className={navBtn} onClick={() => moveMonth(-1)} aria-label="이전 달">
            <Icon name="left" />
          </button>
          <button className={navBtn} onClick={() => moveMonth(1)} aria-label="다음 달">
            <Icon name="right" />
          </button>
        </div>
        <div className="grid grid-cols-5 gap-y-1">
          {DAY_NAMES.map((n) => (
            <div key={n} className="pb-1 text-center text-xs font-medium text-faint">
              {n}
            </div>
          ))}
          {weeks.flat().map((d) => {
            const key = ymd(d)
            const inMonth = d.getMonth() === m
            const list = byDate[key] || []
            const on = key === selected
            const isToday = key === today
            const people = [...new Set(list.map((r) => r.investigator_id))]
            return (
              <button
                key={key}
                onClick={() => setAnchor(d)}
                aria-pressed={on}
                aria-label={`${dayLabel(d)} 예약 ${list.length}건`}
                className={`flex min-h-16 flex-col items-center rounded-2xl py-1 ${inMonth ? '' : 'opacity-35'}`}
              >
                <span
                  className={`flex h-10 w-10 items-center justify-center rounded-full text-[15px] font-semibold ${
                    on ? 'go-grad font-bold' : isToday ? 'bg-mist font-bold' : ''
                  }`}
                >
                  {d.getDate()}
                </span>
                <span className="mt-1 flex h-2 items-center gap-0.5">
                  {people.slice(0, 4).map((id) => (
                    <span key={id} className="h-1.5 w-1.5 rounded-full" style={{ background: invMap[id]?.color || '#a3a39e' }} />
                  ))}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="rounded-[28px] bg-white p-4 soft-shadow">
        <div className="mb-3 flex items-center justify-between pl-1">
          <h3 className="font-bold">{dayLabel(anchor)}</h3>
          <span className="text-sm text-sub">{dayList.length ? `예약 ${dayList.length}건` : '예약 없음'}</span>
        </div>
        <div className="space-y-2">
          {dayList.map((r) => (
            <BookingCard key={r.id} r={r} inv={invMap[r.investigator_id]} onClick={() => onEdit(r)} past={isPast(r.date, r.end_hour - 1, now)} />
          ))}
          {canBookSelected && (
            <button
              onClick={() => onNew(selected, null)}
              className="flex min-h-12 w-full items-center justify-center gap-1.5 rounded-2xl border border-dashed border-line text-sm font-semibold text-sub active:bg-go-soft"
            >
              <Icon name="plus" size={16} /> 이 날 예약하기
            </button>
          )}
        </div>
      </div>
    </section>
  )
}
