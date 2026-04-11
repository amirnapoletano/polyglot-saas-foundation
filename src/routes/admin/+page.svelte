<script lang="ts">
	import Card from '$lib/components/ui/Card.svelte';

	let { data } = $props();
</script>

<div class="space-y-6">
	<h1 class="text-2xl font-bold text-text-primary">Overview</h1>

	<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
		<Card>
			<p class="text-sm font-medium text-text-secondary">Total Users</p>
			<p class="mt-2 text-3xl font-bold text-text-primary">{data.totalUsers}</p>
		</Card>
		<Card>
			<p class="text-sm font-medium text-text-secondary">Organizations</p>
			<p class="mt-2 text-3xl font-bold text-text-primary">{data.totalOrgs}</p>
		</Card>
		<Card>
			<p class="text-sm font-medium text-text-secondary">Active Subscriptions</p>
			<p class="mt-2 text-3xl font-bold text-text-primary">{data.activeSubscriptions}</p>
		</Card>
		<Card>
			<p class="text-sm font-medium text-text-secondary">Revenue Orgs</p>
			<p class="mt-2 text-3xl font-bold text-text-primary">{data.totalBilling}</p>
		</Card>
	</div>
</div>
