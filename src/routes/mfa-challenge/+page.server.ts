import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals }) => {
	const {
		data: { user }
	} = await locals.supabase.auth.getUser();

	if (!user) {
		throw redirect(303, '/login');
	}

	// Check if user actually has MFA factors
	const { data: factorData } = await locals.supabase.auth.mfa.listFactors();
	const verifiedFactors = factorData?.totp?.filter((f) => f.status === 'verified') ?? [];

	if (verifiedFactors.length === 0) {
		// No MFA factors — skip challenge
		throw redirect(303, '/app/dashboard');
	}

	return {
		factorId: verifiedFactors[0].id
	};
};
