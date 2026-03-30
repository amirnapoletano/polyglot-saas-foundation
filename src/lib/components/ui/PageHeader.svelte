<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Breadcrumb {
		label: string;
		href?: string;
	}

	interface Props {
		title: string;
		subtitle?: string;
		breadcrumbs?: Breadcrumb[];
		actions?: Snippet;
	}

	let { title, subtitle, breadcrumbs, actions }: Props = $props();
</script>

<div class="mb-8">
	{#if breadcrumbs && breadcrumbs.length > 0}
		<nav class="mb-3 flex items-center gap-1.5 text-sm text-text-tertiary">
			{#each breadcrumbs as crumb, i}
				{#if i > 0}
					<span>/</span>
				{/if}
				{#if crumb.href}
					<a href={crumb.href} class="hover:text-text-primary transition-colors">{crumb.label}</a>
				{:else}
					<span class="text-text-secondary">{crumb.label}</span>
				{/if}
			{/each}
		</nav>
	{/if}

	<div class="flex items-start justify-between gap-4">
		<div>
			<h1 class="text-2xl font-bold text-text-primary">{title}</h1>
			{#if subtitle}
				<p class="mt-1 text-text-secondary">{subtitle}</p>
			{/if}
		</div>
		{#if actions}
			<div class="flex items-center gap-2 shrink-0">
				{@render actions()}
			</div>
		{/if}
	</div>
</div>
