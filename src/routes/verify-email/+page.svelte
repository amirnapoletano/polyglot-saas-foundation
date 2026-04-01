<script lang="ts">
	import { enhance } from '$app/forms';
	import AuthLayout from '$lib/components/AuthLayout.svelte';
	import Button from '$lib/components/ui/Button.svelte';

	let { data, form } = $props();
	let loading = $state(false);
</script>

<svelte:head>
	<title>Verify your email — Polyglot</title>
</svelte:head>

<AuthLayout title="Check your email" subtitle="We sent a verification link to confirm your account">
	<div class="flex flex-col items-center gap-4 text-center">
		<div
			class="flex h-16 w-16 items-center justify-center rounded-full bg-brand-50 dark:bg-brand-900/30"
		>
			<svg
				class="h-8 w-8 text-brand-600"
				fill="none"
				viewBox="0 0 24 24"
				stroke-width="1.5"
				stroke="currentColor"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
				/>
			</svg>
		</div>

		{#if data.email}
			<p class="text-sm text-text-secondary">
				We sent a link to <span class="font-medium text-text-primary">{data.email}</span>. Click it
				to verify your account.
			</p>
		{:else}
			<p class="text-sm text-text-secondary">
				Check your inbox for a verification link to activate your account.
			</p>
		{/if}

		{#if form?.sent}
			<p class="text-sm text-success font-medium">Verification email resent.</p>
		{/if}
		{#if form?.error}
			<p class="text-sm text-red-600">{form.error}</p>
		{/if}

		<form
			method="POST"
			action="?/resend"
			use:enhance={() => {
				loading = true;
				return async ({ update }) => {
					loading = false;
					await update();
				};
			}}
		>
			<Button type="submit" variant="secondary" size="sm" {loading}>
				Resend verification email
			</Button>
		</form>

		<div class="mt-2 text-xs text-text-tertiary space-y-1">
			<p>Didn't receive it? Check your spam folder.</p>
			<p>
				<a href="/login" class="text-brand-600 hover:text-brand-700 underline">Back to login</a>
			</p>
		</div>
	</div>
</AuthLayout>
