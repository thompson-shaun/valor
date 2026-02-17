// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// https://astro.build/config
export default defineConfig({
	site: 'https://thompson-shaun.github.io',
	base: '/quest-mode',
	integrations: [
		starlight({
			title: 'Quest Mode',
			social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/thompson-shaun/quest-mode' }],
			sidebar: [
				{ label: 'Home', slug: '' },
				{
					label: 'Play',
					items: [
						{ label: 'Status', slug: 'status' },
						{ label: 'Weekly Tracker', slug: 'rules/tracker' },
						{ label: 'Reward Shop', slug: 'rewards/shop' },
						{ label: 'Quick Reference', slug: 'rules/quick-ref' },
					],
				},
				{
					label: 'Guides',
					items: [
						{ label: "Player's Guide", slug: 'player/guide' },
						{ label: 'Parent Guide', slug: 'parent/guide' },
					],
				},
			],
			customCss: ['./src/styles/custom.css', './src/styles/print.css'],
		}),
	],
});
