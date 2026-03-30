<script lang="ts">
	import AuthLayout from '$lib/components/AuthLayout.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Input from '$lib/components/ui/Input.svelte';

	type Data = { ok?: boolean; message?: string };
	let { data } = $props<{ data: Data }>();
	let email = $state('');
</script>

<svelte:head>
	<title>Reset Password — Polyglot</title>
</svelte:head>

<AuthLayout title="Reset password" subtitle="We'll send you a link to reset it">
	<form method="POST" action="?/reset" class="flex flex-col gap-4">
		<Input label="Email" name="email" type="email" bind:value={email} required autocomplete="email" />

		{#if data?.ok}
			<p class="text-sm text-emerald-600">Reset link sent. Check your email.</p>
		{/if}
		{#if data?.message}
			<p class="text-sm text-red-600">{data.message}</p>
		{/if}

		<Button type="submit" class="w-full mt-2">Send reset link</Button>

		<p class="text-sm text-center text-text-secondary">
			<a href="/login" class="text-brand-600 hover:text-brand-700 transition-colors">Back to login</a>
		</p>
	</form>
</AuthLayout>
