<script lang="ts">
	import { enhance } from '$app/forms';
	import Card from '$lib/components/ui/Card.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import PageHeader from '$lib/components/ui/PageHeader.svelte';
	import ConfirmModal from '$lib/components/ui/ConfirmModal.svelte';
	import Avatar from '$lib/components/ui/Avatar.svelte';
	import { addToast } from '$lib/stores/toast';

	let { data, form } = $props();

	let displayName = $state(data.profile?.display_name ?? '');
	let orgName = $state(data.org?.name ?? '');
	let deleteModalOpen = $state(false);
	let leaveModalOpen = $state(false);

	const isOwner = data.currentUserRole === 'owner';
	const canEdit = isOwner || data.currentUserRole === 'admin';

	let avatarUploading = $state(false);

	$effect(() => {
		if (form?.profileSuccess) addToast('Profile updated.', 'success');
		if (form?.avatarSuccess) addToast('Avatar updated.', 'success');
		if (form?.orgSuccess) addToast('Workspace renamed.', 'success');
		if (form?.profileError) addToast(form.profileError, 'error');
		if (form?.avatarError) addToast(form.avatarError as string, 'error');
		if (form?.orgError) addToast(form.orgError, 'error');
		if (form?.deleteError) addToast(form.deleteError, 'error');
		if (form?.leaveError) addToast(form.leaveError, 'error');
	});
</script>

<svelte:head>
	<title>Settings — Polyglot</title>
</svelte:head>

<PageHeader
	title="Settings"
	subtitle="Manage your profile and workspace"
	breadcrumbs={[{ label: 'App', href: '/app/dashboard' }, { label: 'Settings' }]}
/>

<div class="space-y-6">
	<!-- Profile -->
	<Card>
		<h2 class="text-lg font-semibold text-text-primary">Profile</h2>
		<p class="mt-1 text-sm text-text-secondary">Your personal account details.</p>

		<!-- Avatar -->
		<form
			method="POST"
			action="?/updateAvatar"
			enctype="multipart/form-data"
			use:enhance={() => {
				avatarUploading = true;
				return async ({ update }) => {
					avatarUploading = false;
					await update();
				};
			}}
			class="mt-5"
		>
			<div class="flex items-center gap-4 py-3 border-b border-border">
				<Avatar name={data.profile?.display_name ?? data.profile?.email} src={data.profile?.avatar_url} size="lg" />
				<div class="flex-1 min-w-0">
					<p class="text-sm font-medium text-text-primary">Avatar</p>
					<p class="text-xs text-text-secondary">JPG, PNG, WebP, or GIF. Max 2MB.</p>
				</div>
				<label class="cursor-pointer rounded-lg border border-border bg-surface-secondary px-3 py-1.5 text-sm font-medium text-text-primary hover:bg-surface-tertiary transition-colors">
					{avatarUploading ? 'Uploading...' : 'Change'}
					<input
						type="file"
						name="avatar"
						accept="image/jpeg,image/png,image/webp,image/gif"
						class="hidden"
						disabled={avatarUploading}
						onchange={(e) => e.currentTarget.form?.requestSubmit()}
					/>
				</label>
			</div>
		</form>

		<form method="POST" action="?/updateProfile" use:enhance class="mt-5 space-y-4">
			<div class="flex items-center justify-between py-2 border-b border-border">
				<span class="text-sm text-text-secondary">Email</span>
				<span class="text-sm font-medium text-text-primary">{data.profile?.email ?? '—'}</span>
			</div>

			<Input label="Display name" name="display_name" bind:value={displayName} placeholder="Your name" maxlength={100} />

			<Button type="submit" size="sm">Save profile</Button>
		</form>
	</Card>

	<!-- Workspace -->
	<Card>
		<div class="flex items-center gap-3">
			<h2 class="text-lg font-semibold text-text-primary">Workspace</h2>
			<Badge variant={isOwner ? 'brand' : 'default'}>{data.currentUserRole}</Badge>
		</div>
		<p class="mt-1 text-sm text-text-secondary">Settings for your current workspace.</p>

		{#if canEdit}
			<form method="POST" action="?/renameOrg" use:enhance class="mt-5 space-y-4">
				<input type="hidden" name="org_id" value={data.org?.id ?? ''} />
				<Input label="Workspace name" name="org_name" bind:value={orgName} minlength={2} maxlength={60} />
				<Button type="submit" size="sm">Rename workspace</Button>
			</form>
		{:else}
			<div class="mt-5 flex items-center justify-between py-2 border-b border-border">
				<span class="text-sm text-text-secondary">Workspace name</span>
				<span class="text-sm font-medium text-text-primary">{data.org?.name ?? '—'}</span>
			</div>
		{/if}

		{#if data.org?.created_at}
			<div class="mt-4 flex items-center justify-between py-2 border-b border-border">
				<span class="text-sm text-text-secondary">Created</span>
				<span class="text-sm text-text-primary">{new Date(data.org.created_at).toLocaleDateString()}</span>
			</div>
		{/if}

		<div class="mt-4 flex items-center justify-between py-2">
			<span class="text-sm text-text-secondary">Plan</span>
			<span class="text-sm font-medium text-text-primary capitalize">{data.plan ?? 'free'}</span>
		</div>
	</Card>

	<!-- Danger Zone -->
	<Card class="border-red-200 dark:border-red-900">
		<h2 class="text-lg font-semibold text-red-600">Danger Zone</h2>
		<p class="mt-1 text-sm text-text-secondary">Irreversible actions. Be careful.</p>

		<div class="mt-5 space-y-4">
			{#if !isOwner}
				<div class="flex items-center justify-between rounded-lg border border-border p-4">
					<div>
						<p class="text-sm font-medium text-text-primary">Leave workspace</p>
						<p class="text-xs text-text-secondary">Remove yourself from this organization.</p>
					</div>
					<Button variant="danger" size="sm" onclick={() => leaveModalOpen = true}>
						Leave
					</Button>
				</div>
			{/if}

			{#if isOwner}
				<div class="flex items-center justify-between rounded-lg border border-red-200 dark:border-red-900 p-4">
					<div>
						<p class="text-sm font-medium text-text-primary">Delete workspace</p>
						<p class="text-xs text-text-secondary">Permanently delete this workspace, all members, and billing data.</p>
					</div>
					<Button variant="danger" size="sm" onclick={() => deleteModalOpen = true}>
						Delete
					</Button>
				</div>
			{/if}
		</div>
	</Card>
</div>

<!-- Delete confirmation -->
<ConfirmModal
	bind:open={deleteModalOpen}
	title="Delete workspace"
	message="This will permanently delete the workspace, remove all members, and cancel any active subscriptions. This action cannot be undone."
	confirmLabel="Delete workspace"
	requireInput={data.org?.name ?? ''}
	onconfirm={() => {
		const form = document.createElement('form');
		form.method = 'POST';
		form.action = '?/deleteOrg';
		const input = document.createElement('input');
		input.name = 'org_id';
		input.value = data.org?.id ?? '';
		form.appendChild(input);
		document.body.appendChild(form);
		form.submit();
	}}
	oncancel={() => {}}
/>

<!-- Leave confirmation -->
<ConfirmModal
	bind:open={leaveModalOpen}
	title="Leave workspace"
	message="You will lose access to this workspace and its data. You can be re-invited later."
	confirmLabel="Leave workspace"
	onconfirm={() => {
		const form = document.createElement('form');
		form.method = 'POST';
		form.action = '?/leaveOrg';
		const input = document.createElement('input');
		input.name = 'org_id';
		input.value = data.org?.id ?? '';
		form.appendChild(input);
		document.body.appendChild(form);
		form.submit();
	}}
	oncancel={() => {}}
/>
