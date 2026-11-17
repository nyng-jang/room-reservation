import { useEffect, useMemo, useState } from 'react'
import { api } from '../lib/api'
import Sheet from '../ui/Sheet'
import Avatar from '../ui/Avatar'
import Counter from '../ui/Counter'
import Icon from '../ui/Icon'
import { CLOSE, DAY_NAMES, HOURS, addDays, dayLabel, hourLabel, isPast, mondayOf, parse, rangeLabel, ymd } from '../lib/date'

export const PURPOSE = '미인증 방송통신기자재 중고거래(1년 이내) 조사'
const LAST_INV = 'rr_last_investigator'

function Field({ label, hint, children }) {
  return (
    <div className="mb-5">
      <div className="mb-2 flex items-baseline justify-between">
        <span className="text-sm font-bold">{label}</span>
        {hint && <span className="text-xs text-sub">{hint}</span>}
      </div>
      {children}
    </div>
  )
}

export default function ReservationSheet({ initial, investigators, invMap, now, onClose, onSave, onDelete }) {
  const isEdit = initial.mode === 'edit'
  const readOnly = isEdit && isPast(initial.date, initial.end_hour - 1, now)

  const remembered = (() => {
    try {
      return localStorage.getItem(LAST_INV)
    } catch {
      return null
    }
  })()
  const defaultInv =
    initial.investigator_id || (investigators.some((i) => i.id === remembered) ? remembered : investigators[0]?.id) || ''

  const [invId, setInvId] = useState(defaultInv)
  const [date, setDate] = useState(initial.date)
  const [start, setStart] = useState(initial.start_hour ?? null)
  const [dur, setDur] = useState(isEdit ? initial.end_hour - initial.start_hour : 1)
  const [memo, setMemo] = useState(initial.memo || '')
  const [dayList, setDayList] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  // 고른 날짜의 최신 예약을 다시 불러와서 이미 찬 시간은 처음부터 못 고르게 (오류 예방)
  useEffect(() => {
    let alive = true
    setDayList(null)
    api
      .listReservations(date, date)
      .then((list) => alive && setDayList(list))
      .catch(() => alive && setDayList([]))
    return () => {
      alive = false
    }
  }, [date])

  const taken = useMemo(() => {
    const s = new Set()
    ;(dayList || []).forEach((r) => {
      if (isEdit && r.id === initial.id) return
      for (let h = r.start_hour; h < r.end_hour; h++) s.add(h)
    })
    return s
  }, [dayList, isEdit, initial.id])

  const maxDur = useMemo(() => {
    if (start == null) return 1
    let n = 0
    for (let h = start; h < CLOSE && !taken.has(h); h++) n++
    return Math.max(n, 1)
  }, [start, taken])

  // 고른 시작 시간이 막히면 해제, 길이는 가능한 범위로 줄이기
  useEffect(() => {
    if (start != null && (taken.has(start) || isPast(date, start, now))) setStart(null)
  }, [taken, start, date, now])
  const effDur = Math.min(dur, maxDur)

  const monday = mondayOf(parse(date))
  const weekDays = [0, 1, 2, 3, 4].map((i) => addDays(monday, i))
  const thisMonday = mondayOf(now)
  const options = [...investigators]
  if (isEdit && invMap[initial.investigator_id] && !invMap[initial.investigator_id].active) options.push(invMap[initial.investigator_id])

  async function submit() {
    setError('')
    if (!invId) return setError('조사관을 골라 주세요.')
    if (start == null) return setError('시작 시간을 골라 주세요.')
    setBusy(true)
    try {
      await onSave({ investigator_id: invId, date, start_hour: start, end_hour: start + effDur, memo: memo.trim() || null }, isEdit ? initial.id : null)
      try {
        localStorage.setItem(LAST_INV, invId)
      } catch {
        /* 무시 */
      }
    } catch (err) {
      setError(err.message)
      // 그 사이 다른 사람이 예약했을 수 있으니 시간표 새로고침
      api.listReservations(date, date).then(setDayList).catch(() => {})
    } finally {
      setBusy(false)
    }
  }

  const summary = start != null ? `${dayLabel(parse(date))} ${rangeLabel(start, start + effDur)}` : null

  if (readOnly) {
    const inv = invMap[initial.investigator_id]
    return (
      <Sheet title="지난 예약" onClose={onClose}>
        <div className="mb-4 flex items-center gap-3 rounded-2xl bg-white p-4 soft-shadow">
          <Avatar inv={inv} size={40} />
          <div>
            <div className="font-bold">{inv?.name}</div>
            <div className="text-sm text-sub">
              {dayLabel(parse(initial.date))} {rangeLabel(initial.start_hour, initial.end_hour)}
            </div>
          </div>
        </div>
        <Info label="조사 목적" value={PURPOSE} />
        <Info label="거래 품목" value={initial.memo || '—'} />
        <p className="mt-3 text-sm text-sub">지난 예약은 기록으로만 볼 수 있어요.</p>
      </Sheet>
    )
  }

  return (
    <Sheet
      title={isEdit ? '예약 변경' : '조사실 예약'}
      onClose={onClose}
      footer={
        <>
          {error && (
            <p role="alert" className="mb-3 flex items-start gap-2 rounded-2xl bg-red-50 px-3 py-2.5 text-sm text-warn">
              <Icon name="alert" size={18} className="mt-0.5 shrink-0" />
              {error}
            </p>
          )}
          <div className="flex gap-2">
            {isEdit && (
              <button
                onClick={() => onDelete(initial)}
                className="min-h-13 rounded-full px-4 text-[15px] font-semibold text-warn active:bg-red-50"
              >
                예약 취소
              </button>
            )}
            <button
              onClick={submit}
              disabled={busy || start == null || !invId}
              className="min-h-13 flex-1 rounded-full bg-ink px-4 text-[15px] font-semibold text-white active:opacity-85 disabled:bg-line disabled:text-faint"
            >
              {busy ? '저장 중…' : summary ? `${summary} ${isEdit ? '로 변경' : '예약'}` : '시작 시간을 골라 주세요'}
            </button>
          </div>
        </>
      }
    >
      <Field label="조사관">
        <div className="flex flex-wrap gap-2">
          {options.map((i) => {
            const on = invId === i.id
            const inv = invMap[i.id]
            return (
              <button
                key={i.id}
                onClick={() => setInvId(i.id)}
                aria-pressed={on}
                className={`flex min-h-11 items-center gap-2 rounded-full py-1 pr-4 pl-1 text-[15px] font-semibold transition ${
                  on ? 'bg-white ring-2 ring-go soft-shadow' : 'bg-white/70 text-sub ring-1 ring-line'
                }`}
              >
                <Avatar inv={inv} size={30} />
                {i.name}
                {on && <Icon name="check" size={16} className="text-go" />}
              </button>
            )
          })}
        </div>
      </Field>

      <Field label="날짜" hint="평일만 운영">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setDate(ymd(addDays(monday, -7)))}
            disabled={addDays(monday, -7) < thisMonday}
            className="flex h-11 w-9 shrink-0 items-center justify-center rounded-full text-sub disabled:text-line"
            aria-label="이전 주"
          >
            <Icon name="left" size={18} />
          </button>
          <div className="grid flex-1 grid-cols-5 gap-1.5">
            {weekDays.map((d, i) => {
              const key = ymd(d)
              const on = key === date
              const past = isPast(key, 17, now)
              return (
                <button
                  key={key}
                  disabled={past}
                  onClick={() => setDate(key)}
                  aria-pressed={on}
                  className={`flex min-h-14 flex-col items-center justify-center rounded-2xl text-sm ${
                    on ? 'go-grad font-bold' : past ? 'text-line' : 'bg-white ring-1 ring-line'
                  }`}
                >
                  <span className="text-[11px]">{DAY_NAMES[i]}</span>
                  <span className="text-base font-bold">{d.getDate()}</span>
                </button>
              )
            })}
          </div>
          <button
            onClick={() => setDate(ymd(addDays(monday, 7)))}
            className="flex h-11 w-9 shrink-0 items-center justify-center rounded-full text-sub"
            aria-label="다음 주"
          >
            <Icon name="right" size={18} />
          </button>
        </div>
      </Field>

      <Field label="시작 시간" hint={dayList ? '회색은 이미 예약됐거나 지난 시간' : '빈 시간 확인 중…'}>
        <div className="grid grid-cols-3 gap-2">
          {HOURS.map((h) => {
            const isTaken = taken.has(h)
            const past = isPast(date, h, now)
            const disabled = !dayList || isTaken || past
            const on = start === h
            const inRange = start != null && h > start && h < start + effDur
            return (
              <button
                key={h}
                disabled={disabled}
                onClick={() => setStart(h)}
                aria-pressed={on}
                className={`flex min-h-12 flex-col items-center justify-center rounded-2xl text-[15px] font-semibold transition ${
                  on
                    ? 'go-grad'
                    : inRange
                      ? 'bg-go-soft text-ink'
                      : disabled
                        ? 'bg-mist/60 text-faint'
                        : 'bg-white ring-1 ring-line active:bg-go-soft'
                }`}
              >
                {hourLabel(h)}
                {isTaken && <span className="text-[10px] font-medium">예약됨</span>}
                {!isTaken && past && <span className="text-[10px] font-medium">지남</span>}
              </button>
            )
          })}
        </div>
      </Field>

      <Field label="이용 시간" hint={start != null ? `최대 ${maxDur}시간 가능` : '시작 시간을 먼저 골라 주세요'}>
        <div className="flex justify-center rounded-2xl bg-white py-3 ring-1 ring-line">
          <Counter value={start == null ? 1 : effDur} min={1} max={start == null ? 1 : maxDur} onChange={setDur} unit="시간" label="이용 시간" />
        </div>
      </Field>

      <Field label="조사 목적">
        <div className="flex items-center gap-2 rounded-2xl bg-go-soft px-4 py-3 text-sm font-semibold">
          <Icon name="lock" size={16} className="shrink-0 text-go" />
          {PURPOSE}
        </div>
      </Field>

      <Field label="거래 품목" hint="선택">
        <input
          value={memo}
          maxLength={100}
          onChange={(e) => setMemo(e.target.value)}
          placeholder="예: 해외직구 무선이어폰"
          className="min-h-12 w-full rounded-2xl bg-white px-4 text-[15px] ring-1 ring-line placeholder:text-faint focus:ring-2 focus:ring-go focus:outline-none"
        />
        <p className="mt-1.5 text-xs text-sub">피조사자 이름·연락처 같은 개인정보는 적지 마세요.</p>
      </Field>
    </Sheet>
  )
}

function Info({ label, value }) {
  return (
    <div className="mb-2 rounded-2xl bg-white px-4 py-3 ring-1 ring-line">
      <div className="text-xs text-sub">{label}</div>
      <div className="text-[15px] font-semibold">{value}</div>
    </div>
  )
}
