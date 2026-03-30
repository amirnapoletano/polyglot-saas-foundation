<script lang="ts">
	import { navigating } from '$app/stores';
	import { fade } from 'svelte/transition';
</script>

{#if $navigating}
	<div class="fixed inset-x-0 top-0 z-[60] h-0.5" transition:fade={{ duration: 100 }}>
		<div class="h-full w-full bg-brand-500 animate-progress origin-left"></div>
	</div>
{/if}

<style>
	@keyframes progress {
		0% { transform: scaleX(0); }
		50% { transform: scaleX(0.7); }
		100% { transform: scaleX(1); }
	}
	.animate-progress {
		animation: progress 2s ease-in-out infinite;
	}
</style>
