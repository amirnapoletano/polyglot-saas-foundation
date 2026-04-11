export type Permission =
	| 'members.invite'
	| 'members.remove'
	| 'members.change_role'
	| 'billing.manage'
	| 'api_keys.manage'
	| 'webhooks.manage'
	| 'org.rename'
	| 'org.delete'
	| 'activity.view';

type Role = 'owner' | 'admin' | 'member';

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
	owner: [
		'members.invite',
		'members.remove',
		'members.change_role',
		'billing.manage',
		'api_keys.manage',
		'webhooks.manage',
		'org.rename',
		'org.delete',
		'activity.view'
	],
	admin: [
		'members.invite',
		'members.remove',
		'api_keys.manage',
		'webhooks.manage',
		'activity.view'
	],
	member: ['activity.view']
};

export function hasPermission(role: string, permission: Permission): boolean {
	const perms = ROLE_PERMISSIONS[role as Role];
	if (!perms) return false;
	return perms.includes(permission);
}

export function getPermissions(role: string): Permission[] {
	return ROLE_PERMISSIONS[role as Role] ?? [];
}

export function requirePermission(role: string, permission: Permission): void {
	if (!hasPermission(role, permission)) {
		throw new Error(`Missing permission: ${permission}`);
	}
}
