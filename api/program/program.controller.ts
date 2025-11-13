import { FastifyReply, FastifyRequest } from 'fastify';
import ProgramDao from './program.dao';
import { CreateProgramPayload, EditProgramPayload, TransactionResult } from './program.interface';

const programDAO = new ProgramDao();

class ProgramController {
	async createProgramHandler(
		request: FastifyRequest<{ Body: CreateProgramPayload }>,
		reply: FastifyReply
	) {
		const workspaceId = request.user?.workspaceId;
		if (!workspaceId) {
			return reply.status(401).send({
				success: false,
				message: 'Unauthorized: workspaceId missing in token',
			});
		}

		const result: TransactionResult = await programDAO.createProgram(request.body, workspaceId);

		return reply.status(result.success ? 201 : 400).send(result);
	}

	async getProgramsHandler(
		request: FastifyRequest<{ Querystring: { search?: string } }>,
		reply: FastifyReply
	) {
		const workspaceId = request.user?.workspaceId;
		if (!workspaceId) {
			return reply.status(401).send({
				success: false,
				message: 'Unauthorized: workspaceId missing in token',
			});
		}

		const { search = '' } = request.query;
		const result = await programDAO.getPrograms(workspaceId, search);

		return reply.status(200).send(result);
	}

	async editProgramHandler(
		request: FastifyRequest<{ Body: EditProgramPayload }>,
		reply: FastifyReply
	) {
		const workspaceId = request.user?.workspaceId;
		if (!workspaceId) {
			return reply.status(401).send({
				success: false,
				message: 'Unauthorized: workspaceId missing in token',
			});
		}

		const result: TransactionResult = await programDAO.editProgram(request.body, workspaceId);

		return reply.status(result.success ? 200 : 400).send(result);
	}

	async deleteProgramHandler(
		request: FastifyRequest<{ Params: { programId: string } }>,
		reply: FastifyReply
	) {
		const workspaceId = request.user?.workspaceId;
		if (!workspaceId) {
			return reply.status(401).send({
				success: false,
				message: 'Unauthorized: workspaceId missing in token',
			});
		}

		const result: TransactionResult = await programDAO.deleteProgram(
			request.params.programId,
			workspaceId
		);

		return reply.status(result.success ? 200 : 404).send(result);
	}
}

export default ProgramController;
