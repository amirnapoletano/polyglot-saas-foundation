<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import Card from '$lib/components/ui/Card.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import PageHeader from '$lib/components/ui/PageHeader.svelte';
	import ConfirmModal from '$lib/components/ui/ConfirmModal.svelte';
	import { addToast } from '$lib/stores/toast';

	let { data } = $props();

	// Enrollment state
	let enrolling = $state(false);
	let qrCode = $state('');
	let secret = $state('');
	let factorId = $state('');
	let verifyCode = $state('');
	let verifying = $state(false);

	// Unenroll state
	let unenrollOpen = $state(false);
	let unenrollFactorId = $state('');

	async function getSupabase() {
		const { createBrowserClient } = await import('@supabase/ssr');
		return createBrowserClient(
			import.meta.env.PUBLIC_SUPABASE_URL,
			import.meta.env.PUBLIC_SUPABASE_ANON_KEY
		);
	}

	async function startEnroll() {
		enrolling = true;
		try {
			const supabase = await getSupabase();
			const { data: enrollData, error } = await supabase.auth.mfa.enroll({
				factorType: 'totp',
				friendlyName: 'Authenticator app'
			});
			if (error) {
				addToast(error.message, 'error');
				return;
			}
			if (enrollData.type === 'totp') {
				factorId = enrollData.id;
				qrCode = enrollData.totp.qr_code;
				secret = enrollData.totp.secret;
			}
		} catch {
			addToast('Failed to start MFA enrollment.', 'error');
		} finally {
			enrolling = false;
		}
	}

	async function verifyEnrollment() {
		if (verifyCode.length !== 6) {
			addToast('Enter a 6-digit code from your authenticator app.', 'error');
			return;
		}
		verifying = true;
		try {
			const supabase = await getSupabase();
			const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
				factorId
			});
			if (challengeError) {
				addToast(challengeError.message, 'error');
				return;
			}
			const { error: verifyError } = await supabase.auth.mfa.verify({
				factorId,
				challengeId: challengeData.id,
				code: verifyCode
			});
			if (verifyError) {
				addToast(verifyError.message, 'error');
				return;
			}
			addToast('Two-factor authentication enabled.', 'success');
			qrCode = '';
			secret = '';
			factorId = '';
			verifyCode = '';
			await invalidateAll();
		} catch {
			addToast('Verification failed.', 'error');
		} finally {
			verifying = false;
		}
	}

	async function unenroll() {
		try {
			const supabase = await getSupabase();
			const { error } = await supabase.auth.mfa.unenroll({ factorId: unenrollFactorId });
			if (error) {
				addToast(error.message, 'error');
				return;
			}
			addToast('Two-factor authentication removed.', 'success');
			unenrollOpen = false;
			unenrollFactorId = '';
			await invalidateAll();
		} catch {
			addToast('Failed to remove 2FA.', 'error');
		}
	}

	function cancelEnroll() {
		qrCode = '';
		secret = '';
		factorId = '';
		verifyCode = '';
	}

	const verifiedFactors = $derived(data.factors.filter((f) => f.status === 'verified'));
	const hasVerifiedFactor = $derived(verifiedFactors.length > 0);
</script>

<svelte:head>
	<title>Two-Factor Authentication — Polyglot</title>
</svelte:head>

<PageHeader
	title="Two-Factor Authentication"
	subtitle="Add an extra layer of security to your account"
	breadcrumbs={[
		{ label: 'App', href: '/app/dashboard' },
		{ label: 'Settings', href: '/app/settings' },
		{ label: '2FA' }
	]}
/>

<div class="space-y-6">
	<!-- Status -->
	<Card>
		<div class="flex items-center justify-between">
			<div>
				<h2 class="text-lg font-semibold text-text-primary">Status</h2>
				<p class="mt-1 text-sm text-text-secondary">
					{hasVerifiedFactor
						? 'Your account is protected with two-factor authentication.'
						: 'Two-factor authentication is not enabled.'}
				</p>
			</div>
			<Badge variant={hasVerifiedFactor ? 'success' : 'warning'}>
				{hasVerifiedFactor ? 'Enabled' : 'Disabled'}
			</Badge>
		</div>
	</Card>

	<!-- Active factors -->
	{#if verifiedFactors.length > 0}
		<Card>
			<h2 class="text-lg font-semibold text-text-primary">Active Factors</h2>
			<div class="mt-4 divide-y divide-border">
				{#each verifiedFactors as factor}
					<div class="flex items-center justify-between py-3">
						<div>
							<p class="text-sm font-medium text-text-primary">
								{factor.friendly_name ?? 'Authenticator app'}
							</p>
							<p class="text-xs text-text-tertiary">
								Added {new Date(factor.created_at).toLocaleDateString()}
							</p>
						</div>
						<Button
							variant="danger"
							size="sm"
							onclick={() => {
								unenrollFactorId = factor.id;
								unenrollOpen = true;
							}}
						>
							Remove
						</Button>
					</div>
				{/each}
			</div>
		</Card>
	{/if}

	<!-- Enrollment -->
	{#if !qrCode}
		{#if !hasVerifiedFactor}
			<Card>
				<h2 class="text-lg font-semibold text-text-primary">Set Up Authenticator</h2>
				<p class="mt-1 text-sm text-text-secondary">
					Use an authenticator app like Google Authenticator, Authy, or 1Password to generate
					time-based one-time codes.
				</p>
				<div class="mt-4">
					<Button onclick={startEnroll} loading={enrolling}>Enable 2FA</Button>
				</div>
			</Card>
		{/if}
	{:else}
		<Card>
			<h2 class="text-lg font-semibold text-text-primary">Scan QR Code</h2>
			<p class="mt-1 text-sm text-text-secondary">
				Scan this QR code with your authenticator app, then enter the 6-digit code below.
			</p>

			<div class="mt-6 flex flex-col items-center gap-6">
				<div class="rounded-xl border border-border bg-white p-4">
					<img src={qrCode} alt="MFA QR Code" class="h-48 w-48" />
				</div>

				<div class="w-full max-w-sm">
					<p class="text-xs text-text-tertiary mb-2">Can't scan? Enter this key manually:</p>
					<code
						class="block rounded-lg bg-surface-tertiary px-3 py-2 text-xs font-mono text-text-secondary break-all"
					>
						{secret}
					</code>
				</div>

				<div class="w-full max-w-sm space-y-4">
					<Input
						label="Verification code"
						bind:value={verifyCode}
						placeholder="000000"
						maxlength={6}
						autocomplete="one-time-code"
					/>
					<div class="flex gap-3">
						<Button onclick={verifyEnrollment} loading={verifying}>Verify & Enable</Button>
						<Button variant="secondary" onclick={cancelEnroll}>Cancel</Button>
					</div>
				</div>
			</div>
		</Card>
	{/if}

	<div class="text-center">
		<a href="/app/settings" class="text-sm text-brand-600 hover:text-brand-700 transition-colors">
			Back to settings
		</a>
	</div>
</div>

<ConfirmModal
	bind:open={unenrollOpen}
	title="Remove two-factor authentication"
	message="This will remove 2FA from your account. You can set it up again later."
	confirmLabel="Remove 2FA"
	onconfirm={unenroll}
	oncancel={() => {
		unenrollFactorId = '';
	}}
/>
