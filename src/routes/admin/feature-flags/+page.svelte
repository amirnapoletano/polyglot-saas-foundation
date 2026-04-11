<script lang="ts">
	import { enhance } from '$app/forms';
	import Card from '$lib/components/ui/Card.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Input from '$lib/components/ui/Input.svelte';

	let { data, form } = $props();
	let newKey = $state('');
	let newDescription = $state('');
</script>

<div class="space-y-6">
	<h1 class="text-2xl font-bold text-text-primary">Feature Flags</h1>

	<!-- Create flag -->
	<Card>
		<h2 class="text-lg font-semibold text-text-primary mb-4">Create Flag</h2>
		<form method="POST" action="?/create" use:enhance class="flex flex-wrap gap-3 items-end">
			<div class="flex-1 min-w-[200px]">
				<Input label="Key" name="key" bind:value={newKey} placeholder="new_feature" required />
			</div>
			<div class="flex-1 min-w-[200px]">
				<Input label="Description" name="description" bind:value={newDescription} placeholder="Enable the new feature" />
			</div>
			<Button type="submit">Create</Button>
		</form>
		{#if form?.message}
			<p class="mt-2 text-sm text-red-600">{form.message}</p>
		{/if}
	</Card>

	<!-- Flags list -->
	<Card>
		<h2 class="text-lg font-semibold text-text-primary mb-4">Global Flags</h2>
		{#if data.flags.length === 0}
			<p class="text-sm text-text-tertiary py-4 text-center">No feature flags yet.</p>
		{:else}
			<div class="divide-y divide-border">
				{#each data.flags as flag}
					<div class="flex items-center justify-between py-3">
						<div>
							<div class="flex items-center gap-2">
								<code class="text-sm font-mono font-medium text-text-primary">{flag.key}</code>
								<Badge variant={flag.enabled ? 'success' : 'default'}>
									{flag.enabled ? 'ON' : 'OFF'}
								</Badge>
							</div>
							{#if flag.description}
								<p class="mt-0.5 text-xs text-text-tertiary">{flag.description}</p>
							{/if}
						</div>
						<div class="flex items-center gap-2">
							<form method="POST" action="?/toggle" use:enhance>
								<input type="hidden" name="id" value={flag.id} />
								<input type="hidden" name="enabled" value={String(!flag.enabled)} />
								<Button type="submit" variant="secondary" size="sm">
									{flag.enabled ? 'Disable' : 'Enable'}
								</Button>
							</form>
							<form method="POST" action="?/delete" use:enhance>
								<input type="hidden" name="id" value={flag.id} />
								<Button type="submit" variant="danger" size="sm">Delete</Button>
							</form>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</Card>
</div>
