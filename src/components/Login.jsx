import { useState } from 'react'
import { api } from '../lib/api'
import Icon from '../ui/Icon'

export default function Login({ onDone }) {
  const [code, setCode] = useState('')
  const [show, setShow] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e) {
    e.preventDefault()
    if (!code.trim()) return
    setBusy(true)
    setError('')
    try {
      await api.login(code)
      onDone()
    } catch (err) {
      setError(err.message === '초대코드가 맞지 않아요.' ? '초대코드가 맞지 않아요. 단톡방 공지의 코드를 다시 확인해 주세요.' : err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center px-5">
      <form onSubmit={submit} className="anim-rise w-full max-w-sm rounded-[32px] bg-white p-7 soft-shadow">
        <span className="go-grad mb-5 flex h-14 w-14 items-center justify-center rounded-full">
          <Icon name="lock" size={26} />
        </span>
        <h1 className="text-2xl font-bold">조사실 예약</h1>
        <p className="mt-1 mb-6 text-[15px] text-sub">팀 단톡방 공지에 있는 초대코드를 입력해 주세요.</p>
        <label className="mb-1.5 block text-sm font-bold" htmlFor="code">
          초대코드
        </label>
        <div className="relative mb-2">
          <input
            id="code"
            type={show ? 'text' : 'password'}
            autoComplete="current-password"
            autoCapitalize="off"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="min-h-13 w-full rounded-2xl bg-paper px-4 pr-16 text-base ring-1 ring-line focus:ring-2 focus:ring-go focus:outline-none"
            autoFocus
          />
          <button
            type="button"
            onClick={() => setShow((v) => !v)}
            className="absolute top-1 right-1 min-h-11 rounded-xl px-3 text-sm font-semibold text-sub"
          >
            {show ? '숨기기' : '보기'}
          </button>
        </div>
        {error && (
          <p role="alert" className="mb-2 flex items-start gap-2 text-sm text-warn">
            <Icon name="alert" size={18} className="mt-0.5 shrink-0" />
            {error}
          </p>
        )}
        <button
          disabled={busy || !code.trim()}
          className="mt-3 min-h-13 w-full rounded-full bg-ink text-base font-semibold text-white active:opacity-85 disabled:bg-line disabled:text-faint"
        >
          {busy ? '확인 중…' : '들어가기'}
        </button>
        <p className="mt-5 text-center text-xs text-faint">시연용 · 가상 데이터 · 한 번 입력하면 이 기기에 기억돼요</p>
      </form>
    </div>
  )
}
