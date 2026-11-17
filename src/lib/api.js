// 데이터 레이어: 화면은 이 파일의 함수만 사용해요.
// 나중에 기관 서버나 다른 DB로 바꿀 때 이 파일만 교체하면 돼요.
//
// 보안 구조: 테이블 직접 접근은 막혀 있고, 모든 요청은 초대코드를 함께 보내
// DB 함수(rr_*)가 코드를 확인한 뒤에만 처리해요.
import { supabase } from './supabase'

const STORAGE_KEY = 'rr_invite_code'
let code = null
try {
  code = localStorage.getItem(STORAGE_KEY)
} catch {
  /* 저장소를 못 쓰는 환경이면 매번 입력 */
}

export class InvalidCodeError extends Error {}

function friendly(error) {
  if (error.code === '28000') return new InvalidCodeError('초대코드가 맞지 않아요.')
  if (error.code === '23P01') return new Error('이미 다른 예약이 있는 시간이에요.')
  if (error.message?.includes('weekday_only')) return new Error('평일만 예약할 수 있어요.')
  if (error.message?.includes('hours_valid')) return new Error('운영 시간(9~18시) 안에서 선택해 주세요.')
  if (error.message?.includes('investigators_name_check')) return new Error('이름은 1~20자로 입력해 주세요.')
  return new Error(error.message || '요청을 처리하지 못했어요.')
}

async function call(fn, args = {}) {
  const { data, error } = await supabase.rpc(fn, { p_code: code, ...args })
  if (error) {
    const e = friendly(error)
    if (e instanceof InvalidCodeError) api.logout()
    throw e
  }
  return data
}

// 실시간 신호: 변경 내용은 담지 않고 "바뀌었음"만 알려요.
const channel = supabase.channel('room_res_signal', { config: { broadcast: { self: false } } })
let listeners = []
let statusListeners = []
channel
  .on('broadcast', { event: 'changed' }, () => listeners.forEach((f) => f()))
  .subscribe((status) => statusListeners.forEach((f) => f(status)))

function signal() {
  channel.send({ type: 'broadcast', event: 'changed', payload: {} })
}

async function write(fn, args) {
  await call(fn, args)
  signal()
}

export const api = {
  hasCode: () => !!code,

  async login(input) {
    const c = input.trim()
    const { error } = await supabase.rpc('rr_check', { p_code: c })
    if (error) throw friendly(error)
    code = c
    try {
      localStorage.setItem(STORAGE_KEY, c)
    } catch {
      /* 무시 */
    }
  },

  logout() {
    code = null
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      /* 무시 */
    }
  },

  listInvestigators: () => call('rr_list_investigators'),
  addInvestigator: (name) => write('rr_add_investigator', { p_name: name }),
  renameInvestigator: (id, name) => write('rr_rename_investigator', { p_id: id, p_name: name }),
  // 과거 예약 기록이 깨지지 않도록 실제 삭제 대신 비활성 처리
  removeInvestigator: (id) => write('rr_remove_investigator', { p_id: id }),
  restoreInvestigator: (id) => write('rr_restore_investigator', { p_id: id }),

  listReservations: (from, to) => call('rr_list_reservations', { p_from: from, p_to: to }),
  createReservation: (r) =>
    write('rr_create_reservation', {
      p_investigator_id: r.investigator_id,
      p_date: r.date,
      p_start: r.start_hour,
      p_end: r.end_hour,
      p_memo: r.memo || '',
    }),
  updateReservation: (id, r) =>
    write('rr_update_reservation', {
      p_id: id,
      p_investigator_id: r.investigator_id,
      p_date: r.date,
      p_start: r.start_hour,
      p_end: r.end_hour,
      p_memo: r.memo || '',
    }),
  deleteReservation: (id) => write('rr_delete_reservation', { p_id: id }),

  resetDemo: () => write('rr_reset_demo'),

  // 다른 사람이 바꾸면 onChange가 호출돼요. 반환값은 구독 해제 함수.
  subscribe(onChange, onStatus) {
    listeners.push(onChange)
    if (onStatus) statusListeners.push(onStatus)
    if (onStatus && channel.state === 'joined') onStatus('SUBSCRIBED')
    return () => {
      listeners = listeners.filter((f) => f !== onChange)
      statusListeners = statusListeners.filter((f) => f !== onStatus)
    }
  },
}
