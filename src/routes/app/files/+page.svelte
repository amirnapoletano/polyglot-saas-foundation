<script lang="ts">
	import { enhance } from '$app/forms';
	import Card from '$lib/components/ui/Card.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import PageHeader from '$lib/components/ui/PageHeader.svelte';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';
	import { addToast } from '$lib/stores/toast';

	let { data, form } = $props();

	const canManage = data.currentUserRole === 'owner' || data.currentUserRole === 'admin';
	const uploaderNames = data.uploaderNames ?? {};

	$effect(() => {
		if (form?.success) addToast('File uploaded.', 'success');
		if (form?.message) addToast(form.message, 'error');
	});

	function formatSize(bytes: number): string {
		if (bytes < 1024) return `${bytes} B`;
		if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
		return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
	}

	function formatDate(d: string): string {
		return new Date(d).toLocaleDateString();
	}

	function getFileIcon(mimeType: string | null): string {
		if (!mimeType) return '📄';
		if (mimeType.startsWith('image/')) return '🖼️';
		if (mimeType.startsWith('video/')) return '🎬';
		if (mimeType.includes('pdf')) return '📕';
		if (mimeType.includes('spreadsheet') || mimeType.includes('csv')) return '📊';
		if (mimeType.includes('zip') || mimeType.includes('archive')) return '📦';
		return '📄';
	}
</script>

<svelte:head>
	<title>Files — Polyglot</title>
</svelte:head>

<div class="space-y-8">
	<PageHeader
		title="Files"
		subtitle="Upload and manage files for your workspace"
		breadcrumbs={[{ label: 'App', href: '/app/dashboard' }, { label: 'Files' }]}
	/>

	{#if canManage}
		<Card>
			<h2 class="text-lg font-semibold text-text-primary mb-4">Upload File</h2>
			<form method="POST" action="?/upload" enctype="multipart/form-data" use:enhance>
				<div class="flex gap-3 items-end flex-wrap">
					<div class="flex-1 min-w-[240px]">
						<label for="file-upload" class="block text-sm font-medium text-text-primary mb-1.5">Choose file</label>
						<input
							id="file-upload"
							name="file"
							type="file"
							required
							class="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary file:mr-4 file:rounded-lg file:border-0 file:bg-brand-50 file:px-4 file:py-1.5 file:text-sm file:font-medium file:text-brand-700 hover:file:bg-brand-100"
						/>
					</div>
					<Button type="submit">Upload</Button>
				</div>
				<p class="mt-2 text-xs text-text-tertiary">Max file size: 10 MB</p>
			</form>
		</Card>
	{/if}

	<Card>
		<h2 class="text-lg font-semibold text-text-primary mb-4">All Files</h2>
		{#if data.files.length === 0}
			<EmptyState
				icon="📁"
				title="No files yet"
				description="Upload your first file to get started."
			/>
		{:else}
			<div class="divide-y divide-border">
				{#each data.files as file}
					<div class="flex items-center justify-between py-3">
						<div class="flex items-center gap-3 min-w-0">
							<span class="text-xl">{getFileIcon(file.mime_type)}</span>
							<div class="min-w-0">
								<p class="text-sm font-medium text-text-primary truncate">{file.name}</p>
								<p class="text-xs text-text-tertiary">
									{formatSize(file.size_bytes)} · {formatDate(file.created_at)}
									{#if file.uploaded_by && uploaderNames[file.uploaded_by]}
										· {uploaderNames[file.uploaded_by]}
									{/if}
								</p>
							</div>
						</div>
						<div class="flex items-center gap-2 shrink-0 ml-4">
							<Badge>{file.mime_type?.split('/').pop() ?? 'file'}</Badge>
							{#if canManage}
								<form method="POST" action="?/delete" use:enhance>
									<input type="hidden" name="id" value={file.id} />
									<input type="hidden" name="storage_path" value={file.storage_path} />
									<Button type="submit" variant="danger" size="sm">Delete</Button>
								</form>
							{/if}
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</Card>
</div>
