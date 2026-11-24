-- 더미 계정 3개 (PLAN 17번). 실제 개인정보가 없는 테스트용 가짜 데이터이고, 경험치·streak 값은 임의로 정했다.
-- 마지막 달성일은 "어제(한국 시간)"로 넣는다. 날짜가 지나도 테스트 계정은 streak이 끊기지 않게 앱이 읽을 때 보정한다. (lib/auth/current-user.ts)
-- 시연하다 쌓인 경험치·streak을 처음 값으로 되돌리고 싶을 때 이 파일을 다시 실행한다.

insert into public.users (id, nickname, total_xp, streak_count, last_goal_date)
values
  -- 페이스메이커 2/4 구간, streak 5일 (배율 ×1.05)
  ('00000000-0000-0000-0000-000000000001', '테스트 러너', 1250, 5, ((now() at time zone 'Asia/Seoul')::date - 1)),
  -- 새내기 1/3 구간, streak 없음
  ('00000000-0000-0000-0000-000000000002', '러닝 새싹', 80, 0, null),
  -- 로드 레전드 1/5 구간, streak 31일 (배율 ×1.20)
  ('00000000-0000-0000-0000-000000000003', '로드 마스터 체험', 4600, 31, ((now() at time zone 'Asia/Seoul')::date - 1))
on conflict (id) do update
  set nickname = excluded.nickname,
      total_xp = excluded.total_xp,
      streak_count = excluded.streak_count,
      last_goal_date = excluded.last_goal_date;
