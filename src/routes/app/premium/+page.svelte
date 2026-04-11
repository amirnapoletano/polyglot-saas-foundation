<script lang="ts">
	import Card from '$lib/components/ui/Card.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import PageHeader from '$lib/components/ui/PageHeader.svelte';
	import { addToast } from '$lib/stores/toast';

	let { data } = $props();

	let loading = $state(false);

	const planLabel = $derived(data?.plan ?? 'free');
	const statusLabel = $derived(data?.billing?.status ?? 'inactive');

	function formatDate(iso: string | null | undefined) {
		if (!iso) return null;
		try {
			return new Date(iso).toLocaleDateString(undefined, {
				year: 'numeric',
				month: 'short',
				day: '2-digit'
			});
		} catch {
			return iso;
		}
	}

	async function subscribe() {
		if (loading) return;
		loading = true;
		try {
			const res = await fetch('/api/stripe/checkout', { method: 'POST' });
			if (!res.ok) throw new Error(await res.text().catch(() => 'Checkout failed'));
			const json = await res.json().catch(() => null);
			if (json?.url) {
				window.location.href = json.url;
				return;
			}
			throw new Error('Checkout URL missing');
		} catch (e: unknown) {
			addToast((e instanceof Error ? e.message : null) ?? 'Checkout failed', 'error');
		} finally {
			loading = false;
		}
	}

	async function manageBilling() {
		if (loading) return;
		loading = true;
		try {
			const res = await fetch('/api/stripe/portal', { method: 'POST' });
			if (!res.ok) throw new Error(await res.text().catch(() => 'Portal failed'));
			const json = await res.json().catch(() => null);
			if (json?.url) {
				window.location.href = json.url;
				return;
			}
			throw new Error('Portal URL missing');
		} catch (e: unknown) {
			addToast((e instanceof Error ? e.message : null) ?? 'Portal failed', 'error');
		} finally {
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>Billing — Polyglot</title>
</svelte:head>

<div class="space-y-8">
	<PageHeader
		title="Billing"
		subtitle="Manage your subscription and payment details"
		breadcrumbs={[{ label: 'App', href: '/app/dashboard' }, { label: 'Billing' }]}
	/>

	<!-- Current plan -->
	<Card>
		<div class="flex items-start justify-between">
			<div>
				<h2 class="text-lg font-semibold text-text-primary">Current Plan</h2>
				<div class="mt-3 flex items-center gap-3">
					<span class="text-3xl font-bold text-text-primary capitalize">{planLabel}</span>
					<Badge variant={data?.isActive ? 'success' : 'default'}>{statusLabel}</Badge>
				</div>
				{#if data?.isActive}
					{#if data?.willCancel}
						<p class="mt-2 text-sm text-amber-600">
							Cancels on {formatDate(data.cancelsAt)} — you'll have access until then
						</p>
					{:else if data?.currentPeriodEnd}
						<p class="mt-2 text-sm text-text-secondary">
							Renews on {formatDate(data.currentPeriodEnd)}
						</p>
					{/if}
				{/if}
			</div>
		</div>

		<div class="mt-6">
			{#if data?.isActive}
				<Button variant="secondary" onclick={manageBilling} {loading}>Manage Billing</Button>
			{:else}
				<Button onclick={subscribe} {loading}>Upgrade to Pro</Button>
			{/if}
		</div>
	</Card>

	<!-- Plan comparison -->
	<div class="grid gap-6 sm:grid-cols-2">
		<div
			class="rounded-xl border border-border bg-surface p-6 {planLabel === 'free'
				? 'ring-2 ring-brand-500'
				: ''}"
		>
			<h3 class="text-lg font-semibold text-text-primary">Free</h3>
			<p class="mt-1 text-sm text-text-secondary">For getting started</p>
			<div class="mt-4 space-y-2 text-sm text-text-secondary">
				<p class="flex items-center gap-2">
					<span class="text-success">&#10003;</span> 3 team members
				</p>
				<p class="flex items-center gap-2"><span class="text-success">&#10003;</span> 3 projects</p>
				<p class="flex items-center gap-2">
					<span class="text-success">&#10003;</span> Core features
				</p>
			</div>
		</div>

		<div
			class="rounded-xl border border-border bg-surface p-6 {planLabel === 'pro'
				? 'ring-2 ring-brand-500'
				: ''}"
		>
			<div class="flex items-center gap-2">
				<h3 class="text-lg font-semibold text-text-primary">Pro</h3>
				<Badge variant="brand">Recommended</Badge>
			</div>
			<p class="mt-1 text-sm text-text-secondary">For growing teams</p>
			<div class="mt-4 space-y-2 text-sm text-text-secondary">
				<p class="flex items-center gap-2">
					<span class="text-success">&#10003;</span> 10 team members
				</p>
				<p class="flex items-center gap-2">
					<span class="text-success">&#10003;</span> Unlimited projects
				</p>
				<p class="flex items-center gap-2">
					<span class="text-success">&#10003;</span> Priority support
				</p>
				<p class="flex items-center gap-2">
					<span class="text-success">&#10003;</span> Premium features
				</p>
			</div>
		</div>
	</div>
</div>
