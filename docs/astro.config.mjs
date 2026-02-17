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
					label: 'Guides',
					items: [
						{ label: 'Parent Guide', slug: 'parent/guide' },
						{ label: "Player's Guide", slug: 'player/guide' },
					],
				},
				{
					label: 'Rewards',
					items: [
						{ label: 'Reward Shop', slug: 'rewards/shop' },
					],
				},
				{
					label: 'Rules',
					items: [
						{ label: 'Quick Reference', slug: 'rules/quick-ref' },
						{ label: 'Weekly Tracker', slug: 'rules/tracker' },
					],
				},
			],
			customCss: ['./src/styles/custom.css', './src/styles/print.css'],
		}),
	],
});
