<script lang="ts">
	import Card from '$lib/components/ui/Card.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import Avatar from '$lib/components/ui/Avatar.svelte';
	import PageHeader from '$lib/components/ui/PageHeader.svelte';

	let { data } = $props();

	const orgName = $derived(
		data.organizations?.find((o) => o.organization_id === data.activeOrgId)?.organization?.name ??
			'Your workspace'
	);

	const actionLabels: Record<string, string> = {
		'member.invited': 'invited a member',
		'member.removed': 'removed a member',
		'member.role_changed': 'changed a role',
		'invite.cancelled': 'cancelled an invite',
		'invite.accepted': 'accepted an invite',
		'org.renamed': 'renamed workspace',
		'org.deleted': 'deleted workspace',
		'org.created': 'created workspace',
		'billing.subscribed': 'subscribed',
		'billing.cancelled': 'cancelled plan',
		'billing.updated': 'updated billing',
		'api_key.created': 'created API key',
		'api_key.revoked': 'revoked API key'
	};

	function getActorName(actorId: string | null): string {
		if (!actorId) return 'System';
		const profile = data.actorProfiles?.[actorId];
		return profile?.display_name ?? profile?.email ?? 'Unknown';
	}

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

	function daysSinceCreated(): number {
		if (!data.org?.created_at) return 0;
		const created = new Date(data.org.created_at);
		return Math.floor((Date.now() - created.getTime()) / 86400000);
	}

	const billingLabel = $derived(
		data.billing?.status === 'active'
			? data.billing.cancel_at_period_end
				? 'Cancelling'
				: 'Active'
			: data.billing?.status === 'trialing'
				? 'Trial'
				: 'No subscription'
	);

	const nextBilling = $derived(
		data.billing?.current_period_end
			? new Date(data.billing.current_period_end).toLocaleDateString()
			: null
	);
</script>

<svelte:head>
	<title>Dashboard — Polyglot</title>
</svelte:head>

<div class="space-y-8">
	<PageHeader
		title="Welcome back{data.profile?.display_name ? `, ${data.profile.display_name}` : ''}"
		subtitle={orgName}
	/>

	<!-- Stats Grid -->
	<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
		<Card>
			<div class="flex items-center justify-between">
				<p class="text-sm font-medium text-text-secondary">Plan</p>
				<Badge variant={data.plan === 'pro' ? 'brand' : 'default'}>
					{data.plan === 'pro' ? 'Pro' : 'Free'}
				</Badge>
			</div>
			<p class="mt-3 text-2xl font-bold text-text-primary capitalize">{billingLabel}</p>
			{#if nextBilling}
				<p class="mt-1 text-xs text-text-tertiary">
					{data.billing?.cancel_at_period_end ? 'Ends' : 'Renews'}
					{nextBilling}
				</p>
			{/if}
		</Card>

		<Card>
			<div class="flex items-center justify-between">
				<p class="text-sm font-medium text-text-secondary">Team</p>
				<Badge>{(data.org as { role?: string })?.role ?? 'member'}</Badge>
			</div>
			<p class="mt-3 text-2xl font-bold text-text-primary">{data.memberCount}</p>
			<p class="mt-1 text-xs text-text-tertiary">
				{data.membersByRole?.owner ?? 0} owner, {data.membersByRole?.admin ?? 0} admin, {data
					.membersByRole?.member ?? 0} member{(data.membersByRole?.member ?? 0) !== 1 ? 's' : ''}
			</p>
		</Card>

		<Card>
			<div class="flex items-center justify-between">
				<p class="text-sm font-medium text-text-secondary">Invites</p>
				{#if data.pendingInvites > 0}
					<Badge variant="warning">{data.pendingInvites} pending</Badge>
				{:else}
					<Badge>None</Badge>
				{/if}
			</div>
			<p class="mt-3 text-2xl font-bold text-text-primary">{data.pendingInvites}</p>
			<p class="mt-1 text-xs text-text-tertiary">Pending invitations</p>
		</Card>

		<Card>
			<div class="flex items-center justify-between">
				<p class="text-sm font-medium text-text-secondary">Workspaces</p>
				<Badge>{data.organizations?.length ?? 0}</Badge>
			</div>
			<p class="mt-3 text-2xl font-bold text-text-primary">{data.organizations?.length ?? 0}</p>
			<p class="mt-1 text-xs text-text-tertiary">
				Active for {daysSinceCreated()}d
			</p>
		</Card>
	</div>

	<div class="grid gap-6 lg:grid-cols-2">
		<!-- Recent Activity -->
		<Card>
			<div class="flex items-center justify-between mb-4">
				<h2 class="text-lg font-semibold text-text-primary">Recent Activity</h2>
				<a href="/app/activity" class="text-sm font-medium text-brand-600 hover:text-brand-700">
					View all
				</a>
			</div>
			{#if data.recentActivity.length === 0}
				<p class="py-6 text-sm text-text-tertiary text-center">No activity yet</p>
			{:else}
				<div class="space-y-3">
					{#each data.recentActivity as entry}
						<div class="flex items-start gap-3">
							<Avatar name={getActorName(entry.actor_user_id)} size="sm" class="mt-0.5" />
							<div class="flex-1 min-w-0">
								<p class="text-sm text-text-primary">
									<span class="font-medium">{getActorName(entry.actor_user_id)}</span>
									{' '}{actionLabels[entry.action] ?? entry.action}
								</p>
								<p class="text-xs text-text-tertiary">{timeAgo(entry.created_at)}</p>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</Card>

		<!-- Quick Actions -->
		<Card>
			<h2 class="text-lg font-semibold text-text-primary mb-4">Quick Actions</h2>
			<div class="space-y-2">
				<a
					href="/app/members"
					class="flex items-center gap-3 rounded-lg p-3 hover:bg-surface-secondary transition-colors"
				>
					<div
						class="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600"
					>
						<svg
							class="h-4.5 w-4.5"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
							stroke-width="1.75"
						>
							<path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle
								cx="9"
								cy="7"
								r="4"
							/><path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" />
						</svg>
					</div>
					<div>
						<p class="text-sm font-medium text-text-primary">Invite team members</p>
						<p class="text-xs text-text-tertiary">{data.memberCount} members currently</p>
					</div>
				</a>

				<a
					href="/app/premium"
					class="flex items-center gap-3 rounded-lg p-3 hover:bg-surface-secondary transition-colors"
				>
					<div
						class="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600"
					>
						<svg
							class="h-4.5 w-4.5"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
							stroke-width="1.75"
						>
							<rect x="1" y="4" width="22" height="16" rx="2" /><line
								x1="1"
								y1="10"
								x2="23"
								y2="10"
							/>
						</svg>
					</div>
					<div>
						<p class="text-sm font-medium text-text-primary">Manage billing</p>
						<p class="text-xs text-text-tertiary">
							{data.plan === 'pro' ? 'Pro plan' : 'Free plan'}
						</p>
					</div>
				</a>

				<a
					href="/app/api-keys"
					class="flex items-center gap-3 rounded-lg p-3 hover:bg-surface-secondary transition-colors"
				>
					<div
						class="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-50 text-violet-600"
					>
						<svg
							class="h-4.5 w-4.5"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
							stroke-width="1.75"
						>
							<path
								d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"
							/>
						</svg>
					</div>
					<div>
						<p class="text-sm font-medium text-text-primary">API keys</p>
						<p class="text-xs text-text-tertiary">
							{data.plan === 'pro' ? 'Manage keys' : 'Pro feature'}
						</p>
					</div>
				</a>

				<a
					href="/app/settings"
					class="flex items-center gap-3 rounded-lg p-3 hover:bg-surface-secondary transition-colors"
				>
					<div
						class="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 text-amber-600"
					>
						<svg
							class="h-4.5 w-4.5"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
							stroke-width="1.75"
						>
							<circle cx="12" cy="12" r="3" /><path
								d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"
							/>
						</svg>
					</div>
					<div>
						<p class="text-sm font-medium text-text-primary">Settings</p>
						<p class="text-xs text-text-tertiary">Profile, workspace, security</p>
					</div>
				</a>
			</div>
		</Card>
	</div>
</div>
