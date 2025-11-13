// src/api/contact/contact.interface.ts

export interface ContactUsPayload {
	name: string;
	email: string;
	phone?: string;
	message: string;
}

export interface ErrorPayload {
	message: string;
	code?: number;
}
