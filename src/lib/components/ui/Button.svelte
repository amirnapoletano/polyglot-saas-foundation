<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLButtonAttributes } from 'svelte/elements';

	interface Props extends HTMLButtonAttributes {
		variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
		size?: 'sm' | 'md' | 'lg';
		loading?: boolean;
		children: Snippet;
	}

	let {
		variant = 'primary',
		size = 'md',
		loading = false,
		children,
		class: className = '',
		...rest
	}: Props = $props();

	const base =
		'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none';

	const variants: Record<string, string> = {
		primary: 'bg-brand-600 text-white hover:bg-brand-700 focus:ring-brand-500',
		secondary:
			'bg-surface border border-border text-text-primary hover:bg-surface-secondary focus:ring-brand-500',
		danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
		ghost:
			'text-text-secondary hover:text-text-primary hover:bg-surface-secondary focus:ring-brand-500'
	};

	const sizes: Record<string, string> = {
		sm: 'text-sm px-3 py-1.5 gap-1.5',
		md: 'text-sm px-4 py-2 gap-2',
		lg: 'text-base px-6 py-2.5 gap-2'
	};
</script>

<button
	class="{base} {variants[variant]} {sizes[size]} {className}"
	disabled={loading || rest.disabled}
	{...rest}
>
	{#if loading}
		<svg
			class="animate-spin h-4 w-4"
			xmlns="http://www.w3.org/2000/svg"
			fill="none"
			viewBox="0 0 24 24"
		>
			<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"
			></circle>
			<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
			></path>
		</svg>
	{/if}
	{@render children()}
</button>
