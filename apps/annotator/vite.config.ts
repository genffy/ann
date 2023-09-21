import { defineConfig } from 'vite';
import { resolve } from 'path'
import preact from '@preact/preset-vite';
import dts from 'vite-plugin-dts'
import { libInjectCss } from 'vite-plugin-lib-inject-css'

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [
		preact(),
		libInjectCss(),
		dts({ include: ['lib'] })
	],
	build: {
		copyPublicDir: false,
		lib: {
			entry: resolve(__dirname, 'lib/main.ts'),
			formats: ['es']
		},
	}
});
