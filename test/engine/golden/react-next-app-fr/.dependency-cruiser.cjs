// NEXT-009 : le graphe de dépendances n'a ni cycle ni module orphelin.
module.exports = {
  forbidden: [
    {
      name: 'NEXT-009-no-circular',
      severity: 'error',
      comment: 'NEXT-009 : un cycle casse la découpe du bundle.',
      from: {},
      to: { circular: true },
    },
    {
      name: 'NEXT-009-no-orphans',
      severity: 'error',
      comment: 'NEXT-009 : un module orphelin est du code mort.',
      from: {
        orphan: true,
        pathNot: [
          '[.]d[.]ts$',
          '(^|/)[.][^/]+[.](js|cjs|mjs|ts|json)$',
          '(^|/)(next|vitest)[.]config[.]ts$',
          '(^|/)vitest[.]setup([.]server)?[.]ts$',
          '(^|/)src/shared/test/server-only[.]ts$',
          // Le framework charge lui-même les fichiers de route : ils n'ont pas d'importateur.
          '(^|/)src/app/.+[.]tsx$',
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
