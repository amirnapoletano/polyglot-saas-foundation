<script lang="ts">
	let { data } = $props();
</script>

<svelte:head>
	<title>Polyglot SaaS Foundation — Ship Your SaaS in Days</title>
	<meta
		name="description"
		content="Production-ready SaaS starter kit with auth, billing, teams, and multi-org. Built on SvelteKit 2, Svelte 5, Supabase, and Stripe. Skip weeks of boilerplate."
	/>
	<meta property="og:type" content="website" />
	<meta property="og:title" content="Polyglot SaaS Foundation — Ship Your SaaS in Days" />
	<meta
		property="og:description"
		content="Auth, billing, teams, multi-org — all wired up and working. Stop rebuilding the same infrastructure and start building your product."
	/>
	<meta property="og:url" content="https://yourdomain.com" />
	<meta property="og:image" content="https://yourdomain.com/og-image.png" />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content="Polyglot SaaS Foundation — Ship Your SaaS in Days" />
	<meta
		name="twitter:description"
		content="Auth, billing, teams, multi-org — all wired up and working. Stop rebuilding infrastructure. Start building your product."
	/>
	<meta name="twitter:image" content="https://yourdomain.com/og-image.png" />
</svelte:head>

<div class="min-h-screen bg-surface">
	<!-- Nav -->
	<nav class="border-b border-border">
		<div class="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
			<span class="text-xl font-bold text-text-primary">Polyglot</span>
			<div class="flex items-center gap-3">
				{#if data.session}
					<a
						href="/app/dashboard"
						class="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 transition-colors"
					>
						Go to Dashboard
					</a>
				{:else}
					<a
						href="/login"
						class="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
						>Log in</a
					>
					<a
						href="/signup"
						class="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 transition-colors"
					>
						Get Started
					</a>
				{/if}
			</div>
		</div>
	</nav>

	<!-- Hero -->
	<section class="mx-auto max-w-4xl px-6 pt-24 pb-20 text-center">
		<div
			class="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-surface-secondary px-4 py-1.5 text-sm text-text-secondary"
		>
			<span class="inline-block h-2 w-2 rounded-full bg-success"></span>
			Production-ready SaaS starter
		</div>
		<h1 class="text-5xl font-bold tracking-tight text-text-primary leading-tight sm:text-6xl">
			Ship your SaaS<br />in days, not months
		</h1>
		<p class="mx-auto mt-6 max-w-2xl text-lg text-text-secondary leading-relaxed">
			Auth, billing, teams, multi-org — all wired up and working. Stop rebuilding the same
			infrastructure and start building your product.
		</p>
		<div class="mt-10 flex items-center justify-center gap-4">
			<a
				href="/signup"
				class="rounded-lg bg-brand-600 px-6 py-3 text-base font-medium text-white hover:bg-brand-700 transition-colors shadow-sm"
			>
				Start Building
			</a>
			<a
				href="#features"
				class="rounded-lg border border-border bg-surface px-6 py-3 text-base font-medium text-text-primary hover:bg-surface-secondary transition-colors"
			>
				See What's Included
			</a>
		</div>
	</section>

	<!-- Tech stack bar -->
	<div class="border-y border-border bg-surface-secondary py-6">
		<div
			class="mx-auto flex max-w-4xl flex-wrap items-center justify-center gap-x-10 gap-y-3 px-6 text-sm font-medium text-text-secondary"
		>
			<span>SvelteKit 2</span>
			<span class="text-border">|</span>
			<span>Svelte 5</span>
			<span class="text-border">|</span>
			<span>TypeScript</span>
			<span class="text-border">|</span>
			<span>Supabase</span>
			<span class="text-border">|</span>
			<span>Stripe</span>
			<span class="text-border">|</span>
			<span>Tailwind v4</span>
		</div>
	</div>

	<!-- Features -->
	<section id="features" class="mx-auto max-w-6xl px-6 py-24">
		<div class="text-center mb-16">
			<h2 class="text-3xl font-bold text-text-primary">Everything you need to launch</h2>
			<p class="mt-3 text-text-secondary">
				Stop wiring up boilerplate. Start with a complete foundation.
			</p>
		</div>

		<div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
			{#each [{ title: 'Authentication', desc: 'Email/password auth with Supabase. Signup, login, logout, password reset — all server-validated.', icon: '🔐' }, { title: 'Stripe Billing', desc: 'Checkout, webhooks, customer portal, plan gating. Per-org subscriptions with free/pro tiers.', icon: '💳' }, { title: 'Multi-Org / Teams', desc: 'Users belong to multiple orgs. Org switching, role-based access, active workspace persistence.', icon: '🏢' }, { title: 'Team Invites', desc: 'Invite members by email with token-based links. Seat limits, duplicate checking, role assignment.', icon: '✉️' }, { title: 'Onboarding Flow', desc: 'Post-signup workspace creation with guided flow. Auto-creates org, membership, and sets active state.', icon: '🚀' }, { title: 'Usage Limits', desc: 'Plan-based seat limits and project quotas. Free: 3 seats, 3 projects. Pro: 10 seats, unlimited.', icon: '📊' }] as feature}
				<div
					class="rounded-xl border border-border bg-surface p-6 hover:shadow-md transition-shadow"
				>
					<div class="text-2xl mb-3">{feature.icon}</div>
					<h3 class="text-lg font-semibold text-text-primary">{feature.title}</h3>
					<p class="mt-2 text-sm text-text-secondary leading-relaxed">{feature.desc}</p>
				</div>
			{/each}
		</div>
	</section>

	<!-- Code structure preview -->
	<section class="border-y border-border bg-surface-secondary py-24">
		<div class="mx-auto max-w-4xl px-6">
			<div class="text-center mb-12">
				<h2 class="text-3xl font-bold text-text-primary">Clean, opinionated architecture</h2>
				<p class="mt-3 text-text-secondary">
					Every file has a purpose. Every pattern is intentional.
				</p>
			</div>

			<div class="grid gap-8 md:grid-cols-2">
				<div>
					<h3 class="text-lg font-semibold text-text-primary mb-4">What you get</h3>
					<ul class="space-y-3 text-sm text-text-secondary">
						{#each ['Server-side auth guards on every protected route', 'Per-request Supabase client (cookie-based SSR)', 'Org-scoped data loading in layout server', 'Stripe webhook with idempotent billing sync', 'Reusable UI components (Button, Input, Card, Badge, Toast)', 'Type-safe server/client data flow'] as item}
							<li class="flex items-start gap-2">
								<span class="mt-0.5 text-success">&#10003;</span>
								<span>{item}</span>
							</li>
						{/each}
					</ul>
				</div>
				<div>
					<h3 class="text-lg font-semibold text-text-primary mb-4">Ready to extend</h3>
					<ul class="space-y-3 text-sm text-text-secondary">
						{#each ['Clone and rename — works out of the box', 'Add your domain models scoped by org', 'Swap Stripe price IDs for your own plans', 'Customize seat limits and usage quotas', 'Add pages to the app shell with auth built-in', 'Deploy to Vercel, Netlify, or anywhere'] as item}
							<li class="flex items-start gap-2">
								<span class="mt-0.5 text-success">&#10003;</span>
								<span>{item}</span>
							</li>
						{/each}
					</ul>
				</div>
			</div>
		</div>
	</section>

	<!-- CTA -->
	<section class="mx-auto max-w-4xl px-6 py-24 text-center">
		<h2 class="text-3xl font-bold text-text-primary">Ready to build?</h2>
		<p class="mt-3 text-text-secondary">
			Get the foundation and start shipping your SaaS product today.
		</p>
		<div class="mt-8">
			<a
				href="/signup"
				class="inline-block rounded-lg bg-brand-600 px-8 py-3 text-base font-medium text-white hover:bg-brand-700 transition-colors shadow-sm"
			>
				Get Started Free
			</a>
		</div>
	</section>

	<!-- Footer -->
	<footer class="border-t border-border py-8">
		<div
			class="mx-auto max-w-6xl px-6 flex items-center justify-between text-sm text-text-tertiary"
		>
			<span>Polyglot SaaS Foundation</span>
			<div class="flex items-center gap-4">
				<a href="/terms" class="hover:text-text-secondary transition-colors">Terms</a>
				<a href="/privacy" class="hover:text-text-secondary transition-colors">Privacy</a>
			</div>
		</div>
	</footer>
</div>
