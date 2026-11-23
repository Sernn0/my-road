// 공유 코드: 헷갈리기 쉬운 글자(0, O, 1, I, L)를 뺀 6자리 영문·숫자
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
export const SHARE_CODE_LENGTH = 6;

export function makeShareCode(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(SHARE_CODE_LENGTH));
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join("");
}

const UUID_IN_TEXT = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

// 사용자가 넣은 값이 공유 코드인지, 공유 링크(코스 번호가 들어 있음)인지 구분한다
export function parseShareInput(input: string): { code: string } | { id: string } | null {
  const text = input.trim();
  const id = UUID_IN_TEXT.exec(text)?.[0];
  if (id) return { id: id.toLowerCase() };
  const code = text.toUpperCase().replace(/[\s-]/g, "");
  return code.length === SHARE_CODE_LENGTH && [...code].every((c) => ALPHABET.includes(c)) ? { code } : null;
}
