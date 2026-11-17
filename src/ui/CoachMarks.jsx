import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'

// 처음 온 사람을 위한 단계별 안내.
// 화면의 실제 요소(data-coach="이름")를 밝게 비추고 옆에 짧은 설명을 띄워요.
const PAD = 8
const GAP = 14
const reduceMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

function findTarget(name) {
  // 폰/PC에서 같은 이름이 여러 개면 지금 보이는 것만
  return [...document.querySelectorAll(`[data-coach="${name}"]`)].find((el) => {
    const r = el.getBoundingClientRect()
    return r.width > 0 && r.height > 0
  })
}

export default function CoachMarks({ steps, onDone }) {
  const available = steps.filter((s) => findTarget(s.target))
  const [i, setI] = useState(0)
  const [rect, setRect] = useState(null)
  const [box, setBox] = useState({ w: 320, h: 160 })
  const tipRef = useRef(null)
  const nextRef = useRef(null)
  const step = available[i]
  const last = i === available.length - 1

  const measure = useCallback(() => {
    const el = step && findTarget(step.target)
    if (!el) return setRect(null)
    const r = el.getBoundingClientRect()
    setRect({ top: r.top - PAD, left: r.left - PAD, width: r.width + PAD * 2, height: r.height + PAD * 2 })
  }, [step])

  // 단계가 바뀌면 대상을 화면 가운데로 옮기고 위치 재기
  useEffect(() => {
    const el = step && findTarget(step.target)
    if (!el) return
    const r = el.getBoundingClientRect()
    const fixed = getComputedStyle(el).position === 'fixed'
    if (!fixed && (r.top < 80 || r.bottom > window.innerHeight - 220)) {
      el.scrollIntoView({ block: 'center', behavior: reduceMotion() ? 'auto' : 'smooth' })
    }
    measure()
    const t = setTimeout(measure, 350)
    window.addEventListener('resize', measure)
    window.addEventListener('scroll', measure, true)
    return () => {
      clearTimeout(t)
      window.removeEventListener('resize', measure)
      window.removeEventListener('scroll', measure, true)
    }
  }, [step, measure])

  useLayoutEffect(() => {
    if (tipRef.current) setBox({ w: tipRef.current.offsetWidth, h: tipRef.current.offsetHeight })
  }, [i, rect])

  useEffect(() => {
    nextRef.current?.focus({ preventScroll: true })
    const onKey = (e) => {
      if (e.key === 'Escape') onDone()
      if (e.key === 'ArrowRight') setI((v) => Math.min(v + 1, available.length - 1))
      if (e.key === 'ArrowLeft') setI((v) => Math.max(v - 1, 0))
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [i, available.length, onDone])

  if (!step || !rect) return null

  const vw = window.innerWidth
  const vh = window.innerHeight
  const below = rect.top + rect.height + GAP + box.h < vh - 12 || rect.top - GAP - box.h < 12
  const top = below ? Math.min(rect.top + rect.height + GAP, vh - box.h - 12) : rect.top - GAP - box.h
  const left = Math.min(Math.max(12, rect.left + rect.width / 2 - box.w / 2), vw - box.w - 12)
  const arrowLeft = Math.min(Math.max(20, rect.left + rect.width / 2 - left), box.w - 20)

  return (
    <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-labelledby="coach-title" aria-describedby="coach-body">
      {/* 클릭이 뒤로 새지 않게 막는 층 */}
      <div className="absolute inset-0" />
      {/* 대상만 밝게 */}
      <div
        className="pointer-events-none absolute rounded-[24px] ring-2 ring-white/90"
        style={{
          ...rect,
          boxShadow: '0 0 0 9999px rgb(0 20 45 / 0.62)',
          transition: reduceMotion() ? 'none' : 'all .28s cubic-bezier(.2,.8,.2,1)',
        }}
      />
      <div
        ref={tipRef}
        key={i}
        className="anim-fade absolute w-[min(340px,calc(100vw-24px))] rounded-[24px] bg-white p-5 shadow-2xl"
        style={{ top, left }}
      >
        <span
          className="absolute h-3.5 w-3.5 rotate-45 bg-white"
          style={below ? { top: -7, left: arrowLeft - 7 } : { bottom: -7, left: arrowLeft - 7 }}
          aria-hidden="true"
        />
        <div className="mb-1 flex items-center justify-between">
          <span className="text-xs font-bold text-go">
            {i + 1} / {available.length}
          </span>
          <button onClick={onDone} className="-mr-2 min-h-11 rounded-full px-3 text-sm font-medium text-sub active:bg-mist">
            건너뛰기
          </button>
        </div>
        <h2 id="coach-title" className="text-lg font-bold">
          {step.title}
        </h2>
        <p id="coach-body" className="mt-1 text-[15px] leading-relaxed text-sub">
          {step.body}
        </p>
        <div className="mt-4 flex items-center gap-2">
          <div className="flex flex-1 gap-1.5" aria-hidden="true">
            {available.map((_, k) => (
              <span key={k} className={`h-1.5 rounded-full transition-all ${k === i ? 'w-5 bg-go' : 'w-1.5 bg-line'}`} />
            ))}
          </div>
          {i > 0 && (
            <button onClick={() => setI(i - 1)} className="min-h-11 rounded-full px-4 text-[15px] font-semibold text-sub active:bg-mist">
              이전
            </button>
          )}
          <button
            ref={nextRef}
            onClick={() => (last ? onDone() : setI(i + 1))}
            className="min-h-11 rounded-full bg-go px-5 text-[15px] font-semibold text-white active:opacity-85"
          >
            {last ? '시작하기' : '다음'}
          </button>
        </div>
      </div>
    </div>
  )
}
