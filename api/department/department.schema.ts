import { z } from 'zod';

export const createDepartmentSchema = z.object({
	programId: z.string().uuid().optional().nullable(),
	programName: z.string().min(1).optional().nullable(),
	departmentName: z.string().min(1, 'departmentName is required'),
});

export const editDepartmentSchema = z.object({
	departmentId: z.string().uuid('Invalid departmentId'),
	programId: z.string().uuid().optional().nullable(),
	programName: z.string().min(1).optional().nullable(),
	departmentName: z.string().min(1, 'departmentName is required'),
});

export const createDepartmentSchemaJson = {
	body: {
		type: 'object',
		required: ['departmentName'],
		properties: {
			programId: { type: 'string', format: 'uuid' },
			programName: { type: 'string' },
			departmentName: { type: 'string' },
		},
	},
};

export const editDepartmentSchemaJson = {
	body: {
		type: 'object',
		required: ['departmentId', 'departmentName'],
		properties: {
			departmentId: { type: 'string', format: 'uuid' },
			programId: { type: 'string', format: 'uuid' },
			programName: { type: 'string' },
			departmentName: { type: 'string' },
		},
	},
};
