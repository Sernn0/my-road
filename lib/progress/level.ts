// 경험치와 레벨 (PLAN 18번, PRD 5번). 수치는 임의로 정한 값이며 개발하면서 조정한다.

// 레벨 5단계. 한 레벨 안에는 "구간"이 있고, 구간을 모두 채우면 다음 레벨로 오른다.
export const LEVELS = [
  { title: "새내기", sections: 3, xpPerSection: 100 },
  { title: "탐험가", sections: 3, xpPerSection: 200 },
  { title: "페이스메이커", sections: 4, xpPerSection: 300 },
  { title: "로드 마스터", sections: 4, xpPerSection: 500 },
  { title: "로드 레전드", sections: 5, xpPerSection: 800 },
] as const;

// 최고 레벨을 모두 채우는 데 필요한 누적 경험치 (8,100)
export const MAX_XP = LEVELS.reduce((sum, l) => sum + l.sections * l.xpPerSection, 0);

export type LevelInfo = {
  level: number; // 1~5
  title: string;
  section: number; // 현재 구간 (1부터)
  sectionCount: number;
  xpIntoSection: number; // 현재 구간에서 채운 경험치
  xpPerSection: number;
  xpToNext: number; // 다음 구간까지 남은 경험치 (최고 레벨 달성 후에는 0)
  maxed: boolean; // 최고 레벨(로드 레전드)을 모두 채웠다
};

export function levelInfo(totalXp: number): LevelInfo {
  const xp = Math.max(0, Math.floor(totalXp));
  let start = 0;
  for (let i = 0; i < LEVELS.length; i++) {
    const l = LEVELS[i];
    const levelXp = l.sections * l.xpPerSection;
    const isLast = i === LEVELS.length - 1;
    if (xp < start + levelXp || isLast) {
      const into = xp - start;
      const maxed = isLast && xp >= start + levelXp;
      const section = maxed ? l.sections : Math.floor(into / l.xpPerSection) + 1;
      const xpIntoSection = maxed ? l.xpPerSection : into - (section - 1) * l.xpPerSection;
      return {
        level: i + 1,
        title: l.title,
        section,
        sectionCount: l.sections,
        xpIntoSection,
        xpPerSection: l.xpPerSection,
        xpToNext: maxed ? 0 : l.xpPerSection - xpIntoSection,
        maxed,
      };
    }
    start += levelXp;
  }
  throw new Error("unreachable");
}

// 연속 일수에 따른 경험치 배율 (연속 일수는 이번 완주로 갱신된 값)
export function streakMultiplier(streakDays: number): number {
  if (streakDays >= 30) return 1.2;
  if (streakDays >= 14) return 1.15;
  if (streakDays >= 7) return 1.1;
  if (streakDays >= 3) return 1.05;
  return 1;
}

// 완주 경험치 = 코스 길이(km) × 10 × streak 배율, 소수점은 반올림 (예: 5.0km, 7일 연속 → 55점)
export function calcXp(courseKm: number, streakDays: number): number {
  return Math.round(courseKm * 10 * streakMultiplier(streakDays));
}
