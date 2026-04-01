<script lang="ts">
	import Card from '$lib/components/ui/Card.svelte';
	import Avatar from '$lib/components/ui/Avatar.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import PageHeader from '$lib/components/ui/PageHeader.svelte';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';

	let { data } = $props();

	const actionLabels: Record<string, string> = {
		'member.invited': 'invited a member',
		'member.removed': 'removed a member',
		'member.role_changed': 'changed a member role',
		'invite.cancelled': 'cancelled an invite',
		'invite.accepted': 'accepted an invite',
		'org.renamed': 'renamed the workspace',
		'org.deleted': 'deleted a workspace',
		'org.created': 'created a workspace',
		'billing.subscribed': 'subscribed to a plan',
		'billing.cancelled': 'cancelled subscription',
		'billing.updated': 'updated billing'
	};

	const actionVariants: Record<string, 'default' | 'success' | 'warning' | 'error' | 'brand'> = {
		'member.invited': 'brand',
		'member.removed': 'error',
		'member.role_changed': 'warning',
		'invite.cancelled': 'warning',
		'invite.accepted': 'success',
		'org.renamed': 'default',
		'org.deleted': 'error',
		'org.created': 'success',
		'billing.subscribed': 'success',
		'billing.cancelled': 'error',
		'billing.updated': 'default'
	};

	function timeAgo(dateStr: string | null): string {
		if (!dateStr) return '';
		const now = new Date();
		const date = new Date(dateStr);
		const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

		if (seconds < 60) return 'just now';
		if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
		if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
		if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
		return date.toLocaleDateString();
	}

	function getActorName(actorId: string | null): string {
		if (!actorId) return 'Unknown user';
		const profile = data.actorProfiles[actorId];
		return profile?.display_name ?? profile?.email ?? 'Unknown user';
	}

	function getDetail(entry: any): string | null {
		const meta = entry.metadata;
		if (!meta) return null;
		if (meta.email) return meta.email;
		if (meta.new_name) return `to "${meta.new_name}"`;
		if (meta.new_role) return `to ${meta.new_role}`;
		if (meta.plan) return meta.plan;
		return null;
	}
</script>

<svelte:head>
	<title>Activity — Polyglot</title>
</svelte:head>

<PageHeader
	title="Activity"
	subtitle="Recent actions in this workspace"
	breadcrumbs={[{ label: 'App', href: '/app/dashboard' }, { label: 'Activity' }]}
/>

{#if data.logs.length === 0}
	<Card>
		<EmptyState
			icon="📋"
			title="No activity yet"
			description="Actions like inviting members, changing roles, and billing events will appear here."
		/>
	</Card>
{:else}
	<Card>
		<div class="divide-y divide-border">
			{#each data.logs as entry}
				<div class="flex items-start gap-4 py-4 first:pt-0 last:pb-0">
					<Avatar name={getActorName(entry.actor_user_id)} size="sm" class="mt-0.5" />
					<div class="flex-1 min-w-0">
						<p class="text-sm text-text-primary">
							<span class="font-medium">{getActorName(entry.actor_user_id)}</span>
							{' '}{actionLabels[entry.action] ?? entry.action}
							{#if getDetail(entry)}
								<span class="text-text-secondary"> — {getDetail(entry)}</span>
							{/if}
						</p>
						<p class="mt-0.5 text-xs text-text-tertiary">{timeAgo(entry.created_at)}</p>
					</div>
					<Badge variant={actionVariants[entry.action] ?? 'default'}>
						{entry.action.split('.')[0]}
					</Badge>
				</div>
			{/each}
		</div>
	</Card>

	{#if data.totalPages > 1}
		<div class="mt-4 flex items-center justify-between">
			<p class="text-sm text-text-tertiary">Page {data.page} of {data.totalPages}</p>
			<div class="flex gap-2">
				{#if data.page > 1}
					<a
						href="?page={data.page - 1}"
						class="rounded-lg border border-border bg-surface px-3 py-1.5 text-sm font-medium text-text-primary hover:bg-surface-secondary transition-colors"
					>
						Previous
					</a>
				{/if}
				{#if data.page < data.totalPages}
					<a
						href="?page={data.page + 1}"
						class="rounded-lg border border-border bg-surface px-3 py-1.5 text-sm font-medium text-text-primary hover:bg-surface-secondary transition-colors"
					>
						Next
					</a>
				{/if}
			</div>
		</div>
	{/if}
{/if}
