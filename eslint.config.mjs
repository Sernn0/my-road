import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // 외부 라이브러리에서 그대로 복사해 온 파일 (MapLibre 지도 작업자)과 지울 파일 보관함은 검사하지 않는다
    "public/vendor/**",
    "trash-can/**",
  ]),
]);

export default eslintConfig;
