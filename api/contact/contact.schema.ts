// src/api/contact/contact.schema.ts
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

export const createContactSchema = z.object({
	name: z.string().min(1, 'Name is required'),
	email: z.string().email('Invalid email address'),
	phone: z.string().optional(),
	message: z.string().min(1, 'Message is required'),
});

export const createContactJsonSchema = zodToJsonSchema(createContactSchema);
