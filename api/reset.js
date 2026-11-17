// 매일 자정(KST) Vercel Cron이 호출: 시연 데이터 초기화 + Supabase 무료 플랜 일시정지 방지
// RR_CODE(초대코드)는 Vercel 환경변수에만 저장
export default async function handler(req, res) {
  if (process.env.CRON_SECRET && req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ ok: false })
  }
  const url = process.env.VITE_SUPABASE_URL || 'https://uyswbtbphiewsqcbhjdd.supabase.co'
  const key = process.env.VITE_SUPABASE_KEY || 'sb_publishable_coRMUXs2OxwXQqU6QKJb9g_EV9E8YIw'
  const r = await fetch(`${url}/rest/v1/rpc/rr_reset_demo`, {
    method: 'POST',
    headers: { apikey: key, 'Content-Type': 'application/json' },
    body: JSON.stringify({ p_code: process.env.RR_CODE || '' }),
  })
  res.status(r.ok ? 200 : 500).json({ ok: r.ok, status: r.status })
}
