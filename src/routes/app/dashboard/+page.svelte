<script lang="ts">
	import Card from '$lib/components/ui/Card.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import PageHeader from '$lib/components/ui/PageHeader.svelte';

	let { data } = $props();

	const orgName = $derived(data.organizations?.find(
		(o: any) => o.organization_id === data.activeOrgId
	)?.organization?.name ?? 'Your workspace');
</script>

<svelte:head>
	<title>Dashboard — Polyglot</title>
</svelte:head>

<div class="space-y-8">
	<PageHeader
		title="Welcome back{data.profile?.display_name ? `, ${data.profile.display_name}` : ''}"
		subtitle={orgName}
	/>

	<!-- Stats -->
	<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
		<Card>
			<p class="text-sm font-medium text-text-secondary">Plan</p>
			<div class="mt-2 flex items-center gap-2">
				<span class="text-2xl font-bold text-text-primary capitalize">{data.plan ?? 'free'}</span>
				<Badge variant={data.plan === 'pro' ? 'brand' : 'default'}>{data.isActive ? 'Active' : 'Inactive'}</Badge>
			</div>
		</Card>

		<Card>
			<p class="text-sm font-medium text-text-secondary">Role</p>
			<div class="mt-2">
				<span class="text-2xl font-bold text-text-primary capitalize">{(data.org as any)?.role ?? 'member'}</span>
			</div>
		</Card>

		<Card>
			<p class="text-sm font-medium text-text-secondary">Workspaces</p>
			<div class="mt-2">
				<span class="text-2xl font-bold text-text-primary">{data.organizations?.length ?? 0}</span>
			</div>
		</Card>
	</div>

	<!-- Quick actions -->
	<div>
		<h2 class="text-lg font-semibold text-text-primary mb-4">Quick actions</h2>
		<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
			<a href="/app/members" class="group rounded-xl border border-border bg-surface p-5 hover:shadow-md transition-all">
				<div class="flex items-center gap-3">
					<div class="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-600 group-hover:bg-brand-100 transition-colors">
						<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.75">
							<path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" />
						</svg>
					</div>
					<div>
						<p class="font-medium text-text-primary">Team Members</p>
						<p class="text-sm text-text-secondary">Invite and manage your team</p>
					</div>
				</div>
			</a>

			<a href="/app/premium" class="group rounded-xl border border-border bg-surface p-5 hover:shadow-md transition-all">
				<div class="flex items-center gap-3">
					<div class="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100 transition-colors">
						<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.75">
							<rect x="1" y="4" width="22" height="16" rx="2" /><line x1="1" y1="10" x2="23" y2="10" />
						</svg>
					</div>
					<div>
						<p class="font-medium text-text-primary">Billing</p>
						<p class="text-sm text-text-secondary">Manage your subscription</p>
					</div>
				</div>
			</a>

			<a href="/app/settings" class="group rounded-xl border border-border bg-surface p-5 hover:shadow-md transition-all">
				<div class="flex items-center gap-3">
					<div class="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-600 group-hover:bg-amber-100 transition-colors">
						<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.75">
							<circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
						</svg>
					</div>
					<div>
						<p class="font-medium text-text-primary">Settings</p>
						<p class="text-sm text-text-secondary">Configure your workspace</p>
					</div>
				</div>
			</a>
		</div>
	</div>
</div>
