<script lang="ts">
	interface Props {
		name: string | null;
		src?: string | null;
		size?: 'sm' | 'md' | 'lg';
		class?: string;
	}

	let { name, src = null, size = 'md', class: className = '' }: Props = $props();
	let imgError = $state(false);

	const initials = $derived(
		(name || '?')
			.split(' ')
			.map((w) => w[0])
			.join('')
			.slice(0, 2)
			.toUpperCase()
	);

	const sizes: Record<string, string> = {
		sm: 'w-7 h-7 text-xs',
		md: 'w-9 h-9 text-sm',
		lg: 'w-11 h-11 text-base'
	};

	const colors = [
		'bg-brand-100 text-brand-700',
		'bg-emerald-100 text-emerald-700',
		'bg-amber-100 text-amber-700',
		'bg-rose-100 text-rose-700',
		'bg-cyan-100 text-cyan-700',
		'bg-violet-100 text-violet-700'
	];

	const colorIndex = $derived(
		(name || '').split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % colors.length
	);
</script>

{#if src && !imgError}
	<img
		{src}
		alt={name ?? 'Avatar'}
		class="inline-flex items-center justify-center rounded-full object-cover shrink-0 {sizes[size]} {className}"
		onerror={() => (imgError = true)}
	/>
{:else}
	<div
		class="inline-flex items-center justify-center rounded-full font-medium shrink-0 {sizes[size]} {colors[colorIndex]} {className}"
	>
		{initials}
	</div>
{/if}
