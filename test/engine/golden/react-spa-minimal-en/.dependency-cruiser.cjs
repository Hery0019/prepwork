// SPA-008: the dependency graph has no cycle and no orphan module.
module.exports = {
  forbidden: [
    {
      name: 'SPA-008-no-circular',
      severity: 'error',
      comment: 'SPA-008 : un cycle casse le chargement différé et le tree-shaking.',
      from: {},
      to: { circular: true },
    },
    {
      name: 'SPA-008-no-orphans',
      severity: 'error',
      comment: 'SPA-008 : un module orphelin est du code mort.',
      from: {
        orphan: true,
        pathNot: [
          '[.]d[.]ts$',
          '(^|/)[.][^/]+[.](js|cjs|mjs|ts|json)$',
          '(^|/)vite[.]config[.]ts$',
          '(^|/)vitest[.]setup[.]ts$',
          '(^|/)src/main[.]tsx$',
        ],
      },
      to: {},
    },
  ],
  options: {
    doNotFollow: { path: 'node_modules' },
    tsConfig: { fileName: 'tsconfig.json' },
    tsPreCompilationDeps: true,
    exclude: { path: '[.]test[.]tsx?$' },
    reporterOptions: { text: { highlightFocused: true } },
  },
};
