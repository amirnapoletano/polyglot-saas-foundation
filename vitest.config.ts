import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import path from 'path';

export default defineConfig({
	plugins: [svelte({ hot: false })],
	resolve: {
		alias: {
			$lib: path.resolve('./src/lib'),
			'$env/dynamic/private': path.resolve('./src/lib/test-helpers/env-mock.ts'),
			'$env/static/public': path.resolve('./src/lib/test-helpers/env-mock.ts')
		}
	},
	test: {
		include: ['src/**/*.test.ts'],
		environment: 'node'
	}
});
