<script lang="ts">
	import { fly, fade } from 'svelte/transition';
	import Button from './Button.svelte';

	interface Props {
		open: boolean;
		title: string;
		message: string;
		confirmLabel?: string;
		confirmVariant?: 'primary' | 'danger';
		requireInput?: string;
		onconfirm: () => void;
		oncancel: () => void;
	}

	let {
		open = $bindable(false),
		title,
		message,
		confirmLabel = 'Confirm',
		confirmVariant = 'danger',
		requireInput,
		onconfirm,
		oncancel
	}: Props = $props();

	let inputValue = $state('');
	const canConfirm = $derived(!requireInput || inputValue === requireInput);

	function handleConfirm() {
		if (!canConfirm) return;
		inputValue = '';
		onconfirm();
	}

	function handleCancel() {
		inputValue = '';
		open = false;
		oncancel();
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') handleCancel();
		if (e.key === 'Enter' && canConfirm) handleConfirm();
	}
</script>

{#if open}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center p-4"
		role="dialog"
		aria-modal="true"
		onkeydown={handleKeydown}
	>
		<!-- Backdrop -->
		<button
			class="absolute inset-0 bg-black/40 cursor-default"
			transition:fade={{ duration: 150 }}
			onclick={handleCancel}
			tabindex="-1"
		></button>

		<!-- Modal -->
		<div
			class="relative w-full max-w-md rounded-xl border border-border bg-surface p-6 shadow-xl"
			transition:fly={{ y: 10, duration: 200 }}
		>
			<h3 class="text-lg font-semibold text-text-primary">{title}</h3>
			<p class="mt-2 text-sm text-text-secondary">{message}</p>

			{#if requireInput}
				<div class="mt-4">
					<p class="text-sm text-text-secondary mb-2">
						Type <strong class="text-text-primary">{requireInput}</strong> to confirm:
					</p>
					<input
						bind:value={inputValue}
						class="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
						autocomplete="off"
					/>
				</div>
			{/if}

			<div class="mt-6 flex items-center justify-end gap-3">
				<Button variant="secondary" size="sm" onclick={handleCancel}>Cancel</Button>
				<Button variant={confirmVariant} size="sm" onclick={handleConfirm} disabled={!canConfirm}>
					{confirmLabel}
				</Button>
			</div>
		</div>
	</div>
{/if}
