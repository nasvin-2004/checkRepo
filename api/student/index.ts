import { FastifyInstance } from 'fastify';
import routes from './student.routes';

export default async (fastify: FastifyInstance) => {
	for (const route of routes) {
		if (route.preHandler && Array.isArray(route.preHandler)) {
			route.preHandler = [fastify.authenticate, ...route.preHandler];
		}
		fastify.route(route);
	}
};
