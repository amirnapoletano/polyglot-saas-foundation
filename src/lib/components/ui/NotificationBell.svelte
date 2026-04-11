<script lang="ts">
	import { onMount } from 'svelte';

	interface Notification {
		id: string;
		type: string;
		title: string;
		body: string | null;
		href: string | null;
		read_at: string | null;
		created_at: string;
	}

	let open = $state(false);
	let notifications = $state<Notification[]>([]);
	let unreadCount = $state(0);
	let loading = $state(false);

	async function fetchNotifications() {
		try {
			const res = await fetch('/api/notifications?limit=10');
			if (res.ok) {
				const data = await res.json();
				notifications = data.notifications;
				unreadCount = data.unreadCount;
			}
		} catch {
			// Silently fail
		}
	}

	async function markAsRead(id: string) {
		await fetch('/api/notifications', {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ action: 'read', notificationId: id })
		});
		const notif = notifications.find((n) => n.id === id);
		if (notif && !notif.read_at) {
			notif.read_at = new Date().toISOString();
			unreadCount = Math.max(0, unreadCount - 1);
		}
	}

	async function markAllRead() {
		loading = true;
		await fetch('/api/notifications', {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ action: 'read-all' })
		});
		notifications = notifications.map((n) => ({
			...n,
			read_at: n.read_at ?? new Date().toISOString()
		}));
		unreadCount = 0;
		loading = false;
	}

	function timeAgo(dateStr: string): string {
		const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
		if (seconds < 60) return 'just now';
		if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
		if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
		return `${Math.floor(seconds / 86400)}d`;
	}

	function handleClickOutside(event: MouseEvent) {
		const target = event.target as HTMLElement;
		if (!target.closest('.notification-panel')) {
			open = false;
		}
	}

	function handleNotificationClick(notif: Notification) {
		if (!notif.read_at) markAsRead(notif.id);
		if (notif.href) window.location.href = notif.href;
		open = false;
	}

	onMount(() => {
		fetchNotifications();
		const interval = setInterval(fetchNotifications, 30000);
		return () => clearInterval(interval);
	});
</script>

<svelte:document onclick={handleClickOutside} />

<div class="relative notification-panel">
	<button
		onclick={() => {
			open = !open;
			if (open) fetchNotifications();
		}}
		class="relative flex h-9 w-9 items-center justify-center rounded-lg text-text-secondary hover:bg-surface-secondary hover:text-text-primary transition-colors"
		aria-label="Notifications"
	>
		<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.75">
			<path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
			<path d="M13.73 21a2 2 0 01-3.46 0" />
		</svg>
		{#if unreadCount > 0}
			<span
				class="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white"
			>
				{unreadCount > 9 ? '9+' : unreadCount}
			</span>
		{/if}
	</button>

	{#if open}
		<div
			class="absolute right-0 top-full mt-2 w-80 rounded-xl border border-border bg-surface shadow-lg z-50 overflow-hidden"
		>
			<div class="flex items-center justify-between border-b border-border px-4 py-3">
				<h3 class="text-sm font-semibold text-text-primary">Notifications</h3>
				{#if unreadCount > 0}
					<button
						onclick={markAllRead}
						disabled={loading}
						class="text-xs font-medium text-brand-600 hover:text-brand-700"
					>
						Mark all read
					</button>
				{/if}
			</div>

			<div class="max-h-80 overflow-y-auto">
				{#if notifications.length === 0}
					<div class="px-4 py-8 text-center">
						<p class="text-sm text-text-tertiary">No notifications</p>
					</div>
				{:else}
					{#each notifications as notif}
						<button
							onclick={() => handleNotificationClick(notif)}
							class="flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-surface-secondary transition-colors {!notif.read_at ? 'bg-brand-50/50 dark:bg-brand-950/20' : ''}"
						>
							<div
								class="mt-1.5 h-2 w-2 shrink-0 rounded-full {!notif.read_at ? 'bg-brand-600' : 'bg-transparent'}"
							></div>
							<div class="min-w-0 flex-1">
								<p
									class="text-sm {!notif.read_at ? 'font-medium text-text-primary' : 'text-text-secondary'}"
								>
									{notif.title}
								</p>
								{#if notif.body}
									<p class="mt-0.5 text-xs text-text-tertiary line-clamp-2">{notif.body}</p>
								{/if}
								<p class="mt-1 text-xs text-text-tertiary">{timeAgo(notif.created_at)}</p>
							</div>
						</button>
					{/each}
				{/if}
			</div>
		</div>
	{/if}
</div>
