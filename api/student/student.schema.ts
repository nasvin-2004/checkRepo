import { z } from 'zod';

export const addStudentSchema = z.object({
	name: z.string().min(1, 'Name is required'),
	email: z.string().email('Invalid email'),
	rollNumber: z.string().min(1, 'rollNumber is required'),
	department: z.string().optional(),
	graduationYear: z.number().optional(),
	batch: z.string().optional(),
	program: z.string().optional(),
	section: z.string().optional(),
	admissionNumber: z.string().optional(),
	phoneNumber: z.string().optional(),
});

export const addStudentSchemaJson = {
	body: {
		type: 'object',
		required: ['name', 'email', 'rollNumber'],
		properties: {
			name: { type: 'string' },
			email: { type: 'string', format: 'email' },
			rollNumber: { type: 'string' },
			department: { type: 'string' },
			graduationYear: { type: 'number' },
			batch: { type: 'string' },
			program: { type: 'string' },
			section: { type: 'string' },
			admissionNumber: { type: 'string' },
			phoneNumber: { type: 'string' },
		},
	},
};

export const deleteStudentSchema = z.object({
	params: z.object({
		studentId: z.string().uuid('Invalid studentId'),
	}),
});

export const deleteStudentSchemaJson = {
	params: {
		type: 'object',
		required: ['studentId'],
		properties: {
			studentId: { type: 'string' },
		},
	},
};

export const updateStudentSchema = z.object({
	body: z.object({
		studentId: z.string().uuid('Invalid studentId'),
		userId: z.string().uuid('Invalid userId'),
		name: z.string().optional(),
		email: z.string().email().optional(),
		rollNumber: z.string().optional(),
		department: z.string().optional(),
		graduationYear: z.number().optional(),
		batch: z.string().optional(),
		program: z.string().optional(),
		section: z.string().optional(),
		admissionNumber: z.string().optional(),
		phoneNumber: z.string().optional(),
	}),
});

export const updateStudentSchemaJson = {
	body: {
		type: 'object',
		required: ['studentId', 'userId'],
		properties: {
			studentId: { type: 'string' },
			userId: { type: 'string' },
			name: { type: 'string' },
			email: { type: 'string', format: 'email' },
			rollNumber: { type: 'string' },
			department: { type: 'string' },
			graduationYear: { type: 'number' },
			batch: { type: 'string' },
			program: { type: 'string' },
			section: { type: 'string' },
			admissionNumber: { type: 'string' },
			phoneNumber: { type: 'string' },
		},
	},
};

export const getStudentsSchemaJson = {
	response: {
		200: {
			type: 'object',
			required: ['success', 'message', 'data'],
			properties: {
				success: { type: 'boolean' },
				message: { type: 'string' },
				data: {
					type: 'array',
					items: {
						type: 'object',
						properties: {
							id: { type: 'string' },
							userId: { type: 'string' },
							name: { type: 'string' },
							email: { type: 'string' },
							status: { type: 'string' },
							rollNumber: { type: 'string' },
							department: { type: ['string', 'null'] },
							graduationYear: { type: ['number', 'null'] },
							batch: { type: ['string', 'null'] },
							program: { type: ['string', 'null'] },
							section: { type: ['string', 'null'] },
							admissionNumber: { type: ['string', 'null'] },
							phoneNumber: { type: ['string', 'null'] },
							deletedAt: { type: ['string', 'null'] },
						},
					},
				},
			},
		},
	},
};
