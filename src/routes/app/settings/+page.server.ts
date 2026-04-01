import { redirect, error, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { logActivity } from '$lib/server/audit';
import { supabaseServiceClient } from '$lib/server/supabase';

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

		const {
			data: { publicUrl }
		} = locals.supabase.storage.from('avatars').getPublicUrl(filePath);

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

	changeEmail: async ({ request, locals }) => {
		const { user } = await locals.safeGetSession();
		if (!user) throw redirect(303, '/login');

		const form = await request.formData();
		const newEmail = String(form.get('new_email') || '').trim();

		if (!newEmail) return fail(400, { emailError: 'Email is required.' });
		if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail))
			return fail(400, { emailError: 'Invalid email address.' });
		if (newEmail === user.email) return fail(400, { emailError: 'This is already your email.' });

		const { error: updateError } = await locals.supabase.auth.updateUser({ email: newEmail });
		if (updateError) return fail(500, { emailError: updateError.message });

		return { emailSuccess: true };
	},

	changePassword: async ({ request, locals }) => {
		const { user } = await locals.safeGetSession();
		if (!user) throw redirect(303, '/login');

		const form = await request.formData();
		const newPassword = String(form.get('new_password') || '');
		const confirmPassword = String(form.get('confirm_password') || '');

		if (!newPassword) return fail(400, { passwordError: 'Password is required.' });
		if (newPassword.length < 8)
			return fail(400, { passwordError: 'Password must be at least 8 characters.' });
		if (newPassword !== confirmPassword)
			return fail(400, { passwordError: 'Passwords do not match.' });

		const { error: updateError } = await locals.supabase.auth.updateUser({ password: newPassword });
		if (updateError) return fail(500, { passwordError: updateError.message });

		return { passwordSuccess: true };
	},

	renameOrg: async ({ request, locals }) => {
		const { user } = await locals.safeGetSession();
		if (!user) throw redirect(303, '/login');

		const form = await request.formData();
		const orgId = String(form.get('org_id') || '').trim();
		const name = String(form.get('org_name') || '').trim();

		if (!orgId) return fail(400, { orgError: 'Missing organization.' });
		if (!name || name.length < 2)
			return fail(400, { orgError: 'Name must be at least 2 characters.' });
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
		await locals.supabase.from('profiles').update({ active_org_id: null }).eq('id', user.id);

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
			return fail(400, {
				leaveError: 'Owners cannot leave. Transfer ownership or delete the workspace.'
			});
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
		await locals.supabase.from('profiles').update({ active_org_id: null }).eq('id', user.id);

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

	deleteAccount: async ({ locals }) => {
		const { user } = await locals.safeGetSession();
		if (!user) throw redirect(303, '/login');

		// Check if user is sole owner of any org
		const { data: memberships } = await locals.supabase
			.from('organization_members')
			.select('organization_id, role')
			.eq('user_id', user.id);

		if (memberships) {
			for (const m of memberships) {
				if (m.role === 'owner' && m.organization_id) {
					const { count } = await locals.supabase
						.from('organization_members')
						.select('*', { count: 'exact', head: true })
						.eq('organization_id', m.organization_id)
						.eq('role', 'owner');

					if (count === 1) {
						return fail(400, {
							accountError:
								'You are the sole owner of a workspace. Transfer ownership or delete the workspace first.'
						});
					}
				}
			}

			// Remove from all orgs
			await locals.supabase.from('organization_members').delete().eq('user_id', user.id);
		}

		// Delete profile
		await locals.supabase.from('profiles').delete().eq('id', user.id);

		// Delete auth user via service role
		const serviceClient = await supabaseServiceClient();
		const { error: deleteError } = await serviceClient.auth.admin.deleteUser(user.id);
		if (deleteError) return fail(500, { accountError: deleteError.message });

		// Sign out and redirect
		await locals.supabase.auth.signOut();
		throw redirect(303, '/');
	}
};
