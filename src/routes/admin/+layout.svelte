<script lang="ts">
	import { page } from '$app/stores';

	let { data, children } = $props();

	const navItems = [
		{ href: '/admin', label: 'Overview' },
		{ href: '/admin/users', label: 'Users' },
		{ href: '/admin/organizations', label: 'Organizations' },
		{ href: '/admin/feature-flags', label: 'Feature Flags' }
	];

	function isActive(href: string, pathname: string) {
		if (href === '/admin') return pathname === '/admin';
		return pathname.startsWith(href);
	}
</script>

<svelte:head>
	<title>Admin — Polyglot</title>
</svelte:head>

<div class="min-h-screen bg-surface-secondary">
	<header class="border-b border-border bg-surface">
		<div class="mx-auto max-w-6xl flex items-center justify-between px-6 py-4">
			<div class="flex items-center gap-4">
				<a href="/admin" class="text-xl font-bold text-text-primary">Polyglot Admin</a>
				<span class="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700"
					>Super Admin</span
				>
			</div>
			<div class="flex items-center gap-4">
				<span class="text-sm text-text-secondary">{data.adminUser?.email}</span>
				<a href="/app/dashboard" class="text-sm text-brand-600 hover:text-brand-700 font-medium"
					>Back to App</a
				>
			</div>
		</div>
		<nav class="mx-auto max-w-6xl px-6">
			<div class="flex gap-1">
				{#each navItems as item}
					<a
						href={item.href}
						class="border-b-2 px-4 py-2.5 text-sm font-medium transition-colors
							{isActive(item.href, $page.url.pathname)
							? 'border-brand-600 text-brand-600'
							: 'border-transparent text-text-secondary hover:text-text-primary'}"
					>
						{item.label}
					</a>
				{/each}
			</div>
		</nav>
	</header>

	<main class="mx-auto max-w-6xl px-6 py-8">
		{@render children()}
	</main>
</div>
