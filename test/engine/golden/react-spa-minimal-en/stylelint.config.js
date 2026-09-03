// Stylelint enforces the style rules that are checkable in CSS: no hand-written value
// outside the token file (CORE-020), no !important (CORE-026).
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
