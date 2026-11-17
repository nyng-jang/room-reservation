import { createClient } from '@supabase/supabase-js'

// 공개(publishable) 키라 브라우저에 있어도 되는 값이에요.
// 이 키로는 테이블을 직접 볼 수 없고, 초대코드를 확인하는 DB 함수만 호출할 수 있어요.
const url = import.meta.env.VITE_SUPABASE_URL || 'https://uyswbtbphiewsqcbhjdd.supabase.co'
const key = import.meta.env.VITE_SUPABASE_KEY || 'sb_publishable_coRMUXs2OxwXQqU6QKJb9g_EV9E8YIw'

export const supabase = createClient(url, key, {
  auth: { persistSession: false },
})
