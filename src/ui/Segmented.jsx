// 알약 모양 탭 (plush tabs 스타일)
export default function Segmented({ value, onChange, options, label }) {
  return (
    <div role="tablist" aria-label={label} className="flex rounded-full bg-mist p-1">
      {options.map(([k, l]) => {
        const on = value === k
        return (
          <button
            key={k}
            role="tab"
            aria-selected={on}
            onClick={() => onChange(k)}
            className={`min-h-11 flex-1 rounded-full text-[15px] font-semibold transition ${
              on ? 'soft-shadow bg-white text-ink' : 'text-sub active:bg-white/60'
            }`}
          >
            {l}
          </button>
        )
      })}
    </div>
  )
}
