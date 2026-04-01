<script lang="ts">
	import { goto } from '$app/navigation';
	import AuthLayout from '$lib/components/AuthLayout.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Input from '$lib/components/ui/Input.svelte';

	let { data } = $props();

	let code = $state('');
	let loading = $state(false);
	let error = $state('');

	async function getSupabase() {
		const { createBrowserClient } = await import('@supabase/ssr');
		return createBrowserClient(
			import.meta.env.PUBLIC_SUPABASE_URL,
			import.meta.env.PUBLIC_SUPABASE_ANON_KEY
		);
	}

	async function verify() {
		if (code.length !== 6) {
			error = 'Enter a 6-digit code from your authenticator app.';
			return;
		}
		loading = true;
		error = '';

		try {
			const supabase = await getSupabase();
			const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
				factorId: data.factorId
			});

			if (challengeError) {
				error = challengeError.message;
				return;
			}

			const { error: verifyError } = await supabase.auth.mfa.verify({
				factorId: data.factorId,
				challengeId: challengeData.id,
				code
			});

			if (verifyError) {
				error = verifyError.message;
				return;
			}

			await goto('/app/dashboard');
		} catch {
			error = 'Verification failed. Please try again.';
		} finally {
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>Two-Factor Verification — Polyglot</title>
</svelte:head>

<AuthLayout title="Two-factor verification" subtitle="Enter the code from your authenticator app">
	<div class="flex flex-col gap-4">
		<div class="flex justify-center">
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
						d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
					/>
				</svg>
			</div>
		</div>

		<Input
			label="Authentication code"
			bind:value={code}
			placeholder="000000"
			maxlength={6}
			autocomplete="one-time-code"
		/>

		{#if error}
			<p class="text-sm text-red-600">{error}</p>
		{/if}

		<Button onclick={verify} {loading} class="w-full">Verify</Button>

		<p class="text-xs text-center text-text-tertiary">
			Open your authenticator app and enter the 6-digit code for Polyglot.
		</p>

		<div class="text-center">
			<a href="/login" class="text-sm text-brand-600 hover:text-brand-700 transition-colors">
				Back to login
			</a>
		</div>
	</div>
</AuthLayout>
