import { z } from 'zod';

export const createUserSchema = z.object({
	userName: z.string().min(1, 'userName is required'),
	email: z.string().email('Invalid email'),
	roleId: z.string().uuid('Invalid roleId'),
});

export const editUserSchema = z.object({
	userId: z.string().uuid('Invalid userId'),
	userName: z.string().min(1, 'userName is required'),
	email: z.string().email('Invalid email'),
	roleId: z.string().uuid('Invalid roleId'),
});

export const createUserSchemaJson = {
	body: {
		type: 'object',
		required: ['userName', 'email', 'roleId'],
		properties: {
			userName: { type: 'string' },
			email: { type: 'string', format: 'email' },
			roleId: { type: 'string' },
		},
	},
};

export const editUserSchemaJson = {
	body: {
		type: 'object',
		required: ['userId', 'userName', 'email', 'roleId'],
		properties: {
			userId: { type: 'string' },
			userName: { type: 'string' },
			email: { type: 'string', format: 'email' },
			roleId: { type: 'string' },
		},
	},
};

export const changeUserStatusSchemaJson = {
	body: {
		type: 'object',
		required: ['userId', 'status'],
		properties: {
			userId: { type: 'string' },
			status: { type: 'string', enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED', 'DELETED'] },
		},
	},
};
