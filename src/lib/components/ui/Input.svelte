<script lang="ts">
	import type { HTMLInputAttributes } from 'svelte/elements';

	interface Props extends HTMLInputAttributes {
		label?: string;
		error?: string;
		value?: string;
	}

	let { label, error, value = $bindable(''), class: className = '', ...rest }: Props = $props();
</script>

<div class="flex flex-col gap-1.5">
	{#if label}
		<label for={rest.id} class="text-sm font-medium text-text-primary">{label}</label>
	{/if}
	<input
		class="w-full rounded-lg border px-3 py-2 text-sm bg-surface text-text-primary placeholder:text-text-tertiary
			focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500
			{error ? 'border-red-400 focus:ring-red-500 focus:border-red-500' : 'border-border'}
			{className}"
		bind:value
		{...rest}
	/>
	{#if error}
		<p class="text-xs text-red-500">{error}</p>
	{/if}
</div>
