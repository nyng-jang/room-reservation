// 단순한 선형 아이콘 (24px 격자, currentColor)
const PATHS = {
  check: 'M5 12.5l4.5 4.5L19 7.5',
  left: 'M15 5l-7 7 7 7',
  right: 'M9 5l7 7-7 7',
  plus: 'M12 5v14M5 12h14',
  minus: 'M5 12h14',
  x: 'M6 6l12 12M18 6L6 18',
  more: 'M5 12h.01M12 12h.01M19 12h.01',
  clock: 'M12 7v5l3 2M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  lock: 'M7 11V8a5 5 0 0110 0v3M6 11h12v9H6z',
  undo: 'M9 14L4 9l5-5M4 9h10a6 6 0 010 12h-3',
  alert: 'M12 8v5M12 16.5h.01M10.3 3.9L2.4 18a2 2 0 001.7 3h15.8a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z',
  users: 'M16 20v-1.5a3.5 3.5 0 00-3.5-3.5h-5A3.5 3.5 0 004 18.5V20M10 11a3.5 3.5 0 100-7 3.5 3.5 0 000 7zM20 20v-1.5a3.5 3.5 0 00-2.5-3.35M15.5 4.15a3.5 3.5 0 010 6.7',
  calendar: 'M7 3v3M17 3v3M4 9h16M5 5h14a1 1 0 011 1v13a1 1 0 01-1 1H5a1 1 0 01-1-1V6a1 1 0 011-1z',
  pin: 'M12 21s-6-5.3-6-10a6 6 0 1112 0c0 4.7-6 10-6 10zM12 13a2 2 0 100-4 2 2 0 000 4z',
  edit: 'M4 20h4L19 9l-4-4L4 16v4z',
  logout: 'M15 4h3a2 2 0 012 2v12a2 2 0 01-2 2h-3M10 16l-4-4 4-4M6 12h10',
  help: 'M9.1 9a3 3 0 015.8 1c0 2-3 2.5-3 4.5M12 17.5h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  refresh: 'M20 11a8 8 0 00-14.9-3M4 4v4h4M4 13a8 8 0 0014.9 3M20 20v-4h-4',
}

export default function Icon({ name, size = 20, stroke = 2, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={name === 'more' ? 3.2 : stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d={PATHS[name]} />
    </svg>
  )
}
