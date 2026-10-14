import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import { defineConfig } from 'eslint/config';

export default defineConfig([
  // Carpetas generadas, dependencias y entregas anteriores.
  { ignores: ['node_modules/**', 'frontend/dist/**', 'coverage/**', 'tareas/**', 'certificados/**'] },
  {
    files: ['**/*.{js,cjs,mjs,jsx}'],
    plugins: { js },
    extends: ['js/recommended'],
    rules: {
      // Reglas vistas en clase y en la guía del Tema 14.
      'no-var': 'error',
      eqeqeq: 'error',
      'prefer-const': 'warn',
      // Los parámetros que Express exige pero no se usan empiezan con _ (por ejemplo, _next).
      // ignoreRestSiblings: `const { id, ...resto }` es la forma de quitar un campo de un objeto.
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', ignoreRestSiblings: true }],
    },
  },
  {
    files: ['backend/**/*.js', '**/*.cjs'],
    languageOptions: { sourceType: 'commonjs', globals: globals.node },
  },
  {
    files: ['*.mjs'],
    languageOptions: { globals: globals.node },
  },
  {
    files: ['backend/tests/**/*.js', '**/*.test.js'],
    languageOptions: { globals: { ...globals.node, ...globals.jest } },
  },
  {
    files: ['frontend/src/**/*.{js,jsx}'],
    languageOptions: { globals: globals.browser, parserOptions: { ecmaFeatures: { jsx: true } } },
    plugins: { 'react-hooks': reactHooks },
    // Se empieza con las dos reglas clásicas de hooks; las del compilador de React se evaluarán después.
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
    },
  },
]);
