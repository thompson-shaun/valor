// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// https://astro.build/config
export default defineConfig({
	site: 'https://thompson-shaun.github.io',
	base: '/quest-mode',
	integrations: [
		starlight({
			title: 'Valor',
			social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/thompson-shaun/quest-mode' }],
			sidebar: [
				{ label: 'Home', slug: '' },
				{
					label: 'Play',
					items: [
						{ label: 'Status', slug: 'status' },
						{ label: 'Weekly Tracker', slug: 'rules/tracker' },
						{ label: 'Reward List', slug: 'rewards/shop' },
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
			customCss: ['./src/styles/custom.css', './src/styles/print.css'],
		}),
	],
});
