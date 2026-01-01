// ESLint fait respecter les frontières entre couches et les règles vérifiables du balisage.
// Chaque règle de frontière porte l'identifiant de la règle du profil : le message d'erreur
// renvoie au skill `architecture` (SPA-001 à SPA-012).
import js from '@eslint/js';
import boundaries from 'eslint-plugin-boundaries';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist', 'coverage', 'playwright-report', 'test-results', 'public'] },
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      globals: { ...globals.browser },
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
  },
  {
    files: ['**/*.{ts,tsx}'],
    plugins: { boundaries, 'react-hooks': reactHooks },
    settings: {
      'boundaries/elements': [
        { type: 'app', pattern: 'src/app', capture: ['name'] },
        { type: 'features', pattern: 'src/features/*', capture: ['name'] },
        { type: 'entities', pattern: 'src/entities/*', capture: ['name'] },
        { type: 'shared', pattern: 'src/shared', capture: ['name'] },
      ],
      'boundaries/include': ['src/**/*'],
      // Sans ce résolveur, les imports ne sont pas rattachés à une couche et rien n'est vérifié.
      'import/resolver': { typescript: { project: './tsconfig.json' } },
    },
    rules: {
      ...reactHooks.configs.recommended.rules,

      // SPA-002, SPA-004, SPA-006 : le sens des imports entre couches.
      'boundaries/element-types': [
        'error',
        {
          default: 'disallow',
          message:
            'SPA-002 / SPA-004 / SPA-006 : ${file.type} ne peut pas importer ${dependency.type} (voir le skill architecture).',
          rules: [
            { from: ['app'], allow: ['app', 'features', 'entities', 'shared'] },
            { from: ['features'], allow: [['features', { name: '${from.name}' }], 'entities', 'shared'] },
            { from: ['entities'], allow: [['entities', { name: '${from.name}' }], 'shared'] },
            { from: ['shared'], allow: ['shared'] },
          ],
        },
      ],

      // SPA-001, SPA-003, SPA-012 : on n'importe que l'index public d'une feature ou d'une entité.
      'boundaries/entry-point': [
        'error',
        {
          default: 'disallow',
          message:
            "SPA-003 : seul l'index public d'une couche est importable ; ${dependency.source} est un fichier interne.",
          rules: [
            { target: ['features', 'entities'], allow: 'index.ts' },
            { target: ['shared', 'app'], allow: '**' },
          ],
        },
      ],

      // SPA-AP-001 : pas de dépôt fourre-tout ; SPA-AP-002 : pas d'import profond dans une feature.
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/utils', '**/utils/*', '@shared/utils*'],
              message:
                "SPA-AP-001 : nommer le module par ce qu'il fait, dans `shared/lib` ou dans la feature.",
            },
            {
              group: ['**/features/*/*', '**/entities/*/*'],
              message:
                "SPA-AP-002 : passer par l'index public de la feature ou de l'entité (SPA-003).",
            },
          ],
        },
      ],

      // CORE-014 : pas de `any`, y compris implicite.
      '@typescript-eslint/no-explicit-any': 'error',

      // CORE-015 : une liste rend une clé métier stable.
      'react-hooks/exhaustive-deps': 'warn',

      // CORE-021 : pas de valeur arbitraire Tailwind dans une classe.
      'no-restricted-syntax': [
        'error',
        {
          selector: "JSXAttribute[name.name='className'] Literal[value=/\\[[^\\]]+\\]/]",
          message:
            'CORE-021 : valeur arbitraire Tailwind interdite ; utiliser un token du contrat visuel.',
        },
        {
          selector: "JSXAttribute[name.name='className'] Literal[value=/#[0-9a-fA-F]{3,8}/]",
          message: 'CORE-020 : couleur écrite à la main ; utiliser un token sémantique.',
        },
      ],
    },
  },
  {
    files: ['**/*.tsx'],
    plugins: { 'jsx-a11y': jsxA11y },
    rules: {
      // CORE-030 à CORE-035 : accessibilité vérifiable au balisage.
      ...jsxA11y.flatConfigs.recommended.rules,
      'jsx-a11y/no-noninteractive-element-interactions': 'error',
      'jsx-a11y/tabindex-no-positive': 'error',
    },
  },
  {
    // CORE-040 : seul `shared/api` et les modules `api/` d'une feature appellent le réseau.
    files: ['**/*.{ts,tsx}'],
    ignores: ['src/shared/api/**', 'src/features/*/api/**', 'src/shared/test/**'],
    rules: {
      'no-restricted-globals': [
        'error',
        { name: 'fetch', message: "CORE-040 : passer par le module `api/` de la feature." },
      ],
    },
  },
  {
    files: ['**/*.test.{ts,tsx}', 'vitest.setup.ts'],
    languageOptions: { globals: { ...globals.node } },
    rules: {
      // CORE-061 : un test sélectionne par rôle, jamais par classe ou par nœud.
      'no-restricted-properties': [
        'error',
        {
          object: 'screen',
          property: 'container',
          message: 'CORE-061 : sélectionner par rôle et nom accessible.',
        },
      ],
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
    },
  },
  {
    files: ['*.config.js', '*.cjs'],
    ...tseslint.configs.disableTypeChecked,
    languageOptions: {
      globals: { ...globals.node },
      parserOptions: { projectService: false },
    },
  },
);
