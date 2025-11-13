import { Static, Type } from '@sinclair/typebox';
import { z } from 'zod';
export const ModulePermissionsSchema = Type.Array(
	Type.Object({
		module: Type.String(),
		actions: Type.Array(Type.String()),
	})
);

export type ModulePermissionsType = Static<typeof ModulePermissionsSchema>;

export const getRolesResponseSchema = z.object({
	success: z.boolean(),
	data: z.array(
		z.object({
			roleId: z.string().uuid(),
			name: z.string(),
			description: z.string().nullable(),
			isSystemRole: z.boolean(),
			createdAt: z.date(),
			updatedAt: z.date(),
		})
	),
});
export const errorResponseSchema = z.object({
	success: z.boolean(),
	message: z.string(),
});

// ---
export const updateRolePermissionsSchema = {
	description: 'Update role name and permissions',
	tags: ['Roles'],
	params: {
		type: 'object',
		properties: {
			roleId: { type: 'string' },
		},
		required: ['roleId'],
	},
	body: {
		type: 'object',
		properties: {
			roleName: { type: 'string' },
			permissions: {
				type: 'array',
				items: {
					type: 'object',
					properties: {
						module: { type: 'string' },
						actions: { type: 'array', items: { type: 'string' } },
					},
					required: ['module', 'actions'],
				},
			},
		},
		required: ['roleName', 'permissions'],
	},
	response: {
		200: {
			type: 'object',
			properties: {
				success: { type: 'boolean' },
				message: { type: 'string' },
			},
		},
	},
};

export const createRoleSchema = z.object({
	roleName: z.string().min(2, 'Role name is required'),
	permissions: z
		.array(
			z.object({
				module: z.string(),
				actions: z.array(z.string()),
			})
		)
		.optional(),
});

export type CreateRoleInput = z.infer<typeof createRoleSchema>;

export const getRolesSchema = {
	response: {
		200: Type.Object({
			success: Type.Boolean(),
			data: Type.Array(
				Type.Object({
					roleId: Type.String(),
					name: Type.String(),
				})
			),
		}),
	},
};
