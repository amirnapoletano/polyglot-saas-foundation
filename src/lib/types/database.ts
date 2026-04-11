export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
	// Allows to automatically instantiate createClient with right options
	// instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
	__InternalSupabase: {
		PostgrestVersion: '14.1';
	};
	public: {
		Tables: {
			api_keys: {
				Row: {
					created_at: string | null;
					created_by: string | null;
					expires_at: string | null;
					id: string;
					key_hash: string;
					key_prefix: string;
					last_used_at: string | null;
					name: string;
					organization_id: string;
					revoked_at: string | null;
					scopes: string[] | null;
				};
				Insert: {
					created_at?: string | null;
					created_by?: string | null;
					expires_at?: string | null;
					id?: string;
					key_hash: string;
					key_prefix: string;
					last_used_at?: string | null;
					name: string;
					organization_id: string;
					revoked_at?: string | null;
					scopes?: string[] | null;
				};
				Update: {
					created_at?: string | null;
					created_by?: string | null;
					expires_at?: string | null;
					id?: string;
					key_hash?: string;
					key_prefix?: string;
					last_used_at?: string | null;
					name?: string;
					organization_id?: string;
					revoked_at?: string | null;
					scopes?: string[] | null;
				};
				Relationships: [
					{
						foreignKeyName: 'api_keys_organization_id_fkey';
						columns: ['organization_id'];
						isOneToOne: false;
						referencedRelation: 'organizations';
						referencedColumns: ['id'];
					}
				];
			};
			audit_log: {
				Row: {
					action: string;
					actor_user_id: string | null;
					created_at: string | null;
					id: string;
					metadata: Json | null;
					organization_id: string;
					resource_id: string | null;
					resource_type: string | null;
				};
				Insert: {
					action: string;
					actor_user_id?: string | null;
					created_at?: string | null;
					id?: string;
					metadata?: Json | null;
					organization_id: string;
					resource_id?: string | null;
					resource_type?: string | null;
				};
				Update: {
					action?: string;
					actor_user_id?: string | null;
					created_at?: string | null;
					id?: string;
					metadata?: Json | null;
					organization_id?: string;
					resource_id?: string | null;
					resource_type?: string | null;
				};
				Relationships: [
					{
						foreignKeyName: 'audit_log_organization_id_fkey';
						columns: ['organization_id'];
						isOneToOne: false;
						referencedRelation: 'organizations';
						referencedColumns: ['id'];
					}
				];
			};
			org_billing: {
				Row: {
					cancel_at_period_end: boolean | null;
					current_period_end: string | null;
					organization_id: string;
					price_id: string | null;
					status: string | null;
					stripe_customer_id: string | null;
					stripe_subscription_id: string | null;
					updated_at: string | null;
				};
				Insert: {
					cancel_at_period_end?: boolean | null;
					current_period_end?: string | null;
					organization_id: string;
					price_id?: string | null;
					status?: string | null;
					stripe_customer_id?: string | null;
					stripe_subscription_id?: string | null;
					updated_at?: string | null;
				};
				Update: {
					cancel_at_period_end?: boolean | null;
					current_period_end?: string | null;
					organization_id?: string;
					price_id?: string | null;
					status?: string | null;
					stripe_customer_id?: string | null;
					stripe_subscription_id?: string | null;
					updated_at?: string | null;
				};
				Relationships: [
					{
						foreignKeyName: 'org_billing_organization_id_fkey';
						columns: ['organization_id'];
						isOneToOne: true;
						referencedRelation: 'organizations';
						referencedColumns: ['id'];
					}
				];
			};
			org_invites: {
				Row: {
					accepted_at: string | null;
					created_at: string;
					email: string;
					expires_at: string;
					id: string;
					invited_by: string;
					organization_id: string;
					role: string;
					token: string;
				};
				Insert: {
					accepted_at?: string | null;
					created_at?: string;
					email: string;
					expires_at: string;
					id?: string;
					invited_by: string;
					organization_id: string;
					role?: string;
					token: string;
				};
				Update: {
					accepted_at?: string | null;
					created_at?: string;
					email?: string;
					expires_at?: string;
					id?: string;
					invited_by?: string;
					organization_id?: string;
					role?: string;
					token?: string;
				};
				Relationships: [
					{
						foreignKeyName: 'org_invites_invited_by_fkey';
						columns: ['invited_by'];
						isOneToOne: false;
						referencedRelation: 'profiles';
						referencedColumns: ['id'];
					},
					{
						foreignKeyName: 'org_invites_organization_id_fkey';
						columns: ['organization_id'];
						isOneToOne: false;
						referencedRelation: 'organizations';
						referencedColumns: ['id'];
					}
				];
			};
			files: {
				Row: {
					id: string;
					organization_id: string;
					name: string;
					storage_path: string;
					size_bytes: number;
					mime_type: string | null;
					uploaded_by: string | null;
					created_at: string;
				};
				Insert: {
					id?: string;
					organization_id: string;
					name: string;
					storage_path: string;
					size_bytes: number;
					mime_type?: string | null;
					uploaded_by?: string | null;
					created_at?: string;
				};
				Update: {
					id?: string;
					organization_id?: string;
					name?: string;
					storage_path?: string;
					size_bytes?: number;
					mime_type?: string | null;
					uploaded_by?: string | null;
					created_at?: string;
				};
				Relationships: [
					{
						foreignKeyName: 'files_organization_id_fkey';
						columns: ['organization_id'];
						isOneToOne: false;
						referencedRelation: 'organizations';
						referencedColumns: ['id'];
					}
				];
			};
			feature_flags: {
				Row: {
					id: string;
					key: string;
					description: string | null;
					enabled: boolean;
					organization_id: string | null;
					created_at: string;
					updated_at: string;
				};
				Insert: {
					id?: string;
					key: string;
					description?: string | null;
					enabled?: boolean;
					organization_id?: string | null;
					created_at?: string;
					updated_at?: string;
				};
				Update: {
					id?: string;
					key?: string;
					description?: string | null;
					enabled?: boolean;
					organization_id?: string | null;
					created_at?: string;
					updated_at?: string;
				};
				Relationships: [
					{
						foreignKeyName: 'feature_flags_organization_id_fkey';
						columns: ['organization_id'];
						isOneToOne: false;
						referencedRelation: 'organizations';
						referencedColumns: ['id'];
					}
				];
			};
			notifications: {
				Row: {
					id: string;
					organization_id: string;
					user_id: string;
					type: string;
					title: string;
					body: string | null;
					href: string | null;
					read_at: string | null;
					created_at: string;
				};
				Insert: {
					id?: string;
					organization_id: string;
					user_id: string;
					type: string;
					title: string;
					body?: string | null;
					href?: string | null;
					read_at?: string | null;
					created_at?: string;
				};
				Update: {
					id?: string;
					organization_id?: string;
					user_id?: string;
					type?: string;
					title?: string;
					body?: string | null;
					href?: string | null;
					read_at?: string | null;
					created_at?: string;
				};
				Relationships: [
					{
						foreignKeyName: 'notifications_organization_id_fkey';
						columns: ['organization_id'];
						isOneToOne: false;
						referencedRelation: 'organizations';
						referencedColumns: ['id'];
					}
				];
			};
			organization_members: {
				Row: {
					created_at: string | null;
					id: string;
					organization_id: string | null;
					role: string | null;
					user_id: string | null;
				};
				Insert: {
					created_at?: string | null;
					id?: string;
					organization_id?: string | null;
					role?: string | null;
					user_id?: string | null;
				};
				Update: {
					created_at?: string | null;
					id?: string;
					organization_id?: string | null;
					role?: string | null;
					user_id?: string | null;
				};
				Relationships: [
					{
						foreignKeyName: 'organization_members_organization_id_fkey';
						columns: ['organization_id'];
						isOneToOne: false;
						referencedRelation: 'organizations';
						referencedColumns: ['id'];
					},
					{
						foreignKeyName: 'organization_members_user_id_fkey';
						columns: ['user_id'];
						isOneToOne: false;
						referencedRelation: 'profiles';
						referencedColumns: ['id'];
					}
				];
			};
			organization_members_backup: {
				Row: {
					created_at: string | null;
					id: string | null;
					organization_id: string | null;
					role: string | null;
					user_id: string | null;
				};
				Insert: {
					created_at?: string | null;
					id?: string | null;
					organization_id?: string | null;
					role?: string | null;
					user_id?: string | null;
				};
				Update: {
					created_at?: string | null;
					id?: string | null;
					organization_id?: string | null;
					role?: string | null;
					user_id?: string | null;
				};
				Relationships: [];
			};
			organizations: {
				Row: {
					created_at: string | null;
					created_by: string;
					id: string;
					name: string;
				};
				Insert: {
					created_at?: string | null;
					created_by: string;
					id?: string;
					name: string;
				};
				Update: {
					created_at?: string | null;
					created_by?: string;
					id?: string;
					name?: string;
				};
				Relationships: [];
			};
			profiles: {
				Row: {
					active_org_id: string | null;
					avatar_url: string | null;
					created_at: string;
					display_name: string | null;
					email: string | null;
					id: string;
					is_super_admin: boolean;
					onboarding_completed: boolean;
					plan: string;
					updated_at: string;
				};
				Insert: {
					active_org_id?: string | null;
					avatar_url?: string | null;
					created_at?: string;
					display_name?: string | null;
					email?: string | null;
					id: string;
					is_super_admin?: boolean;
					onboarding_completed?: boolean;
					plan?: string;
					updated_at?: string;
				};
				Update: {
					active_org_id?: string | null;
					avatar_url?: string | null;
					created_at?: string;
					display_name?: string | null;
					email?: string | null;
					id?: string;
					is_super_admin?: boolean;
					onboarding_completed?: boolean;
					plan?: string;
					updated_at?: string;
				};
				Relationships: [
					{
						foreignKeyName: 'profiles_active_org_id_fkey';
						columns: ['active_org_id'];
						isOneToOne: false;
						referencedRelation: 'organizations';
						referencedColumns: ['id'];
					}
				];
			};
			webhooks: {
				Row: {
					id: string;
					organization_id: string;
					url: string;
					secret: string;
					events: string[];
					active: boolean;
					created_by: string | null;
					created_at: string;
					updated_at: string;
				};
				Insert: {
					id?: string;
					organization_id: string;
					url: string;
					secret: string;
					events?: string[];
					active?: boolean;
					created_by?: string | null;
					created_at?: string;
					updated_at?: string;
				};
				Update: {
					id?: string;
					organization_id?: string;
					url?: string;
					secret?: string;
					events?: string[];
					active?: boolean;
					created_by?: string | null;
					created_at?: string;
					updated_at?: string;
				};
				Relationships: [
					{
						foreignKeyName: 'webhooks_organization_id_fkey';
						columns: ['organization_id'];
						isOneToOne: false;
						referencedRelation: 'organizations';
						referencedColumns: ['id'];
					}
				];
			};
			webhook_deliveries: {
				Row: {
					id: string;
					webhook_id: string;
					event: string;
					payload: Json;
					status_code: number | null;
					response_body: string | null;
					success: boolean;
					attempt: number;
					created_at: string;
				};
				Insert: {
					id?: string;
					webhook_id: string;
					event: string;
					payload: Json;
					status_code?: number | null;
					response_body?: string | null;
					success?: boolean;
					attempt?: number;
					created_at?: string;
				};
				Update: {
					id?: string;
					webhook_id?: string;
					event?: string;
					payload?: Json;
					status_code?: number | null;
					response_body?: string | null;
					success?: boolean;
					attempt?: number;
					created_at?: string;
				};
				Relationships: [
					{
						foreignKeyName: 'webhook_deliveries_webhook_id_fkey';
						columns: ['webhook_id'];
						isOneToOne: false;
						referencedRelation: 'webhooks';
						referencedColumns: ['id'];
					}
				];
			};
		};
		Views: {
			[_ in never]: never;
		};
		Functions: {
			has_org_role: {
				Args: { org_id: string; roles: string[] };
				Returns: boolean;
			};
			is_org_admin: { Args: { org_id: string }; Returns: boolean };
			is_org_member: { Args: { org_id: string }; Returns: boolean };
		};
		Enums: {
			[_ in never]: never;
		};
		CompositeTypes: {
			[_ in never]: never;
		};
	};
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>];

export type Tables<
	DefaultSchemaTableNameOrOptions extends
		| keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
		| { schema: keyof DatabaseWithoutInternals },
	TableName extends DefaultSchemaTableNameOrOptions extends {
		schema: keyof DatabaseWithoutInternals;
	}
		? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
				DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
		: never = never
> = DefaultSchemaTableNameOrOptions extends {
	schema: keyof DatabaseWithoutInternals;
}
	? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
			DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
			Row: infer R;
		}
		? R
		: never
	: DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
		? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
				Row: infer R;
			}
			? R
			: never
		: never;

export type TablesInsert<
	DefaultSchemaTableNameOrOptions extends
		| keyof DefaultSchema['Tables']
		| { schema: keyof DatabaseWithoutInternals },
	TableName extends DefaultSchemaTableNameOrOptions extends {
		schema: keyof DatabaseWithoutInternals;
	}
		? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
		: never = never
> = DefaultSchemaTableNameOrOptions extends {
	schema: keyof DatabaseWithoutInternals;
}
	? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
			Insert: infer I;
		}
		? I
		: never
	: DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
		? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
				Insert: infer I;
			}
			? I
			: never
		: never;

export type TablesUpdate<
	DefaultSchemaTableNameOrOptions extends
		| keyof DefaultSchema['Tables']
		| { schema: keyof DatabaseWithoutInternals },
	TableName extends DefaultSchemaTableNameOrOptions extends {
		schema: keyof DatabaseWithoutInternals;
	}
		? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
		: never = never
> = DefaultSchemaTableNameOrOptions extends {
	schema: keyof DatabaseWithoutInternals;
}
	? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
			Update: infer U;
		}
		? U
		: never
	: DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
		? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
				Update: infer U;
			}
			? U
			: never
		: never;

export type Enums<
	DefaultSchemaEnumNameOrOptions extends
		| keyof DefaultSchema['Enums']
		| { schema: keyof DatabaseWithoutInternals },
	EnumName extends DefaultSchemaEnumNameOrOptions extends {
		schema: keyof DatabaseWithoutInternals;
	}
		? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
		: never = never
> = DefaultSchemaEnumNameOrOptions extends {
	schema: keyof DatabaseWithoutInternals;
}
	? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
	: DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
		? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
		: never;

export type CompositeTypes<
	PublicCompositeTypeNameOrOptions extends
		| keyof DefaultSchema['CompositeTypes']
		| { schema: keyof DatabaseWithoutInternals },
	CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
		schema: keyof DatabaseWithoutInternals;
	}
		? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
		: never = never
> = PublicCompositeTypeNameOrOptions extends {
	schema: keyof DatabaseWithoutInternals;
}
	? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
	: PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
		? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
		: never;

export const Constants = {
	public: {
		Enums: {}
	}
} as const;
