import { FastifyReply, FastifyRequest } from 'fastify';
import DepartmentsDao from './department.dao';
import {
	CreateDepartmentPayload,
	EditDepartmentPayload,
	DepartmentResponse,
	DepartmentData,
} from './department.interface';

interface GetDepartmentsQuery {
	programId?: string;
	search?: string;
	page?: string;
	limit?: string;
}

const departmentsDao = new DepartmentsDao();

class DepartmentsController {
	async getDepartmentsHandler(
		request: FastifyRequest<{ Querystring: GetDepartmentsQuery }>,
		reply: FastifyReply
	) {
		const workspaceId = request.user?.workspaceId;
		if (!workspaceId) {
			return reply.status(401).send({
				success: false,
				message: 'Unauthorized: workspaceId missing in token',
			});
		}

		const { programId, search, page, limit } = request.query;

		const result: DepartmentResponse<DepartmentData[]> = await departmentsDao.getDepartments({
			workSpaceId: workspaceId,
			programId: programId ?? null,
			search: search ?? null,
			page: page ? Number(page) : undefined,
			limit: limit ? Number(limit) : undefined,
		});

		return reply.status(200).send(result);
	}

	async createDepartmentHandler(
		request: FastifyRequest<{ Body: CreateDepartmentPayload }>,
		reply: FastifyReply
	) {
		const workspaceId = request.user?.workspaceId;
		if (!workspaceId) {
			return reply.status(401).send({
				success: false,
				message: 'Unauthorized: workspaceId missing in token',
			});
		}

		const payload = request.body;
		const result = await departmentsDao.createDepartment(payload, workspaceId);
		return reply.status(result.success ? 201 : 400).send(result);
	}

	async editDepartmentHandler(
		request: FastifyRequest<{ Body: EditDepartmentPayload }>,
		reply: FastifyReply
	) {
		const workspaceId = request.user?.workspaceId;
		if (!workspaceId) {
			return reply.status(401).send({
				success: false,
				message: 'Unauthorized: workspaceId missing in token',
			});
		}

		const result = await departmentsDao.editDepartment(request.body, workspaceId);
		return reply.status(result.success ? 200 : 400).send(result);
	}

	async deleteDepartmentHandler(
		request: FastifyRequest<{ Params: { departmentId: string } }>,
		reply: FastifyReply
	) {
		const workspaceId = request.user?.workspaceId;
		if (!workspaceId) {
			return reply.status(401).send({
				success: false,
				message: 'Unauthorized: workspaceId missing in token',
			});
		}

		const result = await departmentsDao.deleteDepartment(request.params.departmentId, workspaceId);

		return reply.status(result.success ? 200 : 404).send(result);
	}
}

export default DepartmentsController;
