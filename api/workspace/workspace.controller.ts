import { FastifyReply, FastifyRequest } from 'fastify';
import WorkspaceDAO from './workspace.dao';

import { fmt } from '../../config';

const workspaceDAO = new WorkspaceDAO();

class WorkspaceController {

	async getWorkspaceById(request: FastifyRequest, reply: FastifyReply) {
		try {
			const workspaceId = request.user?.workspaceId as string | undefined;
			if (!workspaceId) {
				request.log.warn('Missing workspaceId in token');
				return reply.status(401).send({
					success: false,
					message: 'Unauthorized: workspaceId missing in token',
				});
			}
			const data = await workspaceDAO.getWorkspaceById(workspaceId);

			reply.code(200).send(fmt.formatResponse(data, 'Successfully fetched workspace details'));
		} catch (err) {
			request.log.error(err);
			return reply.status(500).send(fmt.formatError(err));
		}
	}
	
}

export default WorkspaceController;
