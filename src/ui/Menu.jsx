import { useEffect, useRef, useState } from 'react'
import Icon from './Icon'

// ⋯ 버튼 메뉴: 자주 안 쓰는 기능을 숨겨 화면을 단순하게
export default function Menu({ items }) {
  const [open, setOpen] = useState(false)
  const [confirm, setConfirm] = useState(null)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    const close = (e) => !ref.current?.contains(e.target) && (setOpen(false), setConfirm(null))
    const esc = (e) => e.key === 'Escape' && (setOpen(false), setConfirm(null))
    document.addEventListener('pointerdown', close)
    document.addEventListener('keydown', esc)
    return () => {
      document.removeEventListener('pointerdown', close)
      document.removeEventListener('keydown', esc)
    }
  }, [open])

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="더보기"
        className="soft-shadow flex h-11 w-11 items-center justify-center rounded-full bg-white active:bg-mist"
      >
        <Icon name="more" />
      </button>
      {open && (
        <div role="menu" className="anim-fade absolute right-0 z-30 mt-2 w-60 overflow-hidden rounded-3xl bg-white p-1.5 shadow-xl ring-1 ring-line">
          {items.map((it) =>
            confirm === it.label ? (
              <div key={it.label} className="rounded-2xl bg-red-50 p-3">
                <p className="mb-2 text-sm font-medium">{it.confirm}</p>
                <div className="flex gap-1.5">
                  <button onClick={() => setConfirm(null)} className="min-h-10 flex-1 rounded-full bg-white text-sm font-semibold ring-1 ring-line">
                    아니요
                  </button>
                  <button
                    onClick={() => {
                      setOpen(false)
                      setConfirm(null)
                      it.run()
                    }}
                    className="min-h-10 flex-1 rounded-full bg-warn text-sm font-semibold text-white"
                  >
                    네, 진행
                  </button>
                </div>
              </div>
            ) : (
              <button
                key={it.label}
                role="menuitem"
                onClick={() => (it.confirm ? setConfirm(it.label) : (setOpen(false), it.run()))}
                className="flex min-h-12 w-full items-center gap-3 rounded-2xl px-3 text-left text-[15px] font-medium active:bg-mist"
              >
                <Icon name={it.icon} size={18} className="text-sub" />
                <span className="flex-1">{it.label}</span>
              </button>
            ),
          )}
        </div>
      )}
    </div>
  )
}
