import { FastifyReply, FastifyRequest } from 'fastify';
import { ContactDAO } from './contact.dao';
import type { ContactUsPayload } from './contact.interface';

const contactDAO = new ContactDAO();

export class ContactController {
	async createContactHandler(
		request: FastifyRequest<{ Body: ContactUsPayload }>,
		reply: FastifyReply
	) {
		try {
			const contact = await contactDAO.createContact(request.body);
			return reply
				.status(201)
				.send({ success: true, data: contact, message: 'Contact submitted successfully' });
		} catch (err: unknown) {
			request.log.error(err);

			const message = err instanceof Error ? err.message : 'Failed to submit contact';

			return reply.status(500).send({ success: false, message });
		}
	}

	async getAllContactsHandler(request: FastifyRequest, reply: FastifyReply) {
		try {
			const contacts = await contactDAO.getAllContacts();
			return reply.status(200).send({ success: true, data: contacts });
		} catch (err: unknown) {
			request.log.error(err);

			const message = err instanceof Error ? err.message : 'Failed to fetch contacts';

			return reply.status(500).send({ success: false, message });
		}
	}
}
