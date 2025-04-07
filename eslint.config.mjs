import eslint from '@eslint/js'
import tseslint from '@typescript-eslint/eslint-plugin'
import tseslintParser from '@typescript-eslint/parser'
import prettier from 'eslint-plugin-prettier'
import globals from 'globals'

export default [
	{
		ignores: [
			'dist/**',
			'node_modules/**',
			'**/*.test.ts',
			'**/*.test.tsx',
			'**/*.spec.ts',
			'**/*.mjs',
			'**/*.cjs',
			'vite.config.ts',
			'examples/**',
		],
	},
	eslint.configs.recommended,
	{
		files: ['**/*.ts', '**/*.tsx', '**/*.mts', '**/*.cts'],
		languageOptions: {
			parser: tseslintParser,
			parserOptions: {
				ecmaVersion: 'latest',
				sourceType: 'module',
				project: './tsconfig.json',
			},
			globals: {
				...globals.node,
				...globals.browser,
				Buffer: 'readonly',
				console: 'readonly',
			},
		},
		plugins: {
			'@typescript-eslint': tseslint,
			prettier: prettier,
		},
		rules: {
			...tseslint.configs.recommended.rules,
			...prettier.configs.recommended.rules,
			'prettier/prettier': 'error',
			'@typescript-eslint/explicit-function-return-type': 'off',
			'@typescript-eslint/no-explicit-any': 'warn',
			'@typescript-eslint/consistent-type-imports': [
				'error',
				{
					prefer: 'type-imports',
					fixStyle: 'inline-type-imports',
				},
			],
			'@typescript-eslint/no-unused-vars': [
				'warn',
				{
					argsIgnorePattern: '^_',
					varsIgnorePattern: '^_',
				},
			],
			'no-console': ['warn', { allow: ['warn', 'error'] }],
			'@typescript-eslint/no-non-null-assertion': 'warn',
			'no-dupe-class-members': 'off',
		},
		settings: {
			'import/resolver': {
				typescript: true,
				node: true,
			},
		},
	},
	{
		files: ['**/*.test.ts', '**/*.spec.ts'],
		rules: {
			'@typescript-eslint/no-explicit-any': 'off',
			'no-console': 'off',
		},
	},
]
