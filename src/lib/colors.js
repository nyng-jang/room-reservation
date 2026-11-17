// 조사관별 색: 중앙전파관리소 MI 색(GOK Blue·Red·Gray)과 누리집 보조 파랑을 먼저 쓰고,
// 사람이 많을 때 구분되도록 같은 톤의 차분한 색을 더함. 모두 흰 글자와 대비 4.5:1 이상.
export const PALETTE = ['#003668', '#e6002d', '#246beb', '#595757', '#0e6e7a', '#8a5300', '#5b3c99', '#a3002a']

export const tint = (hex, alpha = '1f') => `${hex}${alpha}`
