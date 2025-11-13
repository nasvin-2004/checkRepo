import { z } from 'zod';

export const createProgramSchema = z.object({
	programName: z.string().min(1, 'Program name is required'),
});

export const editProgramSchema = z.object({
	programId: z.string().uuid('Invalid programId'),
	programName: z.string().min(1, 'Program name is required'),
});

export const createProgramSchemaJson = {
	body: {
		type: 'object',
		required: ['programName'],
		properties: {
			programName: { type: 'string' },
		},
	},
};

export const editProgramSchemaJson = {
	body: {
		type: 'object',
		required: ['programId', 'programName'],
		properties: {
			programId: { type: 'string', format: 'uuid' },
			programName: { type: 'string' },
		},
	},
};
