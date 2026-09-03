// Stylelint fait respecter les règles de style qui se vérifient dans le CSS : pas de valeur
// écrite à la main hors du fichier de tokens (CORE-020), pas de !important (CORE-026).
export default {
  rules: {
    'declaration-no-important': true,
    'color-no-hex': true,
    'at-rule-no-unknown': [
      true,
      { ignoreAtRules: ['theme', 'apply', 'layer', 'variant', 'custom-variant', 'source'] },
    ],
  },
  overrides: [
    {
      // CORE-027 : les fichiers de tokens sont les seuls endroits où une valeur concrète est écrite.
      files: ['src/shared/styles/tokens.css', 'src/shared/styles/tokens.override.css'],
      rules: { 'color-no-hex': null },
    },
  ],
};
