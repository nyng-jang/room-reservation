import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { api, InvalidCodeError } from './lib/api'
import { PALETTE } from './lib/colors'
import { addDays, mondayOf, nearestWeekday, ymd } from './lib/date'
import Login from './components/Login'
import NowCard from './components/NowCard'
import WeekView from './components/WeekView'
import MonthView from './components/MonthView'
import Investigators from './components/Investigators'
import ReservationSheet from './components/ReservationSheet'
import Segmented from './ui/Segmented'
import Toast from './ui/Toast'
import Menu from './ui/Menu'
import Icon from './ui/Icon'

function rangeFor(anchor) {
  const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1)
  const last = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0)
  return [ymd(mondayOf(first)), ymd(addDays(mondayOf(last), 4))]
}

function useNow() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30_000)
    return () => clearInterval(t)
  }, [])
  return now
}

export default function App() {
  const now = useNow()
  const [authed, setAuthed] = useState(() => api.hasCode())
  const [tab, setTab] = useState('week')
  const [anchor, setAnchor] = useState(() => nearestWeekday(new Date()))
  const [investigators, setInvestigators] = useState([])
  const [reservations, setReservations] = useState([])
  const [todays, setTodays] = useState([])
  const [loading, setLoading] = useState(true)
  const [live, setLive] = useState('connecting')
  const [sheet, setSheet] = useState(null)
  const [toast, setToast] = useState(null)
  const toastTimer = useRef(null)

  const [from, to] = useMemo(() => rangeFor(anchor), [anchor])
  const today = ymd(now)

  const notify = useCallback((msg, opts = {}) => {
    setToast({ msg, id: Date.now(), ...opts })
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), opts.action ? 5000 : 2600)
  }, [])

  const load = useCallback(async () => {
    if (!api.hasCode()) return setAuthed(false)
    try {
      const [inv, res, tod] = await Promise.all([
        api.listInvestigators(),
        api.listReservations(from, to),
        api.listReservations(today, today),
      ])
      setInvestigators(inv)
      setReservations(res)
      setTodays(tod)
    } catch (e) {
      if (e instanceof InvalidCodeError) setAuthed(false)
      else notify(e.message, { error: true })
    } finally {
      setLoading(false)
    }
  }, [from, to, today, notify])

  useEffect(() => {
    if (authed) load()
  }, [load, authed])

  // 실시간 동기화: 누가 바꾸면 다시 불러오기
  const loadRef = useRef(load)
  useEffect(() => {
    loadRef.current = load
  }, [load])
  useEffect(() => {
    const unsub = api.subscribe(
      () => loadRef.current(),
      (s) => setLive(s === 'SUBSCRIBED' ? 'live' : s === 'CHANNEL_ERROR' || s === 'TIMED_OUT' ? 'off' : 'connecting'),
    )
    const onVisible = () => document.visibilityState === 'visible' && loadRef.current()
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      unsub()
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [])

  // 조사관 색은 등록 순서로 고정 → 모든 화면에서 같은 사람은 같은 색
  const invMap = useMemo(() => {
    const m = {}
    investigators.forEach((inv, i) => (m[inv.id] = { ...inv, color: PALETTE[i % PALETTE.length] }))
    return m
  }, [investigators])
  const active = investigators.filter((i) => i.active)

  const monthCounts = useMemo(() => {
    const prefix = ymd(now).slice(0, 7)
    const c = {}
    reservations.forEach((r) => r.date.startsWith(prefix) && (c[r.investigator_id] = (c[r.investigator_id] || 0) + 1))
    return c
  }, [reservations, now])

  function guard(e) {
    if (e instanceof InvalidCodeError) setAuthed(false)
    throw e
  }

  async function handleSave(payload, id) {
    await (id ? api.updateReservation(id, payload) : api.createReservation(payload)).catch(guard)
    setSheet(null)
    notify(id ? '예약을 변경했어요' : '예약했어요')
    load()
  }

  async function handleDelete(r) {
    try {
      await api.deleteReservation(r.id).catch(guard)
      setSheet(null)
      load()
      notify('예약을 취소했어요', {
        action: {
          label: '되돌리기',
          run: async () => {
            try {
              await api.createReservation(r)
              notify('되돌렸어요')
            } catch (e) {
              notify(`되돌리지 못했어요. ${e.message}`, { error: true })
            }
            load()
          },
        },
      })
    } catch (e) {
      notify(e.message, { error: true })
    }
  }

  async function handleReset() {
    try {
      await api.resetDemo()
      setAnchor(nearestWeekday(new Date()))
      notify('시연용 데이터로 되돌렸어요')
      load()
    } catch (e) {
      notify(e.message, { error: true })
    }
  }

  const openNew = (date, hour) => setSheet({ mode: 'new', date, start_hour: hour })
  const openEdit = (r) => setSheet({ mode: 'edit', ...r })

  if (!authed)
    return (
      <Login
        onDone={() => {
          setLoading(true)
          setAuthed(true)
        }}
      />
    )

  const liveDot = { live: ['bg-go', '실시간 반영 중'], connecting: ['bg-amber-400', '연결 중'], off: ['bg-faint', '실시간 꺼짐'] }[live]
  const fabDate = ymd(anchor) < today ? nearestWeekday(now) : anchor

  return (
    <div className="mx-auto min-h-dvh max-w-5xl px-4 pb-32">
      <header className="flex items-center gap-3 pt-5 pb-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold tracking-tight">조사실 예약</h1>
          <div className="mt-1 flex items-center gap-2 text-xs text-sub">
            <span className="rounded-full bg-mist px-2 py-0.5 font-semibold">시연용</span>
            <span className="flex items-center gap-1.5">
              <span className={`h-2 w-2 rounded-full ${liveDot[0]}`} />
              {liveDot[1]}
            </span>
          </div>
        </div>
        <Menu
          items={[
            { label: '데모 데이터 초기화', icon: 'refresh', confirm: '지금 데이터를 지우고 처음 상태로 돌릴까요?', run: handleReset },
            { label: '나가기', icon: 'logout', run: () => (api.logout(), setAuthed(false)) },
          ]}
        />
      </header>

      <div className="mb-4">
        <Segmented
          label="보기 선택"
          value={tab}
          onChange={setTab}
          options={[
            ['week', '주간'],
            ['month', '월간'],
            ['people', '조사관'],
          ]}
        />
      </div>

      {loading ? (
        <div className="space-y-3" aria-busy="true" aria-label="불러오는 중">
          <div className="h-32 animate-pulse rounded-[28px] bg-white/70" />
          <div className="h-96 animate-pulse rounded-[28px] bg-white/70" />
        </div>
      ) : (
        <div className="space-y-4">
          {tab !== 'people' && (
            <NowCard todays={todays} invMap={invMap} now={now} onBook={(h) => openNew(today, h)} onOpen={openEdit} />
          )}
          {tab === 'week' && (
            <WeekView anchor={anchor} setAnchor={setAnchor} reservations={reservations} invMap={invMap} onNew={openNew} onEdit={openEdit} now={now} />
          )}
          {tab === 'month' && (
            <MonthView anchor={anchor} setAnchor={setAnchor} reservations={reservations} invMap={invMap} onNew={openNew} onEdit={openEdit} now={now} />
          )}
          {tab === 'people' && <Investigators investigators={active} invMap={invMap} counts={monthCounts} reload={load} notify={notify} />}
        </div>
      )}

      {tab !== 'people' && !loading && !sheet && (
        <button
          onClick={() => openNew(ymd(fabDate), null)}
          className="fixed right-5 bottom-[max(24px,env(safe-area-inset-bottom))] z-20 flex min-h-14 items-center gap-2 rounded-full bg-go pr-6 pl-5 text-base font-semibold text-white shadow-xl active:opacity-85"
        >
          <Icon name="plus" size={20} /> 예약하기
        </button>
      )}

      {sheet && (
        <ReservationSheet
          initial={sheet}
          investigators={active}
          invMap={invMap}
          now={now}
          onClose={() => setSheet(null)}
          onSave={handleSave}
          onDelete={handleDelete}
        />
      )}

      <Toast
        toast={toast}
        onAction={() => {
          const a = toast?.action
          setToast(null)
          a?.run()
        }}
      />
    </div>
  )
}
