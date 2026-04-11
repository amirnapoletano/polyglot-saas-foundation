<script lang="ts">
	let {
		width = '100%',
		height = '1rem',
		rounded = 'rounded',
		variant = 'block',
		lines = 3,
		class: className = ''
	}: {
		width?: string;
		height?: string;
		rounded?: string;
		variant?: 'block' | 'row' | 'list';
		lines?: number;
		class?: string;
	} = $props();
</script>

{#if variant === 'list'}
	<div class="space-y-3 {className}" aria-hidden="true">
		{#each Array(lines)}
			<div class="flex items-center gap-3">
				<div class="h-8 w-8 animate-pulse rounded-full bg-surface-tertiary"></div>
				<div class="flex-1 space-y-1.5">
					<div class="h-3.5 w-2/3 animate-pulse rounded bg-surface-tertiary"></div>
					<div class="h-3 w-1/3 animate-pulse rounded bg-surface-tertiary"></div>
				</div>
			</div>
		{/each}
	</div>
{:else if variant === 'row'}
	<div class="flex items-center gap-3 {className}" aria-hidden="true">
		<div class="h-8 w-8 animate-pulse rounded-full bg-surface-tertiary"></div>
		<div class="flex-1 space-y-1.5">
			<div class="h-3.5 w-2/3 animate-pulse rounded bg-surface-tertiary"></div>
			<div class="h-3 w-1/3 animate-pulse rounded bg-surface-tertiary"></div>
		</div>
	</div>
{:else}
	<div
		class="animate-pulse bg-surface-tertiary {rounded} {className}"
		style="width: {width}; height: {height}"
		aria-hidden="true"
	></div>
{/if}
