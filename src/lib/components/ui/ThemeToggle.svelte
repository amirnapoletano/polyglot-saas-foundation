<script lang="ts">
	import { theme, cycleTheme } from '$lib/stores/theme';
</script>

<button
	onclick={cycleTheme}
	class="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-text-secondary hover:bg-surface-secondary hover:text-text-primary transition-colors w-full"
	title="Toggle theme ({$theme})"
>
	<svg
		class="h-4 w-4 shrink-0"
		fill="none"
		stroke="currentColor"
		viewBox="0 0 24 24"
		stroke-width="1.75"
	>
		{#if $theme === 'light'}
			<circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line
				x1="12"
				y1="21"
				x2="12"
				y2="23"
			/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line
				x1="18.36"
				y1="18.36"
				x2="19.78"
				y2="19.78"
			/><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line
				x1="4.22"
				y1="19.78"
				x2="5.64"
				y2="18.36"
			/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
		{:else if $theme === 'dark'}
			<path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
		{:else}
			<circle cx="12" cy="12" r="4" /><path d="M12 2v2" /><path d="M12 20v2" /><path
				d="m4.93 4.93 1.41 1.41"
			/><path d="m17.66 17.66 1.41 1.41" /><path d="M2 12h2" /><path d="M20 12h2" /><path
				d="m6.34 17.66-1.41 1.41"
			/><path d="m19.07 4.93-1.41 1.41" />
		{/if}
	</svg>
	<span class="capitalize">{$theme}</span>
</button>
