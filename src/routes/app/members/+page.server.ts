import { redirect } from '@sveltejs/kit';

export const load = async ({ locals: { supabase, user } }) => {
  if (!user) throw redirect(302, '/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('active_org_id')
    .eq('id', user.id)
    .single();

  const orgId = profile?.active_org_id;

  const { data: members } = await supabase
    .from('organization_members')
    .select(`
      id,
      role,
      profiles (
        id,
        email,
        display_name
      )
    `)
    .eq('organization_id', orgId);

  const { data: invites } = await supabase
    .from('org_invites')
    .select('*')
    .eq('organization_id', orgId)
    .is('accepted_at', null);

  return {
    members,
    invites
  };
};