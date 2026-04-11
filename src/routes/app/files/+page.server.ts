import type { Actions, PageServerLoad } from './$types';
import { fail, redirect } from '@sveltejs/kit';

async function getOrgId(locals: App.Locals): Promise<{ orgId: string; userId: string }> {
	const { session, user } = await locals.safeGetSession();
	if (!session || !user) throw redirect(302, '/login');

	const { data: profile } = await locals.supabase
		.from('profiles')
		.select('active_org_id')
		.eq('id', user.id)
		.maybeSingle();

	const orgId = profile?.active_org_id;
	if (!orgId) throw redirect(302, '/onboarding');
	return { orgId, userId: user.id };
}

export const load: PageServerLoad = async ({ parent, locals }) => {
	const parentData = await parent();
	const orgId = parentData.org?.id;
	if (!orgId) return { files: [] };

	const { data: files } = await locals.supabase
		.from('files')
		.select('id, name, storage_path, size_bytes, mime_type, uploaded_by, created_at')
		.eq('organization_id', orgId)
		.order('created_at', { ascending: false });

	const uploaderIds = [
		...new Set((files ?? []).map((f) => f.uploaded_by).filter((id): id is string => id != null))
	];
	let uploaderNames: Record<string, string> = {};
	if (uploaderIds.length > 0) {
		const { data: profiles } = await locals.supabase
			.from('profiles')
			.select('id, display_name, email')
			.in('id', uploaderIds);
		if (profiles) {
			uploaderNames = Object.fromEntries(
				profiles.map((p) => [p.id, p.display_name ?? p.email ?? 'Unknown'])
			);
		}
	}

	return {
		files: files ?? [],
		uploaderNames,
		currentUserRole: parentData.org?.role
	};
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export const actions: Actions = {
	upload: async ({ request, locals }) => {
		const { orgId, userId } = await getOrgId(locals);

		const form = await request.formData();
		const file = form.get('file') as File | null;

		if (!file || file.size === 0) return fail(400, { message: 'No file selected.' });
		if (file.size > MAX_FILE_SIZE) return fail(400, { message: 'File too large. Max 10MB.' });

		const ext = file.name.split('.').pop() ?? '';
		const storagePath = `${orgId}/${crypto.randomUUID()}.${ext}`;

		const { error: uploadError } = await locals.supabase.storage
			.from('org-files')
			.upload(storagePath, file, { contentType: file.type });

		if (uploadError) return fail(500, { message: uploadError.message });

		const { error: dbError } = await locals.supabase.from('files').insert({
			organization_id: orgId,
			name: file.name,
			storage_path: storagePath,
			size_bytes: file.size,
			mime_type: file.type || null,
			uploaded_by: userId
		});

		if (dbError) return fail(500, { message: dbError.message });

		return { success: true };
	},

	delete: async ({ request, locals }) => {
		await getOrgId(locals);
		const form = await request.formData();
		const id = String(form.get('id'));
		const storagePath = String(form.get('storage_path'));

		await locals.supabase.storage.from('org-files').remove([storagePath]);
		await locals.supabase.from('files').delete().eq('id', id);

		return { success: true };
	}
};
