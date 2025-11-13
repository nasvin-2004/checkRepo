import { FastifyInstance } from 'fastify';
import routes from './contact.routes';

export default async (fastify: FastifyInstance) => {
	for (const route of routes) {
		// Add fastify.authenticate to preHandler array if it exists
		if (route.preHandler && Array.isArray(route.preHandler)) {
			route.preHandler = [fastify.authenticate, ...route.preHandler];
		}
		fastify.route(route);
	}
};
