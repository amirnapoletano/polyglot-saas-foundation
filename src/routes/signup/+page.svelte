<script lang="ts">
	import { enhance } from '$app/forms';
	import AuthLayout from '$lib/components/AuthLayout.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Input from '$lib/components/ui/Input.svelte';

	let { form } = $props();
</script>

<svelte:head>
	<title>Sign up — Polyglot</title>
</svelte:head>

<AuthLayout title="Create your account" subtitle="Get started in under a minute">
	<form method="POST" use:enhance class="flex flex-col gap-4">
		<Input label="Email" name="email" type="email" required autocomplete="email" />
		<Input label="Password" name="password" type="password" required autocomplete="new-password" />

		{#if form?.message}
			<p class="text-sm text-red-600">{form.message}</p>
		{/if}

		<Button type="submit" class="w-full mt-2">Create account</Button>

		<p class="text-sm text-center text-text-secondary">
			Already have an account? <a href="/login" class="text-brand-600 hover:text-brand-700 transition-colors">Log in</a>
		</p>
	</form>
</AuthLayout>
