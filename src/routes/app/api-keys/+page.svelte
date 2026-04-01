<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import Card from '$lib/components/ui/Card.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import PageHeader from '$lib/components/ui/PageHeader.svelte';
	import ConfirmModal from '$lib/components/ui/ConfirmModal.svelte';
	import { addToast } from '$lib/stores/toast';

	let { data } = $props();

	let createOpen = $state(false);
	let keyName = $state('');
	let creating = $state(false);
	let newKey = $state<string | null>(null);
	let revokeKeyId = $state<string | null>(null);
	let revokeOpen = $state(false);
	let revoking = $state(false);
	let copied = $state(false);

	async function createKey() {
		if (!keyName.trim()) return;
		creating = true;
		try {
			const res = await fetch('/api/api-keys', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ name: keyName.trim() })
			});
			if (!res.ok) {
				const text = await res.text();
				addToast(text || 'Failed to create key', 'error');
				return;
			}
			const result = await res.json();
			newKey = result.key;
			createOpen = false;
			keyName = '';
			addToast('API key created.', 'success');
			await invalidateAll();
		} catch {
			addToast('Failed to create key.', 'error');
		} finally {
			creating = false;
		}
	}

	async function revokeKey() {
		if (!revokeKeyId) return;
		revoking = true;
		try {
			const res = await fetch(`/api/api-keys/${revokeKeyId}/revoke`, { method: 'POST' });
			if (!res.ok) {
				addToast('Failed to revoke key.', 'error');
				return;
			}
			addToast('API key revoked.', 'success');
			revokeKeyId = null;
			await invalidateAll();
		} catch {
			addToast('Failed to revoke key.', 'error');
		} finally {
			revoking = false;
		}
	}

	async function copyKey() {
		if (!newKey) return;
		await navigator.clipboard.writeText(newKey);
		copied = true;
		setTimeout(() => (copied = false), 2000);
	}

	function timeAgo(dateStr: string | null): string {
		if (!dateStr) return 'Never';
		const diff = Date.now() - new Date(dateStr).getTime();
		const mins = Math.floor(diff / 60000);
		if (mins < 1) return 'Just now';
		if (mins < 60) return `${mins}m ago`;
		const hours = Math.floor(mins / 60);
		if (hours < 24) return `${hours}h ago`;
		const days = Math.floor(hours / 24);
		return `${days}d ago`;
	}
</script>

<svelte:head>
	<title>API Keys — Polyglot</title>
</svelte:head>

<PageHeader
	title="API Keys"
	subtitle="Manage programmatic access to your workspace"
	breadcrumbs={[{ label: 'App', href: '/app/dashboard' }, { label: 'API Keys' }]}
/>

{#if !data.isPro}
	<!-- Upgrade prompt -->
	<Card>
		<div class="text-center py-8">
			<svg
				class="mx-auto h-12 w-12 text-text-tertiary mb-4"
				fill="none"
				stroke="currentColor"
				viewBox="0 0 24 24"
				stroke-width="1.5"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z"
				/>
			</svg>
			<h3 class="text-lg font-semibold text-text-primary">API Keys are a Pro feature</h3>
			<p class="mt-2 text-sm text-text-secondary max-w-md mx-auto">
				Upgrade to Pro to create API keys for programmatic access to your workspace.
			</p>
			<a
				href="/app/premium"
				class="mt-4 inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 transition-colors"
			>
				Upgrade to Pro
			</a>
		</div>
	</Card>
{:else}
	<!-- New key reveal -->
	{#if newKey}
		<Card class="border-brand-200 dark:border-brand-800 mb-6">
			<div class="flex items-start gap-3">
				<svg
					class="h-5 w-5 text-brand-500 shrink-0 mt-0.5"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
					stroke-width="1.75"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z"
					/>
				</svg>
				<div class="flex-1 min-w-0">
					<p class="text-sm font-medium text-text-primary">
						Your new API key — copy it now, it won't be shown again.
					</p>
					<div class="mt-2 flex items-center gap-2">
						<code
							class="flex-1 rounded-lg bg-surface-tertiary px-3 py-2 text-sm font-mono text-text-primary break-all"
							>{newKey}</code
						>
						<Button size="sm" onclick={copyKey}>
							{copied ? 'Copied!' : 'Copy'}
						</Button>
					</div>
				</div>
				<button class="text-text-tertiary hover:text-text-primary" onclick={() => (newKey = null)}>
					<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M6 18L18 6M6 6l12 12"
						/>
					</svg>
				</button>
			</div>
		</Card>
	{/if}

	<Card>
		<div class="flex items-center justify-between">
			<div>
				<h2 class="text-lg font-semibold text-text-primary">Your API Keys</h2>
				<p class="mt-1 text-sm text-text-secondary">
					Keys authenticate requests to <code
						class="text-xs bg-surface-tertiary rounded px-1 py-0.5">/api/v1/*</code
					>
				</p>
			</div>
			{#if data.currentUserRole === 'owner' || data.currentUserRole === 'admin'}
				<Button size="sm" onclick={() => (createOpen = true)}>Create key</Button>
			{/if}
		</div>

		{#if data.keys.length === 0}
			<div class="mt-6 text-center py-8">
				<p class="text-sm text-text-secondary">No API keys yet.</p>
			</div>
		{:else}
			<div class="mt-4 divide-y divide-border">
				{#each data.keys as key}
					<div class="flex items-center justify-between py-3">
						<div class="min-w-0 flex-1">
							<p class="text-sm font-medium text-text-primary">{key.name}</p>
							<div class="flex items-center gap-3 mt-0.5">
								<code class="text-xs text-text-tertiary font-mono">{key.key_prefix}</code>
								<span class="text-xs text-text-tertiary">Created {timeAgo(key.created_at)}</span>
								<span class="text-xs text-text-tertiary"
									>Last used: {timeAgo(key.last_used_at)}</span
								>
								{#if key.expires_at}
									<span class="text-xs text-amber-600"
										>Expires {new Date(key.expires_at).toLocaleDateString()}</span
									>
								{/if}
							</div>
						</div>
						{#if data.currentUserRole === 'owner' || data.currentUserRole === 'admin'}
							<Button
								variant="danger"
								size="sm"
								onclick={() => {
									revokeKeyId = key.id;
									revokeOpen = true;
								}}>Revoke</Button
							>
						{/if}
					</div>
				{/each}
			</div>
		{/if}
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

<!-- Create key modal -->
{#if createOpen}
	<div class="fixed inset-0 z-50 flex items-center justify-center p-4">
		<button class="absolute inset-0 bg-black/40" onclick={() => (createOpen = false)}></button>
		<div class="relative w-full max-w-sm rounded-xl border border-border bg-surface p-6 shadow-xl">
			<h3 class="text-lg font-semibold text-text-primary">Create API Key</h3>
			<p class="mt-1 text-sm text-text-secondary">Give your key a descriptive name.</p>
			<div class="mt-4">
				<Input
					label="Key name"
					bind:value={keyName}
					placeholder="e.g. Production Backend"
					maxlength={100}
				/>
			</div>
			<div class="mt-5 flex gap-3 justify-end">
				<Button variant="secondary" size="sm" onclick={() => (createOpen = false)}>Cancel</Button>
				<Button size="sm" disabled={creating || !keyName.trim()} onclick={createKey}>
					{creating ? 'Creating...' : 'Create key'}
				</Button>
			</div>
		</div>
	</div>
{/if}

<!-- Revoke confirmation -->
<ConfirmModal
	bind:open={revokeOpen}
	title="Revoke API key"
	message="This key will immediately stop working. Any integrations using it will break. This cannot be undone."
	confirmLabel="Revoke key"
	onconfirm={revokeKey}
	oncancel={() => {
		revokeOpen = false;
		revokeKeyId = null;
	}}
/>
