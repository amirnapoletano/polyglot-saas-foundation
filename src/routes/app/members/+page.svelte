<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import Card from '$lib/components/ui/Card.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import Avatar from '$lib/components/ui/Avatar.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import PageHeader from '$lib/components/ui/PageHeader.svelte';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';
	import ConfirmModal from '$lib/components/ui/ConfirmModal.svelte';
	import { addToast } from '$lib/stores/toast';

	let { data } = $props();

	let email = $state('');
	let inviteLink = $state('');
	let loading = $state(false);
	let confirmRemoveOpen = $state(false);
	let confirmCancelOpen = $state(false);
	let pendingRemoveId = $state('');
	let pendingCancelId = $state('');
	let searchQuery = $state('');

	const canManageTeam = $derived(
		data.currentUserRole === 'owner' || data.currentUserRole === 'admin'
	);
	const canChangeRoles = $derived(data.currentUserRole === 'owner');

	let filteredMembers = $derived(
		searchQuery.trim()
			? data.members.filter((m) => {
					const q = searchQuery.toLowerCase();
					return (
						m.profile.display_name?.toLowerCase().includes(q) ||
						m.profile.email?.toLowerCase().includes(q)
					);
				})
			: data.members
	);

	async function invite() {
		const normalizedEmail = email.trim().toLowerCase();
		if (!normalizedEmail) {
			addToast('Email is required.', 'error');
			return;
		}

		loading = true;
		try {
			const res = await fetch('/api/invites/create', {
				method: 'POST',
				body: JSON.stringify({ email: normalizedEmail }),
				headers: { 'Content-Type': 'application/json' }
			});
			const result = await res.json().catch(() => null);
			if (!res.ok) {
				addToast(result?.message ?? 'Failed to create invite', 'error');
				return;
			}

			inviteLink = result?.invite_link ? `${window.location.origin}${result.invite_link}` : '';
			addToast('Invite created successfully.', 'success');
			email = '';
			await invalidateAll();
		} catch {
			addToast('Something went wrong while creating the invite.', 'error');
		} finally {
			loading = false;
		}
	}

	async function copyInviteLink() {
		if (!inviteLink) return;
		try {
			await navigator.clipboard.writeText(inviteLink);
			addToast('Invite link copied.', 'success');
		} catch {
			addToast('Could not copy invite link.', 'error');
		}
	}

	async function cancelInvite(inviteId: string) {
		try {
			const res = await fetch(`/api/invites/${inviteId}`, { method: 'DELETE' });
			const result = await res.json().catch(() => null);
			if (!res.ok) {
				addToast(result?.message ?? 'Failed to cancel invite.', 'error');
				return;
			}
			addToast('Invite cancelled.', 'success');
			await invalidateAll();
		} catch {
			addToast('Something went wrong while cancelling the invite.', 'error');
		}
	}

	async function removeMember(memberUserId: string) {
		try {
			const res = await fetch(`/api/members/${memberUserId}`, { method: 'DELETE' });
			const result = await res.json().catch(() => null);
			if (!res.ok) {
				addToast(result?.message ?? 'Failed to remove member.', 'error');
				return;
			}
			addToast('Member removed.', 'success');
			await invalidateAll();
		} catch {
			addToast('Something went wrong while removing the member.', 'error');
		}
	}

	async function changeRole(memberUserId: string, nextRole: string) {
		try {
			const res = await fetch(`/api/members/${memberUserId}/role`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ role: nextRole })
			});
			if (!res.ok) {
				const result = await res.json().catch(() => null);
				addToast(result?.message ?? 'Failed to update role.', 'error');
				return;
			}
			addToast('Role updated.', 'success');
			await invalidateAll();
		} catch {
			addToast('Something went wrong while updating the role.', 'error');
		}
	}

	function formatDate(value?: string | null) {
		if (!value) return null;
		const date = new Date(value);
		if (Number.isNaN(date.getTime())) return null;
		return date.toLocaleDateString();
	}
</script>

<svelte:head>
	<title>Team Members — Polyglot</title>
</svelte:head>

<div class="space-y-8">
	<PageHeader
		title="Team Members"
		subtitle="Manage access, invites, and roles. Plan: {data.plan ??
			'free'} · Seats: {data.usedSeats ?? 0}/{data.seatLimit ?? 0}"
		breadcrumbs={[{ label: 'App', href: '/app/dashboard' }, { label: 'Members' }]}
	/>

	<!-- Invite -->
	<Card>
		<h2 class="text-lg font-semibold text-text-primary">Invite Member</h2>
		{#if canManageTeam}
			<div class="mt-4 flex gap-3 flex-wrap">
				<div class="flex-1 min-w-[240px]">
					<Input
						placeholder="email@example.com"
						bind:value={email}
						type="email"
						autocomplete="off"
					/>
				</div>
				<Button
					onclick={invite}
					{loading}
					disabled={(data.usedSeats ?? 0) >= (data.seatLimit ?? 0)}
				>
					Send Invite
				</Button>
			</div>
			{#if (data.usedSeats ?? 0) >= (data.seatLimit ?? 0)}
				<p class="mt-3 text-sm text-red-600">Seat limit reached for your plan.</p>
			{/if}
		{:else}
			<p class="mt-3 text-sm text-text-secondary">You do not have permission to invite members.</p>
		{/if}

		{#if inviteLink}
			<div class="mt-4 rounded-lg border border-border bg-surface-secondary p-4">
				<p class="text-sm font-medium text-text-primary mb-2">Invite link</p>
				<code class="block text-xs bg-surface-tertiary rounded-lg p-3 break-all text-text-secondary"
					>{inviteLink}</code
				>
				<Button variant="secondary" size="sm" onclick={copyInviteLink} class="mt-3"
					>Copy link</Button
				>
			</div>
		{/if}
	</Card>

	<!-- Members list -->
	<Card>
		<div class="flex items-center justify-between gap-4">
			<h2 class="text-lg font-semibold text-text-primary">Members</h2>
			{#if data.members.length > 0}
				<div class="w-64">
					<Input placeholder="Search by name or email…" bind:value={searchQuery} />
				</div>
			{/if}
		</div>
		{#if data.members.length === 0}
			<EmptyState
				icon="👥"
				title="No members yet"
				description="Invite your first team member above."
			/>
		{:else if filteredMembers.length === 0 && searchQuery.trim()}
			<p class="mt-4 text-sm text-text-tertiary">No members matching "{searchQuery}"</p>
		{:else}
			<div class="mt-4 divide-y divide-border">
				{#each filteredMembers as member}
					<div class="flex items-center justify-between gap-4 py-3">
						<div class="flex items-center gap-3 min-w-0">
							<Avatar name={member.profile.display_name ?? member.profile.email} size="md" />
							<div class="min-w-0">
								<p class="text-sm font-medium text-text-primary truncate">
									{member.profile.display_name ?? member.profile.email ?? member.user_id}
								</p>
								{#if member.profile.email && member.profile.display_name}
									<p class="text-xs text-text-tertiary truncate">{member.profile.email}</p>
								{/if}
							</div>
						</div>

						<div class="flex items-center gap-2 shrink-0">
							{#if canChangeRoles}
								<select
									class="rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-500"
									value={member.role}
									disabled={member.role === 'owner'}
									onchange={(e) =>
										changeRole(member.user_id!, (e.currentTarget as HTMLSelectElement).value)}
								>
									<option value="owner">Owner</option>
									<option value="admin">Admin</option>
									<option value="member">Member</option>
								</select>
							{:else}
								<Badge>{member.role}</Badge>
							{/if}

							{#if canManageTeam && member.role !== 'owner'}
								<Button
									variant="danger"
									size="sm"
									onclick={() => {
										pendingRemoveId = member.user_id!;
										confirmRemoveOpen = true;
									}}>Remove</Button
								>
							{/if}
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</Card>

	<!-- Pending invitations -->
	<Card>
		<h2 class="text-lg font-semibold text-text-primary">Pending Invitations</h2>
		{#if data.invites.length === 0}
			<EmptyState
				icon="✉️"
				title="No pending invites"
				description="Invited members will appear here until they accept."
			/>
		{:else}
			<div class="mt-4 divide-y divide-border">
				{#each data.invites as inv}
					<div class="flex items-center justify-between gap-4 py-3">
						<div class="min-w-0">
							<p class="text-sm font-medium text-text-primary">{inv.email}</p>
							<p class="text-xs text-text-tertiary">
								Role: {inv.role}
								{#if formatDate(inv.expires_at)}
									&middot; Expires {formatDate(inv.expires_at)}
								{/if}
							</p>
						</div>
						<div class="flex items-center gap-2 shrink-0">
							<Badge variant="warning">Invited</Badge>
							{#if canManageTeam}
								<Button
									variant="danger"
									size="sm"
									onclick={() => {
										pendingCancelId = inv.id;
										confirmCancelOpen = true;
									}}>Cancel</Button
								>
							{/if}
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</Card>
</div>

<ConfirmModal
	bind:open={confirmRemoveOpen}
	title="Remove member"
	message="This person will lose access to the workspace immediately. They can be re-invited later."
	confirmLabel="Remove member"
	onconfirm={() => {
		removeMember(pendingRemoveId);
		confirmRemoveOpen = false;
	}}
	oncancel={() => {
		pendingRemoveId = '';
	}}
/>

<ConfirmModal
	bind:open={confirmCancelOpen}
	title="Cancel invite"
	message="This invite link will no longer work. You can send a new invite later."
	confirmLabel="Cancel invite"
	onconfirm={() => {
		cancelInvite(pendingCancelId);
		confirmCancelOpen = false;
	}}
	oncancel={() => {
		pendingCancelId = '';
	}}
/>
