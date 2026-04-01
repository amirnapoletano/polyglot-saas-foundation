import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const { data: factorData } = await locals.supabase.auth.mfa.listFactors();

	return {
		factors: factorData?.totp ?? []
	};
};
