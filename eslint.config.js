import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
  },
  {
    // Tests E2E Playwright (Node, pas de React).
    files: ['e2e/**/*.ts', 'playwright.config.ts'],
    languageOptions: {
      globals: globals.node,
    },
  },
  {
    // API publique des features : on n'importe jamais un fichier interne, seulement le
    // barrel `@/features/<nom>` (cf. best-practices/.frontend/folder-structure.md).
    files: ["**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              // API publique autorisée : le barrel `@/features/<nom>`, le point d'entrée de route
              // `@/features/<nom>/pages`, et le **contrat partagé** `@/features/<nom>/domain/*`.
              // Tout le reste (implémentation interne) est interdit.
              group: [
                "@/features/*/components/*",
                "@/features/*/hooks/*",
                "@/features/*/lib/*",
                "@/features/*/stores/*",
                "@/features/*/application/*",
                "@/features/*/providers/*",
                "@/features/*/schemas/*",
              ],
              message:
                "Importe l'API publique d'une feature : barrel '@/features/<nom>', route '@/features/<nom>/pages', ou contrat partagé '@/features/<nom>/domain/*'.",
            },
          ],
        },
      ],
    },
  },
  {
    // Les barrels réexportent composants et hooks : la règle fast-refresh ne s'applique pas.
    files: ["src/features/*/index.ts", "src/shared/**/index.ts"],
    rules: {
      "react-refresh/only-export-components": "off",
    },
  },
  {
    // Design system shadcn et primitifs animate-ui (code vendored) : les règles de
    // fast-refresh / immutabilité du scaffold ne s'appliquent pas. Les composites
    // applicatifs (shared/features) restent, eux, soumis aux règles de hooks.
    files: ['src/components/ui/**/*.{ts,tsx}', 'src/components/animate-ui/**/*.{ts,tsx}'],
    rules: {
      'react-refresh/only-export-components': 'off',
      'react-hooks/immutability': 'off',
      'react-hooks/set-state-in-effect': 'off',
    },
  },
])
