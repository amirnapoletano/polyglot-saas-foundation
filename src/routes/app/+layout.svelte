<script lang="ts">
	import { page } from '$app/stores';
	import { invalidateAll, goto } from '$app/navigation';
	import Avatar from '$lib/components/ui/Avatar.svelte';
	import ThemeToggle from '$lib/components/ui/ThemeToggle.svelte';
	import NavProgress from '$lib/components/ui/NavProgress.svelte';
	import NotificationBell from '$lib/components/ui/NotificationBell.svelte';

	let { data, children } = $props();

	let switching = $state(false);
	let sidebarOpen = $state(false);
	let shortcutsOpen = $state(false);

	async function switchOrganization(organizationId: string) {
		if (!organizationId || switching) return;
		switching = true;
		try {
			const res = await fetch('/api/organizations/switch', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ organizationId })
			});
			if (res.ok) await invalidateAll();
		} finally {
			switching = false;
		}
	}

	const navItems = [
		{ href: '/app/dashboard', label: 'Dashboard', icon: 'grid', shortcut: 'G D' },
		{ href: '/app/members', label: 'Members', icon: 'users', shortcut: 'G M' },
		{ href: '/app/activity', label: 'Activity', icon: 'activity', shortcut: 'G A' },
		{ href: '/app/premium', label: 'Billing', icon: 'credit-card', shortcut: 'G B' },
		{ href: '/app/api-keys', label: 'API Keys', icon: 'key', shortcut: 'G K' },
		{ href: '/app/files', label: 'Files', icon: 'file', shortcut: 'G F' },
		{ href: '/app/webhooks', label: 'Webhooks', icon: 'webhook', shortcut: 'G W' },
		{ href: '/app/settings', label: 'Settings', icon: 'settings', shortcut: 'G S' }
	];

	function isActive(href: string, pathname: string) {
		return pathname === href || pathname.startsWith(href + '/');
	}

	// Keyboard shortcuts
	let pendingG = false;
	let gTimeout: ReturnType<typeof setTimeout>;

	function handleKeydown(e: KeyboardEvent) {
		const target = e.target as HTMLElement;
		if (
			target.tagName === 'INPUT' ||
			target.tagName === 'TEXTAREA' ||
			target.tagName === 'SELECT' ||
			target.isContentEditable
		)
			return;

		if (e.key === '?') {
			e.preventDefault();
			shortcutsOpen = !shortcutsOpen;
			return;
		}

		if (e.key === 'Escape') {
			shortcutsOpen = false;
			return;
		}

		if (e.key === 'g' || e.key === 'G') {
			if (!pendingG) {
				pendingG = true;
				clearTimeout(gTimeout);
				gTimeout = setTimeout(() => {
					pendingG = false;
				}, 800);
				return;
			}
		}

		if (pendingG) {
			pendingG = false;
			clearTimeout(gTimeout);
			const shortcuts: Record<string, string> = {
				d: '/app/dashboard',
				m: '/app/members',
				a: '/app/activity',
				b: '/app/premium',
				k: '/app/api-keys',
				f: '/app/files',
				w: '/app/webhooks',
				s: '/app/settings'
			};
			const dest = shortcuts[e.key.toLowerCase()];
			if (dest) {
				e.preventDefault();
				goto(dest);
			}
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />
<NavProgress />

<svelte:head>
	<title>App — Polyglot</title>
</svelte:head>

<div class="flex min-h-screen bg-surface-secondary">
	<!-- Mobile header -->
	<div
		class="fixed inset-x-0 top-0 z-30 flex items-center justify-between border-b border-border bg-surface px-4 py-3 md:hidden"
	>
		<span class="text-lg font-bold text-text-primary">Polyglot</span>
		<div class="flex items-center gap-2">
			<NotificationBell />
			<button
				class="rounded-lg p-2 text-text-secondary hover:bg-surface-secondary transition-colors"
				onclick={() => (sidebarOpen = !sidebarOpen)}
			>
				<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					{#if sidebarOpen}
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M6 18L18 6M6 6l12 12"
						/>
					{:else}
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M4 6h16M4 12h16M4 18h16"
						/>
					{/if}
				</svg>
			</button>
		</div>
	</div>

	<!-- Backdrop -->
	{#if sidebarOpen}
		<button class="fixed inset-0 z-30 bg-black/30 md:hidden" onclick={() => (sidebarOpen = false)}
		></button>
	{/if}

	<!-- Sidebar -->
	<aside
		class="fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-border bg-surface transition-transform duration-200
		{sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:static"
	>
		<!-- Brand -->
		<div class="flex items-center gap-2 px-5 py-5 border-b border-border">
			<span class="text-xl font-bold text-text-primary">Polyglot</span>
		</div>

		<!-- Org switcher -->
		{#if (data.organizations?.length ?? 0) > 0}
			<div class="px-4 py-4 border-b border-border">
				<label
					for="org-switch"
					class="block text-xs font-medium text-text-secondary mb-1.5 uppercase tracking-wider"
					>Workspace</label
				>
				<div class="relative">
					<select
						id="org-switch"
						value={data.activeOrgId ?? ''}
						disabled={switching}
						class="w-full rounded-lg border border-border bg-surface-secondary px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-60"
						onchange={(e) => switchOrganization((e.currentTarget as HTMLSelectElement).value)}
					>
						{#each data.organizations ?? [] as item}
							<option value={item.organization_id}>
								{item.organization?.name ?? item.organization_id}
							</option>
						{/each}
					</select>
					{#if switching}
						<div class="absolute right-3 top-1/2 -translate-y-1/2">
							<svg class="h-4 w-4 animate-spin text-brand-500" fill="none" viewBox="0 0 24 24">
								<circle
									class="opacity-25"
									cx="12"
									cy="12"
									r="10"
									stroke="currentColor"
									stroke-width="4"
								></circle>
								<path
									class="opacity-75"
									fill="currentColor"
									d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
								></path>
							</svg>
						</div>
					{/if}
				</div>
			</div>
		{/if}

		<!-- Nav -->
		<nav class="flex-1 px-3 py-4 space-y-1">
			{#each navItems as item}
				<a
					href={item.href}
					class="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors
						{isActive(item.href, $page.url.pathname)
						? 'bg-brand-600/10 text-brand-600 font-semibold'
						: 'text-text-secondary hover:bg-surface-secondary hover:text-text-primary'}"
					onclick={() => (sidebarOpen = false)}
				>
					<svg
						class="h-4.5 w-4.5 shrink-0"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
						stroke-width="1.75"
					>
						{#if item.icon === 'grid'}
							<rect x="3" y="3" width="7" height="7" rx="1" /><rect
								x="14"
								y="3"
								width="7"
								height="7"
								rx="1"
							/><rect x="3" y="14" width="7" height="7" rx="1" /><rect
								x="14"
								y="14"
								width="7"
								height="7"
								rx="1"
							/>
						{:else if item.icon === 'users'}
							<path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle
								cx="9"
								cy="7"
								r="4"
							/><path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" />
						{:else if item.icon === 'activity'}
							<polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
						{:else if item.icon === 'credit-card'}
							<rect x="1" y="4" width="22" height="16" rx="2" /><line
								x1="1"
								y1="10"
								x2="23"
								y2="10"
							/>
						{:else if item.icon === 'key'}
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z"
							/>
						{:else if item.icon === 'file'}
							<path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline
								points="14 2 14 8 20 8"
							/>
						{:else if item.icon === 'webhook'}
							<path
								d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"
							/>
						{:else if item.icon === 'settings'}
							<circle cx="12" cy="12" r="3" /><path
								d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"
							/>
						{/if}
					</svg>
					{item.label}
				</a>
			{/each}
		</nav>

		<!-- Footer -->
		<div class="border-t border-border px-4 py-4 space-y-1">
			<ThemeToggle />
			<button
				onclick={() => (shortcutsOpen = true)}
				class="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-text-secondary hover:bg-surface-secondary hover:text-text-primary transition-colors w-full"
			>
				<svg
					class="h-4 w-4 shrink-0"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
					stroke-width="1.75"
				>
					<rect x="2" y="4" width="20" height="16" rx="2" /><path
						d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M8 12h8M6 16h.01M10 16h.01M14 16h.01M18 16h.01"
					/>
				</svg>
				Shortcuts
				<kbd class="ml-auto text-xs bg-surface-tertiary rounded px-1.5 py-0.5 text-text-tertiary"
					>?</kbd
				>
			</button>
			<div class="pt-2 flex items-center gap-3">
				<Avatar
					name={data.profile?.display_name ?? data.profile?.email}
					src={data.profile?.avatar_url}
					size="sm"
				/>
				<div class="flex-1 min-w-0">
					<p class="text-sm font-medium text-text-primary truncate">
						{data.profile?.display_name ?? 'User'}
					</p>
					<p class="text-xs text-text-tertiary truncate">{data.profile?.email ?? ''}</p>
				</div>
			</div>
			<a
				href="/app/logout"
				class="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-text-secondary hover:bg-surface-secondary hover:text-text-primary transition-colors"
			>
				<svg
					class="h-4 w-4"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
					stroke-width="1.75"
				>
					<path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" /><polyline
						points="16 17 21 12 16 7"
					/><line x1="21" y1="12" x2="9" y2="12" />
				</svg>
				Log out
			</a>
		</div>
	</aside>

	<!-- Main content -->
	<main class="flex-1 pt-14 md:pt-0">
		<div class="hidden md:flex items-center justify-end border-b border-border px-6 py-3">
			<NotificationBell />
		</div>
		<div class="mx-auto max-w-5xl px-6 py-8">
			{@render children()}
		</div>
	</main>
</div>

<!-- Keyboard shortcuts modal -->
{#if shortcutsOpen}
	<div class="fixed inset-0 z-50 flex items-center justify-center p-4">
		<button class="absolute inset-0 bg-black/40" onclick={() => (shortcutsOpen = false)}></button>
		<div class="relative w-full max-w-sm rounded-xl border border-border bg-surface p-6 shadow-xl">
			<h3 class="text-lg font-semibold text-text-primary mb-4">Keyboard Shortcuts</h3>
			<div class="space-y-3">
				{#each navItems as item}
					<div class="flex items-center justify-between text-sm">
						<span class="text-text-secondary">{item.label}</span>
						<kbd class="rounded bg-surface-tertiary px-2 py-1 text-xs font-mono text-text-secondary"
							>{item.shortcut}</kbd
						>
					</div>
				{/each}
				<div class="border-t border-border pt-3 flex items-center justify-between text-sm">
					<span class="text-text-secondary">Show shortcuts</span>
					<kbd class="rounded bg-surface-tertiary px-2 py-1 text-xs font-mono text-text-secondary"
						>?</kbd
					>
				</div>
			</div>
			<button
				onclick={() => (shortcutsOpen = false)}
				class="mt-5 w-full rounded-lg bg-surface-secondary px-4 py-2 text-sm font-medium text-text-primary hover:bg-surface-tertiary transition-colors"
			>
				Close
			</button>
		</div>
	</div>
{/if}
