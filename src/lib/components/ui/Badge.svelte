<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		variant?: 'default' | 'success' | 'warning' | 'error' | 'brand';
		children: Snippet;
	}

	let { variant = 'default', children }: Props = $props();

	const variants: Record<string, string> = {
		default: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
		success: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300',
		warning: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
		error: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
		brand: 'bg-brand-100 text-brand-700 dark:bg-brand-900 dark:text-brand-300'
	};
</script>

<span
	class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium {variants[
		variant
	]}"
>
	{@render children()}
</span>
