import Icon from './Icon'

// plush "Sent" 스타일 알림: 검은 알약 + 초록 체크, 필요하면 되돌리기 버튼
export default function Toast({ toast, onAction }) {
  if (!toast) return null
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-24 z-50 flex justify-center px-4" role="status" aria-live="polite">
      <div key={toast.id} className="anim-rise pointer-events-auto flex max-w-md items-center gap-2.5 rounded-full bg-ink py-2 pr-2 pl-2.5 text-white shadow-xl">
        <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${toast.error ? 'bg-warn' : 'go-grad text-ink'}`}>
          <Icon name={toast.error ? 'alert' : 'check'} size={16} stroke={2.6} />
        </span>
        <span className="pr-2 text-[15px] font-medium">{toast.msg}</span>
        {toast.action && (
          <button onClick={onAction} className="flex min-h-10 items-center gap-1 rounded-full bg-white/15 px-3.5 text-sm font-semibold active:bg-white/25">
            <Icon name="undo" size={15} /> {toast.action.label}
          </button>
        )}
      </div>
    </div>
  )
}
