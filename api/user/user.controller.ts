import { FastifyReply, FastifyRequest } from 'fastify';
import UserDao from './user.dao';
import {
	CreateUserPayload,
	TransactionResult,
	EditUserPayload,
	PaginatedUsersResponse,
} from './user.interface';

const userDAO = new UserDao();

class UserController {
	async createUserHandler(
		request: FastifyRequest<{ Body: CreateUserPayload }>,
		reply: FastifyReply
	) {
		const workspaceId = request.user?.workspaceId;

		if (!workspaceId) {
			return reply.status(401).send({
				success: false,
				message: 'Unauthorized: workspaceId missing in token',
			});
		}

		const result: TransactionResult = await userDAO.createUserWithRelations(
			request.body,
			workspaceId
		);

		return reply.status(result.success ? 201 : 400).send(result);
	}

	async editUserHandler(request: FastifyRequest<{ Body: EditUserPayload }>, reply: FastifyReply) {
		const workspaceId = request.user?.workspaceId;

		if (!workspaceId) {
			return reply.status(401).send({
				success: false,
				message: 'Unauthorized: workspaceId missing in token',
			});
		}

		const result: TransactionResult = await userDAO.editUserWithRelations(
			request.body,
			workspaceId
		);

		return reply.status(result.success ? 200 : 404).send(result);
	}

	async getUsersHandler(
		request: FastifyRequest<{
			Querystring: {
				page?: number;
				limit?: number;
				search?: string;
				roleId?: string;
				status?: string;
			};
		}>,
		reply: FastifyReply
	) {
		try {
			const workspaceId = request.user?.workspaceId;

			if (!workspaceId) {
				return reply.status(401).send({
					success: false,
					message: 'Unauthorized: workspaceId missing in token',
				});
			}

			const result: TransactionResult<PaginatedUsersResponse> = await userDAO.getUsersByWorkspace(
				workspaceId,
				request.query
			);

			return reply.status(result.success ? 200 : 400).send(result);
		} catch (error) {
			const err = error as { message?: string };
			return reply.status(500).send({
				success: false,
				message: err.message || 'Failed to fetch users',
			});
		}
	}

	async changeUserStatusHandler(
		request: FastifyRequest<{ Body: { userId: string; status: string } }>,
		reply: FastifyReply
	) {
		const { userId, status } = request.body;

		const result: TransactionResult = await userDAO.changeUserStatus(userId, status);

		return reply.status(result.success ? 200 : 400).send(result);
	}
}

export default UserController;
