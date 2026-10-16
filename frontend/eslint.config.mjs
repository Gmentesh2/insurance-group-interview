import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
export default defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // These client views deliberately restore browser drafts and load authenticated
    // data in effects; they do not derive render state from other React state.
    files: ["src/components/**/*.tsx"],
    rules: { "react-hooks/set-state-in-effect": "off" },
  },
  globalIgnores([
    ".next/**",
    "next-env.d.ts",
    ".artifacts/**",
    "coverage/**",
    "playwright-report/**",
    "test-results/**",
  ]),
]);
