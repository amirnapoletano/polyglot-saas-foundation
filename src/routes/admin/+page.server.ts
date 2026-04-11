import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const [usersResult, orgsResult, billingResult] = await Promise.all([
		locals.supabase.from('profiles').select('id', { count: 'exact', head: true }),
		locals.supabase.from('organizations').select('id', { count: 'exact', head: true }),
		locals.supabase.from('org_billing').select('organization_id, status')
	]);

	const billing = billingResult.data ?? [];
	const activeSubscriptions = billing.filter((b) => b.status === 'active').length;

	return {
		totalUsers: usersResult.count ?? 0,
		totalOrgs: orgsResult.count ?? 0,
		activeSubscriptions,
		totalBilling: billing.length
	};
};
