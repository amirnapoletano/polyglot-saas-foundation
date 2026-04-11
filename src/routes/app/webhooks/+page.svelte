<script lang="ts">
	import { enhance } from '$app/forms';
	import Card from '$lib/components/ui/Card.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import PageHeader from '$lib/components/ui/PageHeader.svelte';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';
	import { addToast } from '$lib/stores/toast';

	let { data, form } = $props();
	let url = $state('');
	let showSecret = $state('');

	const canManage = data.currentUserRole === 'owner' || data.currentUserRole === 'admin';

	$effect(() => {
		if (form?.secret) {
			showSecret = form.secret;
			addToast('Webhook created. Copy the signing secret — it won\'t be shown again.', 'success');
		}
	});

	function timeAgo(dateStr: string): string {
		const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
		if (seconds < 60) return 'just now';
		if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
		if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
		return `${Math.floor(seconds / 86400)}d ago`;
	}
</script>

<svelte:head>
	<title>Webhooks — Polyglot</title>
</svelte:head>

<div class="space-y-8">
	<PageHeader
		title="Webhooks"
		subtitle="Send real-time event notifications to external services"
		breadcrumbs={[{ label: 'App', href: '/app/dashboard' }, { label: 'Webhooks' }]}
	/>

	{#if canManage}
		<Card>
			<h2 class="text-lg font-semibold text-text-primary mb-4">Add Webhook</h2>
			<form method="POST" action="?/create" use:enhance class="flex gap-3 items-end flex-wrap">
				<div class="flex-1 min-w-[280px]">
					<Input label="Endpoint URL" name="url" bind:value={url} type="url" placeholder="https://example.com/webhook" required />
				</div>
				<Button type="submit">Create</Button>
			</form>
			{#if form?.message}
				<p class="mt-2 text-sm text-red-600">{form.message}</p>
			{/if}
		</Card>
	{/if}

	{#if showSecret}
		<Card>
			<div class="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/30">
				<p class="text-sm font-medium text-amber-800 dark:text-amber-200 mb-2">Signing Secret</p>
				<code class="block text-xs bg-white dark:bg-surface rounded-lg p-3 break-all text-text-primary border border-border">{showSecret}</code>
				<p class="mt-2 text-xs text-amber-700 dark:text-amber-300">Copy this now — it won't be shown again. Use it to verify webhook signatures.</p>
			</div>
		</Card>
	{/if}

	<Card>
		<h2 class="text-lg font-semibold text-text-primary mb-4">Endpoints</h2>
		{#if data.webhooks.length === 0}
			<EmptyState
				icon="🔗"
				title="No webhooks"
				description="Add a webhook endpoint to receive real-time event notifications."
			/>
		{:else}
			<div class="divide-y divide-border">
				{#each data.webhooks as webhook}
					<div class="flex items-center justify-between py-3">
						<div class="min-w-0 flex-1">
							<p class="text-sm font-mono text-text-primary truncate">{webhook.url}</p>
							<div class="mt-1 flex items-center gap-2 flex-wrap">
								<Badge variant={webhook.active ? 'success' : 'default'}>
									{webhook.active ? 'Active' : 'Disabled'}
								</Badge>
								<span class="text-xs text-text-tertiary">
									{webhook.events.length} event{webhook.events.length !== 1 ? 's' : ''}
								</span>
							</div>
						</div>
						{#if canManage}
							<div class="flex items-center gap-2 shrink-0 ml-4">
								<form method="POST" action="?/toggle" use:enhance>
									<input type="hidden" name="id" value={webhook.id} />
									<input type="hidden" name="active" value={String(!webhook.active)} />
									<Button type="submit" variant="secondary" size="sm">
										{webhook.active ? 'Disable' : 'Enable'}
									</Button>
								</form>
								<form method="POST" action="?/delete" use:enhance>
									<input type="hidden" name="id" value={webhook.id} />
									<Button type="submit" variant="danger" size="sm">Delete</Button>
								</form>
							</div>
						{/if}
					</div>
				{/each}
			</div>
		{/if}
	</Card>

	{#if data.deliveries.length > 0}
		<Card>
			<h2 class="text-lg font-semibold text-text-primary mb-4">Recent Deliveries</h2>
			<div class="overflow-x-auto">
				<table class="w-full text-sm">
					<thead>
						<tr class="border-b border-border text-left">
							<th class="pb-2 font-medium text-text-secondary">Event</th>
							<th class="pb-2 font-medium text-text-secondary">Status</th>
							<th class="pb-2 font-medium text-text-secondary">Time</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-border">
						{#each data.deliveries as delivery}
							<tr>
								<td class="py-2 font-mono text-xs text-text-primary">{delivery.event}</td>
								<td class="py-2">
									{#if delivery.success}
										<Badge variant="success">{delivery.status_code}</Badge>
									{:else}
										<Badge variant="error">{delivery.status_code ?? 'Failed'}</Badge>
									{/if}
								</td>
								<td class="py-2 text-xs text-text-tertiary">{timeAgo(delivery.created_at)}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</Card>
	{/if}
</div>
