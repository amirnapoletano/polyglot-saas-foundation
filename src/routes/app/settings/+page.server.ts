import { redirect, error, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { logActivity } from '$lib/server/audit';

export const load: PageServerLoad = async ({ locals, parent }) => {
	const parentData = await parent();

	const orgId = parentData.activeOrgId;
	if (!orgId) throw redirect(303, '/onboarding');

	const { data: org, error: orgError } = await locals.supabase
		.from('organizations')
		.select('id, name, created_by, created_at')
		.eq('id', orgId)
		.maybeSingle();

	if (orgError) throw error(500, orgError.message);

	return {
		org,
		currentUserRole: parentData.org?.role
	};
};

export const actions: Actions = {
	updateAvatar: async ({ request, locals }) => {
		const { user } = await locals.safeGetSession();
		if (!user) throw redirect(303, '/login');

		const form = await request.formData();
		const file = form.get('avatar') as File | null;

		if (!file || file.size === 0) return fail(400, { avatarError: 'No file selected.' });
		if (file.size > 2 * 1024 * 1024) return fail(400, { avatarError: 'File must be under 2MB.' });

		const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
		if (!allowedTypes.includes(file.type)) {
			return fail(400, { avatarError: 'Invalid file type. Use JPG, PNG, WebP, or GIF.' });
		}

		const ext = file.name.split('.').pop() ?? 'jpg';
		const filePath = `${user.id}/avatar.${ext}`;

		const { error: uploadError } = await locals.supabase.storage
			.from('avatars')
			.upload(filePath, file, { upsert: true, contentType: file.type });

		if (uploadError) return fail(500, { avatarError: uploadError.message });

		const { data: { publicUrl } } = locals.supabase.storage
			.from('avatars')
			.getPublicUrl(filePath);

		const { error: updateError } = await locals.supabase
			.from('profiles')
			.update({ avatar_url: publicUrl })
			.eq('id', user.id);

		if (updateError) return fail(500, { avatarError: updateError.message });
		return { avatarSuccess: true };
	},

	updateProfile: async ({ request, locals }) => {
		const { user } = await locals.safeGetSession();
		if (!user) throw redirect(303, '/login');

		const form = await request.formData();
		const displayName = String(form.get('display_name') || '').trim();

		if (displayName.length > 100) return fail(400, { profileError: 'Display name too long.' });

		const { error: updateError } = await locals.supabase
			.from('profiles')
			.update({ display_name: displayName || null })
			.eq('id', user.id);

		if (updateError) return fail(500, { profileError: updateError.message });
		return { profileSuccess: true };
	},

	renameOrg: async ({ request, locals }) => {
		const { user } = await locals.safeGetSession();
		if (!user) throw redirect(303, '/login');

		const form = await request.formData();
		const orgId = String(form.get('org_id') || '').trim();
		const name = String(form.get('org_name') || '').trim();

		if (!orgId) return fail(400, { orgError: 'Missing organization.' });
		if (!name || name.length < 2) return fail(400, { orgError: 'Name must be at least 2 characters.' });
		if (name.length > 60) return fail(400, { orgError: 'Name must be under 60 characters.' });

		// Verify user is owner/admin
		const { data: membership } = await locals.supabase
			.from('organization_members')
			.select('role')
			.eq('organization_id', orgId)
			.eq('user_id', user.id)
			.maybeSingle();

		if (!membership || !membership.role || !['owner', 'admin'].includes(membership.role)) {
			return fail(403, { orgError: 'Only owners and admins can rename.' });
		}

		const { error: updateError } = await locals.supabase
			.from('organizations')
			.update({ name })
			.eq('id', orgId);

		if (updateError) return fail(500, { orgError: updateError.message });

		await logActivity(locals.supabase, {
			organizationId: orgId,
			actorUserId: user.id,
			action: 'org.renamed',
			resourceType: 'organization',
			resourceId: orgId,
			metadata: { name }
		});

		return { orgSuccess: true };
	},

	deleteOrg: async ({ request, locals }) => {
		const { user } = await locals.safeGetSession();
		if (!user) throw redirect(303, '/login');

		const form = await request.formData();
		const orgId = String(form.get('org_id') || '').trim();

		if (!orgId) return fail(400, { deleteError: 'Missing organization.' });

		// Verify user is owner
		const { data: membership } = await locals.supabase
			.from('organization_members')
			.select('role')
			.eq('organization_id', orgId)
			.eq('user_id', user.id)
			.maybeSingle();

		if (!membership || membership.role !== 'owner') {
			return fail(403, { deleteError: 'Only the owner can delete this workspace.' });
		}

		// Delete org (cascades to members, billing, invites via FK)
		const { error: deleteError } = await locals.supabase
			.from('organizations')
			.delete()
			.eq('id', orgId);

		if (deleteError) return fail(500, { deleteError: deleteError.message });

		await logActivity(locals.supabase, {
			organizationId: orgId,
			actorUserId: user.id,
			action: 'org.deleted',
			resourceType: 'organization',
			resourceId: orgId
		});

		// Clear active_org_id
		await locals.supabase
			.from('profiles')
			.update({ active_org_id: null })
			.eq('id', user.id);

		// Check if user has other orgs
		const { data: remaining } = await locals.supabase
			.from('organization_members')
			.select('organization_id')
			.eq('user_id', user.id)
			.limit(1);

		if (remaining && remaining.length > 0) {
			await locals.supabase
				.from('profiles')
				.update({ active_org_id: remaining[0].organization_id })
				.eq('id', user.id);
			throw redirect(303, '/app/dashboard');
		}

		throw redirect(303, '/onboarding');
	},

	leaveOrg: async ({ request, locals }) => {
		const { user } = await locals.safeGetSession();
		if (!user) throw redirect(303, '/login');

		const form = await request.formData();
		const orgId = String(form.get('org_id') || '').trim();

		if (!orgId) return fail(400, { leaveError: 'Missing organization.' });

		// Can't leave if owner
		const { data: membership } = await locals.supabase
			.from('organization_members')
			.select('role')
			.eq('organization_id', orgId)
			.eq('user_id', user.id)
			.maybeSingle();

		if (!membership) return fail(400, { leaveError: 'Not a member.' });
		if (membership.role === 'owner') {
			return fail(400, { leaveError: 'Owners cannot leave. Transfer ownership or delete the workspace.' });
		}

		const { error: deleteError } = await locals.supabase
			.from('organization_members')
			.delete()
			.eq('organization_id', orgId)
			.eq('user_id', user.id);

		if (deleteError) return fail(500, { leaveError: deleteError.message });

		await logActivity(locals.supabase, {
			organizationId: orgId,
			actorUserId: user.id,
			action: 'member.removed',
			resourceType: 'user',
			resourceId: user.id,
			metadata: { reason: 'left' }
		});

		// Clear active_org_id and redirect
		await locals.supabase
			.from('profiles')
			.update({ active_org_id: null })
			.eq('id', user.id);

		const { data: remaining } = await locals.supabase
			.from('organization_members')
			.select('organization_id')
			.eq('user_id', user.id)
			.limit(1);

		if (remaining && remaining.length > 0) {
			await locals.supabase
				.from('profiles')
				.update({ active_org_id: remaining[0].organization_id })
				.eq('id', user.id);
			throw redirect(303, '/app/dashboard');
		}

		throw redirect(303, '/onboarding');
	}
};
