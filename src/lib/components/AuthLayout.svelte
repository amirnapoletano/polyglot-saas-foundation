<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		title: string;
		subtitle?: string;
		children: Snippet;
	}

	let { title, subtitle, children }: Props = $props();
</script>

<div class="flex min-h-screen items-center justify-center bg-surface-secondary px-4 py-12">
	<div class="w-full max-w-md">
		<div class="mb-8 text-center">
			<a
				href="/"
				class="text-2xl font-bold text-text-primary hover:text-brand-600 transition-colors"
				>Polyglot</a
			>
		</div>
		<div class="rounded-xl border border-border bg-surface p-8 shadow-sm">
			<h1 class="text-2xl font-bold text-text-primary">{title}</h1>
			{#if subtitle}
				<p class="mt-1.5 text-sm text-text-secondary">{subtitle}</p>
			{/if}
			<div class="mt-6">
				{@render children()}
			</div>
		</div>
	</div>
</div>
