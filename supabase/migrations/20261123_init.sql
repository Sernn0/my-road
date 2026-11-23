-- 마이로드 초기 테이블 (DESIGN.md 4번)
-- 서버 API만 서버 키로 접근한다. 행 단위 보안(RLS)을 켜고 정책을 만들지 않아 브라우저 직접 접근은 막힌다.

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  nickname text not null,
  total_xp integer not null default 0,
  streak_count integer not null default 0,
  last_goal_date date,
  created_at timestamptz not null default now()
);

create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  name text not null,
  path jsonb not null,                       -- [[위도, 경도], ...] 코스 경로
  distance_km numeric(7,3) not null check (distance_km >= 0.1), -- 최소 0.1km
  start_lat double precision not null,
  start_lng double precision not null,
  created_at timestamptz not null default now()
);

-- 완주 요약만 저장한다. 이동 궤적(경로) 칸은 일부러 두지 않았다. (PRD 7번)
create table if not exists public.completions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  completed_at timestamptz not null default now(),
  duration_sec integer not null check (duration_sec >= 0),
  distance_km numeric(7,3) not null,         -- 코스 길이 기준
  xp integer not null default 0
);

create index if not exists courses_user_id_idx on public.courses(user_id);
create index if not exists completions_user_id_idx on public.completions(user_id);

alter table public.users enable row level security;
alter table public.courses enable row level security;
alter table public.completions enable row level security;

-- 서버 키(service_role)에만 접근 권한을 준다. 브라우저용 anon, authenticated에는 주지 않는다.
grant select, insert, update, delete on public.users, public.courses, public.completions to service_role;

-- 더미 사용자 1명 (실제 개인정보 없음, 번호를 고정해 코드에서 쓴다)
insert into public.users (id, nickname)
values ('00000000-0000-0000-0000-000000000001', '테스트 러너')
on conflict (id) do nothing;
