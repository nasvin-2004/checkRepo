// src/api/contact/contact.dao.ts
import { prisma } from '../../../prisma/prisma';
import type { ContactUsPayload } from './contact.interface';

export class ContactDAO {
	async createContact(data: ContactUsPayload) {
		return prisma.contactUs.create({
			data,
		});
	}

	async getAllContacts() {
		return prisma.contactUs.findMany({
			orderBy: { createdAt: 'desc' },
		});
	}
}
