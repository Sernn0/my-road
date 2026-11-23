// 테스트 계정의 캐릭터 프로필 이미지 (가상의 간단한 캐릭터, 그림 파일 없이 SVG로 그린다)
// 계정마다 캐릭터를 정해 두고, 정해지지 않은 계정은 닉네임 첫 글자로 보여 준다.

type Character = "bunny" | "sprout" | "bear";

const CHARACTER_BY_USER: Record<string, Character> = {
  "00000000-0000-0000-0000-000000000001": "bunny", // 테스트 러너: 머리띠를 한 토끼
  "00000000-0000-0000-0000-000000000002": "sprout", // 러닝 새싹: 새싹 친구
  "00000000-0000-0000-0000-000000000003": "bear", // 로드 마스터 체험: 선글라스 곰
};

function Bunny() {
  return (
    <>
      <circle cx="50" cy="50" r="50" fill="#BAE6FD" />
      <ellipse cx="38" cy="26" rx="8" ry="19" fill="#fff" />
      <ellipse cx="62" cy="26" rx="8" ry="19" fill="#fff" />
      <ellipse cx="38" cy="27" rx="3.5" ry="13" fill="#FBCFE8" />
      <ellipse cx="62" cy="27" rx="3.5" ry="13" fill="#FBCFE8" />
      <circle cx="50" cy="62" r="25" fill="#fff" />
      <rect x="25" y="44" width="50" height="7" rx="3.5" fill="#EF4444" />
      <circle cx="41" cy="61" r="3.2" fill="#1F2937" />
      <circle cx="59" cy="61" r="3.2" fill="#1F2937" />
      <circle cx="35" cy="69" r="3.5" fill="#FBCFE8" />
      <circle cx="65" cy="69" r="3.5" fill="#FBCFE8" />
      <ellipse cx="50" cy="68" rx="3" ry="2.2" fill="#F472B6" />
      <path d="M45 73 Q50 77 55 73" stroke="#1F2937" strokeWidth="2" fill="none" strokeLinecap="round" />
    </>
  );
}

function Sprout() {
  return (
    <>
      <circle cx="50" cy="50" r="50" fill="#BBF7D0" />
      <path d="M50 38 C50 30 50 26 50 22" stroke="#15803D" strokeWidth="3" fill="none" strokeLinecap="round" />
      <ellipse cx="41" cy="21" rx="10" ry="5" fill="#22C55E" transform="rotate(-25 41 21)" />
      <ellipse cx="59" cy="19" rx="10" ry="5" fill="#16A34A" transform="rotate(25 59 19)" />
      <circle cx="50" cy="62" r="26" fill="#86EFAC" />
      <circle cx="41" cy="60" r="3.2" fill="#14532D" />
      <circle cx="59" cy="60" r="3.2" fill="#14532D" />
      <circle cx="35" cy="68" r="3.5" fill="#FDA4AF" />
      <circle cx="65" cy="68" r="3.5" fill="#FDA4AF" />
      <path d="M43 70 Q50 76 57 70" stroke="#14532D" strokeWidth="2.2" fill="none" strokeLinecap="round" />
    </>
  );
}

function Bear() {
  return (
    <>
      <circle cx="50" cy="50" r="50" fill="#FED7AA" />
      <circle cx="29" cy="36" r="10" fill="#92400E" />
      <circle cx="71" cy="36" r="10" fill="#92400E" />
      <circle cx="29" cy="36" r="5" fill="#D97706" />
      <circle cx="71" cy="36" r="5" fill="#D97706" />
      <circle cx="50" cy="59" r="27" fill="#B45309" />
      <ellipse cx="50" cy="70" rx="13" ry="10" fill="#FDE68A" />
      <ellipse cx="50" cy="65" rx="4.5" ry="3.2" fill="#1F2937" />
      <path d="M45 73 Q50 77 55 73" stroke="#1F2937" strokeWidth="2" fill="none" strokeLinecap="round" />
      <rect x="33" y="49" width="15" height="9" rx="3" fill="#111827" />
      <rect x="52" y="49" width="15" height="9" rx="3" fill="#111827" />
      <path d="M48 53 H52" stroke="#111827" strokeWidth="2" />
      <path d="M36 51 L40 51" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" />
    </>
  );
}

export default function Avatar({
  userId,
  nickname,
  size = 64,
}: {
  userId: string;
  nickname: string;
  size?: number;
}) {
  const character = CHARACTER_BY_USER[userId];
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      role="img"
      aria-label={`${nickname} 프로필 이미지`}
      className="shrink-0 rounded-full"
    >
      {character === "bunny" && <Bunny />}
      {character === "sprout" && <Sprout />}
      {character === "bear" && <Bear />}
      {!character && (
        <>
          <circle cx="50" cy="50" r="50" fill="#D1D5DB" />
          <text x="50" y="62" textAnchor="middle" fontSize="36" fontWeight="700" fill="#374151">
            {nickname.slice(0, 1)}
          </text>
        </>
      )}
    </svg>
  );
}
