-- 시연용 샘플 코스를 모든 계정에서 바로 보이게 하기 위한 표시 칸
-- is_demo가 true인 코스는 시연 모드에서 모든 계정의 목록에 나타나고, 이름 변경·삭제는 할 수 없다.
alter table public.courses add column if not exists is_demo boolean not null default false;

update public.courses set is_demo = true
where id in (
  '00000000-0000-0000-0000-0000000000a1',
  '00000000-0000-0000-0000-0000000000a2',
  '00000000-0000-0000-0000-0000000000a3',
  '00000000-0000-0000-0000-0000000000a4'
);
