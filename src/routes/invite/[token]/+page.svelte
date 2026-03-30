<script lang="ts">
	import AuthLayout from '$lib/components/AuthLayout.svelte';
	import Button from '$lib/components/ui/Button.svelte';

	let { data } = $props();
</script>

<svelte:head>
	<title>Invite — Polyglot</title>
</svelte:head>

<AuthLayout
	title={data.status === 'accepted' ? 'Already accepted' : data.status === 'expired' ? 'Invite expired' : 'Wrong account'}
	subtitle={data.status === 'accepted' ? 'This invitation has already been used.' : data.status === 'expired' ? 'This invitation is no longer valid.' : `This invite was sent to ${data.invite?.email ?? 'another account'}.`}
>
	{#if data.status === 'accepted'}
		<a href="/app/members">
			<Button class="w-full">Go to Members</Button>
		</a>
	{:else if data.status === 'expired'}
		<a href="/app/dashboard">
			<Button class="w-full">Back to App</Button>
		</a>
	{:else if data.status === 'wrong-account'}
		<p class="text-sm text-text-secondary mb-4">Please sign in with <strong>{data.invite?.email}</strong> to accept this invitation.</p>
		<a href="/app/logout">
			<Button variant="secondary" class="w-full">Log out</Button>
		</a>
	{/if}
</AuthLayout>
