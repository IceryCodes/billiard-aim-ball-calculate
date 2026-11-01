// eslint.config.mjs
// ESLint 9 flat config(取代 .eslintrc.json + .eslintignore)。
// eslint-config-next 15 只提供舊格式,用 FlatCompat 轉進來(它自帶 react-hooks / jsx-a11y / @next/next plugin,
// 所以 react / import / react-hooks 也一起走 FlatCompat,同一個 plugin 只載入一次,否則會 Cannot redefine plugin)。
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { FlatCompat } from '@eslint/eslintrc';
import js from '@eslint/js';
import prettierRecommended from 'eslint-plugin-prettier/recommended';
import tseslint from 'typescript-eslint';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const compat = new FlatCompat({ baseDirectory: currentDir });

const config = [
  {
    ignores: ['node_modules/**', '.next/**', 'out/**', 'build/**', 'next-env.d.ts', 'src/global-components/effects/**'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...compat.extends('plugin:react/recommended', 'plugin:import/recommended', 'next/core-web-vitals'),
  prettierRecommended,
  {
    settings: {
      react: { version: 'detect' },
      'import/resolver': {
        typescript: { alwaysTryTypes: true, project: './tsconfig.json' },
        node: { extensions: ['.js', '.jsx', '.ts', '.tsx'] },
      },
    },
    rules: {
      'import/order': [
        'error',
        {
          groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index', 'unknown'],
          pathGroups: [
            { pattern: 'react', group: 'external', position: 'before' },
            { pattern: 'react-native', group: 'external', position: 'before' },
            { pattern: '@@/**', group: 'internal', position: 'before' },
            { pattern: '@/**', group: 'internal' },
            { pattern: '*.scss', group: 'index', patternOptions: { matchBase: true } },
          ],
          pathGroupsExcludedImportTypes: ['react', 'express'],
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],
      'import/namespace': 'off',
      'object-curly-spacing': ['error', 'always'],
      'class-methods-use-this': 'off',
      'import/prefer-default-export': 'off',
      'import/extensions': 'off',
      'import/named': 'off',
      'import/no-duplicates': 'off',
      'import/no-named-as-default-member': 'off',
      'import/no-unresolved': 'off',
      'import/default': 'off',
      'import/no-named-as-default': 'off',
      'no-else-return': 'off',
      'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],
      'no-continue': 'off',
      'no-multiple-empty-lines': ['error', { max: 1, maxEOF: 0 }],
      'no-plusplus': 'off',
      'no-trailing-spaces': ['error', { skipBlankLines: false, ignoreComments: true }],
      'no-useless-return': 'warn',
      'no-underscore-dangle': ['error', { allow: ['_id'] }],
      'no-unused-vars': 'off',
      'no-use-before-define': ['error', { variables: false, functions: false }],
      'object-shorthand': ['error', 'always', { ignoreConstructors: false, avoidQuotes: true }],
      quotes: 'off',
      'prettier/prettier': [
        'error',
        {
          singleQuote: true,
          jsxSingleQuote: false,
          bracketSpacing: true,
          bracketSameLine: false,
          arrowParens: 'always',
          trailingComma: 'es5',
          printWidth: 125,
          proseWrap: 'never',
          endOfLine: 'auto',
        },
      ],
      semi: ['error', 'always'],
      '@next/next/no-duplicate-head': 'off',
      '@typescript-eslint/no-use-before-define': 'off',
      'react/destructuring-assignment': 'off',
      'react/function-component-definition': [
        'error',
        { namedComponents: 'arrow-function', unnamedComponents: 'arrow-function' },
      ],
      'react/jsx-props-no-spreading': 'off',
      'react/no-unescaped-entities': 'off',
      'react/no-unused-prop-types': 'off',
      'react/no-unused-state': 'warn',
      'react/require-default-props': 'off',
      'react/prop-types': 'off',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'error',
      'react/react-in-jsx-scope': 'off',
    },
  },
];

export default config;
