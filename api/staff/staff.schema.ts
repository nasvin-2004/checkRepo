import { z } from 'zod';

export const createStaffSchema = z.object({
	userName: z.string().min(1, 'userName is required'),
	email: z.string().email('Invalid email'),
	phoneNumber: z.string().optional(),
	departmentIds: z.array(z.string().uuid('Invalid departmentId')).optional(),
	roleId: z.string().uuid('Invalid roleId'),
});

export const editStaffSchema = z.object({
	userId: z.string().uuid('Invalid userId'),
	userName: z.string().min(1, 'userName is required'),
	email: z.string().email('Invalid email'),
	phoneNumber: z.string().optional(),
	departmentIds: z.array(z.string().uuid('Invalid departmentId')).optional(),
	roleId: z.string().uuid('Invalid roleId'),
});

export const createStaffSchemaJson = {
	body: {
		type: 'object',
		required: ['userName', 'email'],
		properties: {
			userName: { type: 'string' },
			email: { type: 'string', format: 'email' },
			phoneNumber: { type: 'string' },
			roleId: { type: 'string', format: 'uuid' },
			departmentIds: {
				type: 'array',
				items: { type: 'string', format: 'uuid' },
			},
		},
	},
};

export const editStaffSchemaJson = {
	body: {
		type: 'object',
		required: ['userId', 'userName', 'email'],
		properties: {
			userId: { type: 'string' },
			userName: { type: 'string' },
			roleId: { type: 'string', format: 'uuid' },
			email: { type: 'string', format: 'email' },
			phoneNumber: { type: 'string' },
			departmentIds: {
				type: 'array',
				items: { type: 'string', format: 'uuid' },
			},
		},
	},
};

export const changeStaffStatusSchemaJson = {
	body: {
		type: 'object',
		required: ['userId', 'status'],
		properties: {
			userId: { type: 'string' },
			status: {
				type: 'string',
				enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED', 'DELETED'],
			},
		},
	},
};
