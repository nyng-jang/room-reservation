import { useEffect } from 'react'
import Icon from './Icon'

// 폰에서는 아래에서 올라오는 시트, 넓은 화면에서는 가운데 대화상자
export default function Sheet({ title, onClose, children, footer }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [onClose])

  return (
    <div className="anim-fade fixed inset-0 z-40 flex items-end justify-center bg-black/35 sm:items-center" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        className="anim-sheet relative flex max-h-[92dvh] w-full max-w-md flex-col rounded-t-[28px] bg-paper sm:rounded-[28px]"
      >
        <div className="flex items-center justify-between px-5 pt-3 pb-2">
          <div className="absolute left-1/2 top-2 h-1 w-10 -translate-x-1/2 rounded-full bg-line sm:hidden" />
          <h2 className="pt-2 text-xl font-bold">{title}</h2>
          <button onClick={onClose} className="mt-1 flex h-11 w-11 items-center justify-center rounded-full text-sub active:bg-mist" aria-label="닫기">
            <Icon name="x" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 pb-4">{children}</div>
        {footer && <div className="border-t border-line px-5 pt-3 pb-[max(12px,env(safe-area-inset-bottom))]">{footer}</div>}
      </div>
    </div>
  )
}
