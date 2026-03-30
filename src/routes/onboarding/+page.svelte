<script lang="ts">
	import { enhance } from '$app/forms';
	import AuthLayout from '$lib/components/AuthLayout.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Input from '$lib/components/ui/Input.svelte';

	type Data = { profile?: any };
	type Form = { message?: string };

	let { data, form } = $props<{ data: Data; form?: Form }>();

	let workspace = $state('');
</script>

<svelte:head>
	<title>Create Workspace — Polyglot</title>
</svelte:head>

<AuthLayout title="Create your workspace" subtitle="Pick a name for your first organization">
	<form method="POST" action="?/createWorkspace" use:enhance class="flex flex-col gap-4">
		<Input
			label="Workspace name"
			name="workspace_name"
			bind:value={workspace}
			required
			minlength={2}
			maxlength={60}
			placeholder="My Company"
		/>

		{#if form?.message}
			<p class="text-sm text-red-600">{form.message}</p>
		{/if}

		<Button type="submit" class="w-full mt-2">Create workspace</Button>
	</form>
</AuthLayout>
