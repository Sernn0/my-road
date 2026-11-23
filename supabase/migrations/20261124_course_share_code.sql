-- 공유 코드 (코스를 코드로 다른 계정에 추가하기 위한 6자리 코드). 처음 공유할 때 만들어진다.
alter table public.courses add column if not exists share_code text unique;
