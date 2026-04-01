export async function getUserOrganizations(locals: App.Locals, userId: string) {
	const { data: memberships, error } = await locals.supabase
		.from('organization_members')
		.select(
			`
      organization_id,
      role,
      organizations (
        id,
        name
      )
    `
		)
		.eq('user_id', userId);

	if (error) {
		throw error;
	}

	return (memberships ?? []).map((membership) => ({
		organization_id: membership.organization_id,
		role: membership.role,
		organization: Array.isArray(membership.organizations)
			? membership.organizations[0]
			: membership.organizations
	}));
}
