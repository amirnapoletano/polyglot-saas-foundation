<script lang="ts">
	import { toasts, dismissToast } from '$lib/stores/toast';
	import { fly, fade } from 'svelte/transition';
</script>

{#if $toasts.length > 0}
	<div class="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
		{#each $toasts as toast (toast.id)}
			<button
				in:fly={{ y: 20, duration: 200 }}
				out:fade={{ duration: 150 }}
				class="flex items-start gap-3 rounded-lg border px-4 py-3 shadow-lg text-sm text-left cursor-pointer
					{toast.type === 'success'
					? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950 dark:border-emerald-800 dark:text-emerald-200'
					: ''}
					{toast.type === 'error'
					? 'bg-red-50 border-red-200 text-red-800 dark:bg-red-950 dark:border-red-800 dark:text-red-200'
					: ''}
					{toast.type === 'warning'
					? 'bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-950 dark:border-amber-800 dark:text-amber-200'
					: ''}
					{toast.type === 'info'
					? 'bg-white border-gray-200 text-gray-800 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-200'
					: ''}"
				onclick={() => dismissToast(toast.id)}
			>
				<span class="flex-1">{toast.message}</span>
				<span class="text-current opacity-40 hover:opacity-70">&times;</span>
			</button>
		{/each}
	</div>
{/if}
