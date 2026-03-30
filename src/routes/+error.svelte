<script lang="ts">
	import { page } from '$app/stores';
	import Button from '$lib/components/ui/Button.svelte';
</script>

<div class="flex min-h-screen items-center justify-center bg-surface-secondary px-4">
	<div class="text-center max-w-md">
		<p class="text-6xl font-bold text-brand-600">{$page.status}</p>
		<h1 class="mt-4 text-2xl font-bold text-text-primary">
			{$page.status === 404 ? 'Page not found' : 'Something went wrong'}
		</h1>
		<p class="mt-2 text-text-secondary">
			{$page.error?.message ?? 'An unexpected error occurred.'}
		</p>
		<div class="mt-6 flex items-center justify-center gap-3">
			<a href="/">
				<Button variant="secondary">Go Home</Button>
			</a>
			<a href="/app/dashboard">
				<Button>Dashboard</Button>
			</a>
		</div>
	</div>
</div>
