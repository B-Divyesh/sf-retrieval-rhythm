import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist/', 'node_modules/', 'playwright-report/', 'test-results/'] },
  {
    files: ['public/sw.js'],
    languageOptions: {
      globals: {
        URL: 'readonly',
        Request: 'readonly',
        caches: 'readonly',
        fetch: 'readonly',
        self: 'readonly'
      }
    }
  },
  js.configs.recommended,
  ...tseslint.configs.recommended
);
