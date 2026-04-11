<script lang="ts">
	import Card from '$lib/components/ui/Card.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import Input from '$lib/components/ui/Input.svelte';

	let { data } = $props();
	let search = $state(data.search ?? '');

	function formatDate(d: string | null) {
		if (!d) return '—';
		return new Date(d).toLocaleDateString();
	}

	const statusVariant: Record<string, 'success' | 'warning' | 'error' | 'default' | 'brand'> = {
		active: 'success',
		trialing: 'brand',
		canceled: 'error',
		past_due: 'warning'
	};
</script>

<div class="space-y-6">
	<h1 class="text-2xl font-bold text-text-primary">Organizations ({data.totalOrgs})</h1>

	<Card>
		<form method="GET" class="mb-4">
			<div class="w-72">
				<Input name="q" placeholder="Search by name…" bind:value={search} />
			</div>
		</form>

		<div class="overflow-x-auto">
			<table class="w-full text-sm">
				<thead>
					<tr class="border-b border-border text-left">
						<th class="pb-3 font-medium text-text-secondary">Name</th>
						<th class="pb-3 font-medium text-text-secondary">Members</th>
						<th class="pb-3 font-medium text-text-secondary">Billing</th>
						<th class="pb-3 font-medium text-text-secondary">Created</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-border">
					{#each data.orgs as org}
						<tr class="hover:bg-surface-secondary">
							<td class="py-3 font-medium text-text-primary">{org.name}</td>
							<td class="py-3 text-text-secondary">{org.memberCount}</td>
							<td class="py-3">
								<Badge variant={statusVariant[org.billingStatus] ?? 'default'}>
									{org.billingStatus}
								</Badge>
							</td>
							<td class="py-3 text-text-tertiary">{formatDate(org.created_at)}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>

		{#if data.totalPages > 1}
			<div class="mt-4 flex items-center justify-between">
				<p class="text-sm text-text-tertiary">Page {data.page} of {data.totalPages}</p>
				<div class="flex gap-2">
					{#if data.page > 1}
						<a
							href="?page={data.page - 1}{search ? `&q=${search}` : ''}"
							class="rounded-lg border border-border bg-surface px-3 py-1.5 text-sm font-medium text-text-primary hover:bg-surface-secondary"
							>Previous</a
						>
					{/if}
					{#if data.page < data.totalPages}
						<a
							href="?page={data.page + 1}{search ? `&q=${search}` : ''}"
							class="rounded-lg border border-border bg-surface px-3 py-1.5 text-sm font-medium text-text-primary hover:bg-surface-secondary"
							>Next</a
						>
					{/if}
				</div>
			</div>
		{/if}
	</Card>
</div>
