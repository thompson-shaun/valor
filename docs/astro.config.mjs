// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import { PROJECT_PATH, REPO_URL, SITE_HOST } from './src/config/site.js';

// https://astro.build/config
export default defineConfig({
	site: SITE_HOST,
	base: PROJECT_PATH,
	integrations: [
		starlight({
			title: 'Valor',
			social: [{ icon: 'github', label: 'GitHub', href: REPO_URL }],
			sidebar: [
				{ label: 'Home', slug: '' },
				{
					label: 'Play',
					items: [
						{ label: 'Status', slug: 'status' },
						{ label: 'Weekly Tracker', slug: 'rules/tracker' },
						{ label: 'Vault Shop', slug: 'rewards/shop' },
						{ label: 'Quick Reference', slug: 'rules/quick-ref' },
					],
				},
				{
					label: 'Guides',
					items: [
						{ label: "Hero's Guide", slug: 'player/guide' },
						{ label: "Warden's Guide", slug: 'parent/guide' },
					],
				},
			],
			customCss: ['./src/styles/valor.css', './src/styles/print.css'],
		}),
	],
});
