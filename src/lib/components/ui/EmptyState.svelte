<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		icon?: string;
		title: string;
		description?: string;
		actions?: Snippet;
	}

	let { icon, title, description, actions }: Props = $props();
</script>

<div class="flex flex-col items-center justify-center py-12 px-4 text-center">
	{#if icon}
		<div
			class="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-surface-tertiary text-2xl"
		>
			{icon}
		</div>
	{/if}
	<h3 class="text-base font-semibold text-text-primary">{title}</h3>
	{#if description}
		<p class="mt-1.5 max-w-sm text-sm text-text-secondary">{description}</p>
	{/if}
	{#if actions}
		<div class="mt-4">
			{@render actions()}
		</div>
	{/if}
</div>
