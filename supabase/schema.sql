-- 조사실 예약 시스템 DB 구성 (Supabase / Postgres)
-- 초대코드는 아래 'CHANGE_ME'를 원하는 값으로 바꿔서 실행하세요. 코드는 bcrypt 해시로만 저장됩니다.

create extension if not exists btree_gist with schema extensions;
create schema if not exists room_res;

create table room_res.investigators (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 1 and 20),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table room_res.reservations (
  id uuid primary key default gen_random_uuid(),
  investigator_id uuid not null references room_res.investigators(id),
  date date not null,
  start_hour int not null,
  end_hour int not null,
  memo text check (memo is null or char_length(memo) <= 100), -- 거래 품목
  created_at timestamptz not null default now(),
  constraint hours_valid check (start_hour >= 9 and end_hour <= 18 and start_hour < end_hour),
  constraint weekday_only check (extract(isodow from date) between 1 and 5),
  constraint no_overlap exclude using gist (date with =, int4range(start_hour, end_hour) with &&)
);
create index reservations_date_idx on room_res.reservations(date);

create table room_res.settings (
  id int primary key default 1 check (id = 1),
  code_hash text not null
);

-- 정책 없이 RLS만 켜서 테이블 직접 접근은 전부 차단
alter table room_res.investigators enable row level security;
alter table room_res.reservations enable row level security;
alter table room_res.settings enable row level security;

insert into room_res.settings(code_hash) values (extensions.crypt('CHANGE_ME', extensions.gen_salt('bf', 8)));

create or replace function room_res.assert_code(p_code text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if p_code is null or not exists (
    select 1 from room_res.settings s where s.code_hash = extensions.crypt(p_code, s.code_hash)
  ) then
    raise exception 'invalid_code' using errcode = '28000';
  end if;
end; $$;
revoke all on function room_res.assert_code(text) from public;

-- 시연용 데이터 초기화
create or replace function room_res.reset_demo()
returns void language plpgsql security definer set search_path = '' as $$
declare
  monday date := date_trunc('week', (now() at time zone 'Asia/Seoul')::date)::date;
  ids uuid[];
begin
  delete from room_res.reservations where true;
  delete from room_res.investigators where true;
  with ins as (
    insert into room_res.investigators(name, created_at)
    select n, now() + (o * interval '1 second')
    from unnest(array['김하늘','이도윤','박서준','최지아','정우진','한소율']) with ordinality as t(n, o)
    returning id, created_at
  )
  select array_agg(id order by created_at) into ids from ins;
  insert into room_res.reservations(investigator_id, date, start_hour, end_hour, memo) values
    (ids[1], monday,      9, 11, '해외직구 무선이어폰'),
    (ids[2], monday,     14, 15, '블루투스 스피커'),
    (ids[3], monday + 1, 10, 12, '드론 조종기'),
    (ids[4], monday + 2, 13, 15, '스마트워치'),
    (ids[5], monday + 3,  9, 10, '태블릿 PC'),
    (ids[6], monday + 3, 15, 17, '무선 게임패드'),
    (ids[1], monday + 4, 11, 12, '해외직구 공유기'),
    (ids[2], monday + 7, 10, 11, '무선 키보드'),
    (ids[4], monday + 8, 14, 16, '액션캠');
end; $$;
revoke all on function room_res.reset_demo() from public;

-- 앱이 호출하는 함수: 전부 초대코드 확인 후 실행
create or replace function public.rr_check(p_code text) returns boolean
language plpgsql security definer set search_path = '' as $$
begin perform room_res.assert_code(p_code); return true; end; $$;

create or replace function public.rr_list_investigators(p_code text) returns jsonb
language plpgsql security definer set search_path = '' as $$
begin
  perform room_res.assert_code(p_code);
  return coalesce((select jsonb_agg(to_jsonb(i) order by i.created_at) from room_res.investigators i), '[]'::jsonb);
end; $$;

create or replace function public.rr_add_investigator(p_code text, p_name text) returns void
language plpgsql security definer set search_path = '' as $$
begin perform room_res.assert_code(p_code); insert into room_res.investigators(name) values (trim(p_name)); end; $$;

create or replace function public.rr_rename_investigator(p_code text, p_id uuid, p_name text) returns void
language plpgsql security definer set search_path = '' as $$
begin perform room_res.assert_code(p_code); update room_res.investigators set name = trim(p_name) where id = p_id; end; $$;

create or replace function public.rr_remove_investigator(p_code text, p_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin perform room_res.assert_code(p_code); update room_res.investigators set active = false where id = p_id; end; $$;

create or replace function public.rr_restore_investigator(p_code text, p_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin perform room_res.assert_code(p_code); update room_res.investigators set active = true where id = p_id; end; $$;

create or replace function public.rr_list_reservations(p_code text, p_from date, p_to date) returns jsonb
language plpgsql security definer set search_path = '' as $$
begin
  perform room_res.assert_code(p_code);
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', r.id, 'investigator_id', r.investigator_id, 'date', r.date,
      'start_hour', r.start_hour, 'end_hour', r.end_hour, 'memo', r.memo
    ) order by r.date, r.start_hour)
    from room_res.reservations r where r.date between p_from and p_to
  ), '[]'::jsonb);
end; $$;

create or replace function public.rr_create_reservation(p_code text, p_investigator_id uuid, p_date date, p_start int, p_end int, p_memo text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform room_res.assert_code(p_code);
  insert into room_res.reservations(investigator_id, date, start_hour, end_hour, memo)
  values (p_investigator_id, p_date, p_start, p_end, nullif(trim(p_memo), ''));
end; $$;

create or replace function public.rr_update_reservation(p_code text, p_id uuid, p_investigator_id uuid, p_date date, p_start int, p_end int, p_memo text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform room_res.assert_code(p_code);
  update room_res.reservations
     set investigator_id = p_investigator_id, date = p_date, start_hour = p_start, end_hour = p_end, memo = nullif(trim(p_memo), '')
   where id = p_id;
end; $$;

create or replace function public.rr_delete_reservation(p_code text, p_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin perform room_res.assert_code(p_code); delete from room_res.reservations where id = p_id; end; $$;

create or replace function public.rr_reset_demo(p_code text) returns void
language plpgsql security definer set search_path = '' as $$
begin perform room_res.assert_code(p_code); perform room_res.reset_demo(); end; $$;

do $$
declare f text;
begin
  foreach f in array array[
    'rr_check(text)','rr_list_investigators(text)','rr_add_investigator(text,text)',
    'rr_rename_investigator(text,uuid,text)','rr_remove_investigator(text,uuid)','rr_restore_investigator(text,uuid)',
    'rr_list_reservations(text,date,date)','rr_create_reservation(text,uuid,date,int,int,text)',
    'rr_update_reservation(text,uuid,uuid,date,int,int,text)','rr_delete_reservation(text,uuid)','rr_reset_demo(text)'
  ] loop
    execute format('revoke all on function public.%s from public', f);
    execute format('grant execute on function public.%s to anon, authenticated', f);
  end loop;
end $$;

select room_res.reset_demo();
