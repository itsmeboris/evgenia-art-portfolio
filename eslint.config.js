import js from '@eslint/js';
import prettier from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';

export default [
  {
    ignores: [
      'node_modules/**',
      'public/dist/**',
      'public/assets/**',
      'sessions/**',
      '**/*.min.js',
    ],
  },
  js.configs.recommended,
  {
    files: ['**/*.js'],
    plugins: {
      prettier,
    },
    rules: {
      ...prettierConfig.rules,
      'prettier/prettier': 'error',
      'no-unused-vars': 'warn',
      'no-console': 'off',
      'no-undef': 'warn',
    },
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: 'module',
      globals: {
        window: 'readonly',
        document: 'readonly',
        console: 'readonly',
        process: 'readonly',
        __dirname: 'readonly',
        require: 'readonly',
        module: 'readonly',
        exports: 'readonly',
        global: 'readonly',
        Buffer: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        Blob: 'readonly',
        URL: 'readonly',
        fetch: 'readonly',
        FormData: 'readonly',
        localStorage: 'readonly',
        sessionStorage: 'readonly',
        CustomEvent: 'readonly',
        URLSearchParams: 'readonly',
        performance: 'readonly',
        FileReader: 'readonly',
        confirm: 'readonly',
        alert: 'readonly',
        IntersectionObserver: 'readonly',
        MutationObserver: 'readonly',
        Image: 'readonly',
        requestAnimationFrame: 'readonly',
        btoa: 'readonly',
        navigator: 'readonly',
        history: 'readonly',
        AbortSignal: 'readonly',
        gtag: 'readonly',
      },
    },
  },
  {
    files: ['server.js', 'webp-converter.js', 'webpack.config.js'],
    languageOptions: {
      sourceType: 'script',
    },
  },
];
