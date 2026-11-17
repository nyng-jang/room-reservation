export const OPEN = 9
export const CLOSE = 18
export const HOURS = [9, 10, 11, 12, 13, 14, 15, 16, 17] // 시작 가능 시각
export const DAY_NAMES = ['월', '화', '수', '목', '금']
const WEEK = '일월화수목금토'

export function ymd(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function parse(s) {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function addDays(d, n) {
  const x = new Date(d)
  x.setDate(x.getDate() + n)
  return x
}

export function mondayOf(d) {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  return addDays(x, -((x.getDay() + 6) % 7))
}

export function isWeekend(d) {
  const g = d.getDay()
  return g === 0 || g === 6
}

export function nearestWeekday(d) {
  let x = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  while (isWeekend(x)) x = addDays(x, 1)
  return x
}

export const dayLabel = (d) => `${d.getMonth() + 1}월 ${d.getDate()}일 (${WEEK[d.getDay()]})`
export const hourLabel = (h) => `${String(h).padStart(2, '0')}:00`
export const rangeLabel = (s, e) => `${hourLabel(s)}–${hourLabel(e)}`

// 지난 시간인지 (오늘이면 현재 시각 기준)
export function isPast(dateStr, hour, now) {
  const today = ymd(now)
  if (dateStr < today) return true
  if (dateStr > today) return false
  return hour < now.getHours()
}
