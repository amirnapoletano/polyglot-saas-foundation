<script lang="ts">
	import { enhance } from '$app/forms';
	import AuthLayout from '$lib/components/AuthLayout.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Input from '$lib/components/ui/Input.svelte';

	type Data = { message?: string; next?: string };
	let { data } = $props<{ data: Data }>();

	let email = $state('');
	let password = $state('');
</script>

<svelte:head>
	<title>Log in — Polyglot</title>
</svelte:head>

<AuthLayout title="Welcome back" subtitle="Log in to your account">
	<form method="POST" action="?/login" use:enhance class="flex flex-col gap-4">
		<Input label="Email" name="email" type="email" bind:value={email} required autocomplete="email" />
		<Input label="Password" name="password" type="password" bind:value={password} required autocomplete="current-password" />

		{#if data?.message}
			<p class="text-sm text-red-600">{data.message}</p>
		{/if}

		<Button type="submit" class="w-full mt-2">Log in</Button>

		<div class="flex items-center justify-between text-sm">
			<a href="/reset-password" class="text-text-secondary hover:text-brand-600 transition-colors">Forgot password?</a>
			<a href="/signup" class="text-text-secondary hover:text-brand-600 transition-colors">Create account</a>
		</div>
	</form>
</AuthLayout>
