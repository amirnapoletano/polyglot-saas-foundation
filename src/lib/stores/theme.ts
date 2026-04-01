import { writable } from 'svelte/store';
import { browser } from '$app/environment';

export type Theme = 'light' | 'dark' | 'system';

function getInitialTheme(): Theme {
	if (!browser) return 'system';
	return (localStorage.getItem('theme') as Theme) || 'system';
}

function applyTheme(theme: Theme) {
	if (!browser) return;
	const isDark =
		theme === 'dark' ||
		(theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
	document.documentElement.classList.toggle('dark', isDark);
}

const store = writable<Theme>(getInitialTheme());

store.subscribe((theme) => {
	if (!browser) return;
	localStorage.setItem('theme', theme);
	applyTheme(theme);
});

export const theme = store;

export function cycleTheme() {
	store.update((current) => {
		if (current === 'light') return 'dark';
		if (current === 'dark') return 'system';
		return 'light';
	});
}
