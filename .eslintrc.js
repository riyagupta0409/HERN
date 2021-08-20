module.exports = {
   env: {
      browser: true,
      es2021: true
   },
   extends: ['airbnb-base', 'prettier'],
   parserOptions: {
      ecmaVersion: 12,
      sourceType: 'module'
   },
   rules: {
      'no-underscore-dangle': 0,
      'import/imports-first': ['error', 'absolute-first'],
      'import/newline-after-import': 'error',
      'import/prefer-default-export': 0,
      'no-case-declarations': 0,
      radix: 0,
      camelcase: 0,
      'no-alert': 1,
      'no-shadow': 1,
      'consistent-return': 1
   }
}
