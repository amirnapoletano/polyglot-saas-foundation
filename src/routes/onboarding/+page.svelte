<script lang="ts">
	import AuthLayout from '$lib/components/AuthLayout.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import { addToast } from '$lib/stores/toast';

	type Data = { profile?: { display_name?: string | null } };

	const { data } = $props<{ data: Data }>();

	const initialName = data.profile?.display_name ?? '';

	let step = $state(1);
	let workspace = $state('');
	let displayName = $state(initialName);
	let inviteEmails = $state('');
	let loading = $state(false);

	const totalSteps = 4;
	const stepIndices = [0, 1, 2, 3];

	async function handleCreateWorkspace() {
		if (!workspace.trim() || workspace.trim().length < 2) {
			addToast('Workspace name must be at least 2 characters.', 'error');
			return;
		}
		loading = true;
		try {
			const res = await fetch('/onboarding', {
				method: 'POST',
				headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
				body: new URLSearchParams({
					workspace_name: workspace.trim(),
					display_name: displayName.trim(),
					_action: 'createWorkspace'
				})
			});
			const result = await res.json().catch(() => null);
			if (result?.type === 'failure') {
				addToast(result.data?.message ?? 'Failed to create workspace.', 'error');
				return;
			}
			step = 2;
		} catch {
			addToast('Something went wrong.', 'error');
		} finally {
			loading = false;
		}
	}

	async function handleUpdateProfile() {
		if (!displayName.trim()) {
			step = 3;
			return;
		}
		loading = true;
		try {
			await fetch('/onboarding', {
				method: 'POST',
				headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
				body: new URLSearchParams({
					display_name: displayName.trim(),
					_action: 'updateProfile'
				})
			});
			step = 3;
		} catch {
			step = 3;
		} finally {
			loading = false;
		}
	}

	async function handleInviteTeam() {
		const emails = inviteEmails
			.split(/[,\n]/)
			.map((e) => e.trim().toLowerCase())
			.filter((e) => e && e.includes('@'));

		if (emails.length === 0) {
			step = 4;
			return;
		}

		loading = true;
		let sent = 0;
		for (const email of emails) {
			try {
				const res = await fetch('/api/invites/create', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ email })
				});
				if (res.ok) sent++;
			} catch {
				// Continue with others
			}
		}
		if (sent > 0) addToast(`${sent} invite${sent > 1 ? 's' : ''} sent!`, 'success');
		loading = false;
		step = 4;
	}

	function goToDashboard() {
		window.location.href = '/app/dashboard';
	}
</script>

<svelte:head>
	<title>Get Started — Polyglot</title>
</svelte:head>

<AuthLayout
	title={step === 1
		? 'Create your workspace'
		: step === 2
			? 'Set up your profile'
			: step === 3
				? 'Invite your team'
				: 'You\'re all set!'}
	subtitle={step === 1
		? 'Pick a name for your organization'
		: step === 2
			? 'How should your team know you?'
			: step === 3
				? 'Collaboration is better together'
				: 'Your workspace is ready to go'}
>
	<!-- Progress -->
	<div class="flex items-center gap-2 mb-6">
		{#each stepIndices as i}
			<div
				class="h-1.5 flex-1 rounded-full transition-colors {i < step
					? 'bg-brand-600'
					: 'bg-surface-tertiary'}"
			></div>
		{/each}
	</div>
	<p class="text-xs text-text-tertiary mb-4">Step {step} of {totalSteps}</p>

	{#if step === 1}
		<div class="flex flex-col gap-4">
			<Input
				label="Workspace name"
				bind:value={workspace}
				required
				minlength={2}
				maxlength={60}
				placeholder="My Company"
			/>
			<Button onclick={handleCreateWorkspace} {loading} class="w-full">
				Create workspace
			</Button>
		</div>
	{:else if step === 2}
		<div class="flex flex-col gap-4">
			<Input
				label="Your name"
				bind:value={displayName}
				placeholder="Jane Smith"
				maxlength={80}
			/>
			<Button onclick={handleUpdateProfile} {loading} class="w-full">
				{displayName.trim() ? 'Save & continue' : 'Skip'}
			</Button>
		</div>
	{:else if step === 3}
		<div class="flex flex-col gap-4">
			<div>
				<label for="invite-emails" class="block text-sm font-medium text-text-primary mb-1.5"
					>Email addresses</label
				>
				<textarea
					id="invite-emails"
					bind:value={inviteEmails}
					placeholder="alice@example.com&#10;bob@example.com"
					rows={3}
					class="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-brand-500"
				></textarea>
				<p class="mt-1 text-xs text-text-tertiary">Separate with commas or new lines</p>
			</div>
			<Button onclick={handleInviteTeam} {loading} class="w-full">
				{inviteEmails.trim() ? 'Send invites & continue' : 'Skip'}
			</Button>
		</div>
	{:else}
		<div class="flex flex-col items-center gap-4 py-4">
			<div
				class="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600"
			>
				<svg
					class="h-8 w-8"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
					stroke-width="2"
				>
					<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
				</svg>
			</div>
			<p class="text-sm text-text-secondary text-center">
				<strong class="text-text-primary">{workspace || 'Your workspace'}</strong> is ready.
				Start building!
			</p>
			<Button onclick={goToDashboard} class="w-full">Go to Dashboard</Button>
		</div>
	{/if}
</AuthLayout>
