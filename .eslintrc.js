module.exports = {
  extends: [
    'alloy',
    'alloy/typescript',
  ],
  rules: {
      // 禁止使用 var
      'no-var': "error",
      "@typescript-eslint/no-require-imports": 0,
      "@typescript-eslint/explicit-member-accessibility": 0,
      "@typescript-eslint/no-inferrable-types": 0,
      "no-implicit-coercion": 0,
      "@typescript-eslint/method-signature-style": 0,
      "no-new": 0,
      "@typescript-eslint/prefer-for-of": 0,
  },
  "globals": {
    "process": true,
  },
}
