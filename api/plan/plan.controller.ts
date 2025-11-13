import type { FastifyRequest, FastifyReply } from 'fastify';
import PlanDao from './plan.dao';

const planDao = new PlanDao();

class PlanController {
	async getAllPlansHandler(_request: FastifyRequest, reply: FastifyReply) {
		const result = await planDao.getAllPlans();
		return reply.status(result.success ? 200 : 500).send(result);
	}

	async getWorkspaceSubscriptionsHandler(
		request: FastifyRequest,
		reply: FastifyReply,
	) {
		const workspaceId = request.user?.workspaceId;
		if (!workspaceId) {
			return reply.status(401).send({
				success: false,
				message: 'Unauthorized: workspaceId missing in token',
			});
		}

		const result = await planDao.getWorkspaceSubscriptions(workspaceId);
		return reply.status(result.success ? 200 : 500).send(result);
	}

	async getCurrentWorkspaceActivePlanHandler(
		request: FastifyRequest,
		reply: FastifyReply,
	) {
		const workspaceId = request.user?.workspaceId;
		if (!workspaceId) {
			return reply.status(401).send({
				success: false,
				message: 'Unauthorized: workspaceId missing in token',
			});
		}

		const result = await planDao.getCurrentWorkspaceActivePlan(workspaceId);
		return reply.status(result.success ? 200 : 500).send(result);
	}
}

export default PlanController;

