import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // shadcn-style primitives intentionally extend empty HTML interfaces
      "@typescript-eslint/no-empty-object-type": "off",
      // Supabase query results are untyped; explicit any is used pragmatically
      "@typescript-eslint/no-explicit-any": "off",
      // Server data fetched in RSC is synced to client state in effects by design
      "react-hooks/set-state-in-effect": "off",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "supabase/migrations/**",
    "supabase/seed.sql",
  ]),
]);

export default eslintConfig;