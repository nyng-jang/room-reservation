import { useState } from 'react'
import { api } from '../lib/api'
import Avatar from '../ui/Avatar'
import Icon from '../ui/Icon'

function Row({ inv, count, reload, notify }) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(inv.name)

  async function save() {
    if (!name.trim()) return notify('이름을 입력해 주세요.', { error: true })
    if (name.trim() === inv.name) return setEditing(false)
    try {
      await api.renameInvestigator(inv.id, name)
      setEditing(false)
      notify('이름을 바꿨어요.')
      reload()
    } catch (e) {
      notify(e.message, { error: true })
    }
  }

  async function remove() {
    try {
      await api.removeInvestigator(inv.id)
      reload()
      notify(`${inv.name} 조사관을 삭제했어요.`, {
        action: {
          label: '되돌리기',
          run: async () => {
            await api.restoreInvestigator(inv.id)
            reload()
            notify('되돌렸어요.')
          },
        },
      })
    } catch (e) {
      notify(e.message, { error: true })
    }
  }

  return (
    <li className="flex min-h-16 items-center gap-3 px-4 py-2">
      <Avatar inv={inv} size={40} />
      {editing ? (
        <>
          <input
            autoFocus
            value={name}
            maxLength={20}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => (e.key === 'Enter' ? save() : e.key === 'Escape' && setEditing(false))}
            className="min-h-11 min-w-0 flex-1 rounded-2xl bg-paper px-3 text-[15px] ring-1 ring-line focus:ring-2 focus:ring-go focus:outline-none"
            aria-label="새 이름"
          />
          <button onClick={save} className="min-h-11 rounded-full bg-go px-4 text-sm font-semibold text-white">
            저장
          </button>
        </>
      ) : (
        <>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[15px] font-bold">{inv.name}</div>
            <div className="text-xs text-sub">{count ? `이번 달 예약 ${count}건` : '이번 달 예약 없음'}</div>
          </div>
          <button
            onClick={() => setEditing(true)}
            className="flex h-11 w-11 items-center justify-center rounded-full text-sub active:bg-mist"
            aria-label={`${inv.name} 이름 바꾸기`}
          >
            <Icon name="edit" size={18} />
          </button>
          <button
            onClick={remove}
            className="flex h-11 w-11 items-center justify-center rounded-full text-sub active:bg-red-50 active:text-warn"
            aria-label={`${inv.name} 삭제`}
          >
            <Icon name="x" size={18} />
          </button>
        </>
      )}
    </li>
  )
}

export default function Investigators({ investigators, invMap, counts, reload, notify }) {
  const [name, setName] = useState('')

  async function add(e) {
    e.preventDefault()
    if (!name.trim()) return
    try {
      await api.addInvestigator(name)
      setName('')
      notify(`${name.trim()} 조사관을 추가했어요.`)
      reload()
    } catch (err) {
      notify(err.message, { error: true })
    }
  }

  return (
    <section className="anim-rise space-y-3">
      <div className="rounded-[28px] bg-white soft-shadow">
        <div className="flex items-center justify-between px-5 pt-4 pb-2">
          <h2 className="text-lg font-bold">조사관</h2>
          <span className="rounded-full bg-mist px-3 py-1 text-sm font-semibold">{investigators.length}명</span>
        </div>
        <ul className="divide-y divide-line/70">
          {investigators.map((inv) => (
            <Row key={inv.id} inv={invMap[inv.id]} count={counts[inv.id] || 0} reload={reload} notify={notify} />
          ))}
        </ul>
        <form onSubmit={add} className="flex gap-2 border-t border-line/70 p-3">
          <input
            value={name}
            maxLength={20}
            onChange={(e) => setName(e.target.value)}
            placeholder="새 조사관 이름"
            aria-label="새 조사관 이름"
            className="min-h-12 min-w-0 flex-1 rounded-full bg-paper px-4 text-[15px] ring-1 ring-line placeholder:text-faint focus:ring-2 focus:ring-go focus:outline-none"
          />
          <button
            disabled={!name.trim()}
            className="flex min-h-12 items-center gap-1 rounded-full bg-go px-5 text-[15px] font-semibold text-white disabled:bg-line disabled:text-faint"
          >
            <Icon name="plus" size={16} /> 추가
          </button>
        </form>
      </div>
      <p className="px-2 text-sm leading-relaxed text-sub">
        조사관을 삭제해도 지난 예약 기록은 남고, 시간표에 "(삭제됨)"으로 보여요. 실수로 지웠다면 알림의 되돌리기를 누르세요.
      </p>
    </section>
  )
}
