import Icon from './Icon'

// − 값 + 카운터 (plush counter 스타일)
export default function Counter({ value, min, max, onChange, unit, label }) {
  const btn =
    'soft-shadow flex h-11 w-11 items-center justify-center rounded-full bg-white text-ink disabled:text-faint disabled:shadow-none'
  return (
    <div className="flex items-center gap-4" role="group" aria-label={label}>
      <button type="button" className={btn} disabled={value <= min} onClick={() => onChange(value - 1)} aria-label={`${label} 줄이기`}>
        <Icon name="minus" />
      </button>
      <div className="min-w-16 text-center" aria-live="polite">
        <span className="text-3xl font-bold">{value}</span>
        <span className="ml-1 text-sm text-sub">{unit}</span>
      </div>
      <button type="button" className={btn} disabled={value >= max} onClick={() => onChange(value + 1)} aria-label={`${label} 늘리기`}>
        <Icon name="plus" />
      </button>
    </div>
  )
}
