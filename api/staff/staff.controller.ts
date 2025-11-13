import { FastifyReply, FastifyRequest } from 'fastify';
import { UserStatus } from '@prisma/client';
import StaffDao from './staff.dao';
import { CreateStaffPayload, EditStaffPayload, GetStaffQuery } from './staff.interface';

const staffDao = new StaffDao();

export default class StaffController {
	async getStaffsHandler(request: FastifyRequest, reply: FastifyReply) {
		request.log.info('Fetching staffs list');

		try {
			const workspaceId = request.user?.workspaceId as string | undefined;
			if (!workspaceId) {
				request.log.warn('Missing workspaceId in token');
				return reply.status(401).send({
					success: false,
					message: 'Unauthorized: workspaceId missing in token',
				});
			}

			const rawQuery = request.query as Record<string, string | undefined>;

			const rawStatus = rawQuery.status;
			const status =
				rawStatus && Object.values(UserStatus).includes(rawStatus as UserStatus)
					? (rawStatus as UserStatus)
					: undefined;

			const params: GetStaffQuery = {
				page: rawQuery.page ? Number(rawQuery.page) : undefined,
				limit: rawQuery.limit ? Number(rawQuery.limit) : undefined,
				search: rawQuery.search,
				status,
				departmentId: rawQuery.departmentId,
				roleId: rawQuery.roleId,
			};

			const result = await staffDao.getStaffs(workspaceId, params);
			return reply.status(result.success ? 200 : 400).send(result);
		} catch (err: unknown) {
			request.log.error({ err }, 'getStaffsHandler error');
			const message = err instanceof Error ? err.message : 'Failed to fetch staffs';
			return reply.status(500).send({ success: false, message });
		}
	}

	async createStaffHandler(
		request: FastifyRequest<{ Body: CreateStaffPayload }>,
		reply: FastifyReply
	) {
		try {
			const workspaceId = request.user?.workspaceId as string | undefined;
			if (!workspaceId) {
				return reply.status(401).send({
					success: false,
					message: 'Unauthorized: workspaceId missing in token',
				});
			}

			const payload = request.body;
			const result = await staffDao.createStaffWithRelations(payload, workspaceId);
			return reply.status(result.success ? 201 : 400).send(result);
		} catch (err: unknown) {
			request.log.error({ err }, 'createStaffHandler error');
			const message = err instanceof Error ? err.message : 'Failed to create staff';
			return reply.status(500).send({ success: false, message });
		}
	}

	async editStaffHandler(
		request: FastifyRequest<{ Params: { userId: string }; Body: EditStaffPayload }>,
		reply: FastifyReply
	) {
		try {
			const workspaceId = request.user?.workspaceId as string | undefined;
			if (!workspaceId) {
				return reply.status(401).send({
					success: false,
					message: 'Unauthorized: workspaceId missing in token',
				});
			}

			const payload = request.body as EditStaffPayload;

			const result = await staffDao.editStaffWithRelations(payload, workspaceId);
			return reply.status(result.success ? 200 : 400).send(result);
		} catch (err: unknown) {
			request.log.error({ err }, 'editStaffHandler error');
			const message = err instanceof Error ? err.message : 'Failed to update staff';
			return reply.status(500).send({ success: false, message });
		}
	}

	async changeStaffStatusHandler(
		request: FastifyRequest<{ Body: { staffId: string; status: string } }>,
		reply: FastifyReply
	) {
		try {
			const { staffId, status: rawStatus } = request.body;
			if (!staffId) {
				return reply.status(400).send({ success: false, message: 'Missing staffId' });
			}

			if (!rawStatus || !Object.values(UserStatus).includes(rawStatus as UserStatus)) {
				return reply.status(400).send({ success: false, message: 'Invalid status value' });
			}

			const statusEnum = rawStatus as UserStatus;
			const result = await staffDao.changeStaffStatus(staffId, statusEnum);
			return reply.status(result.success ? 200 : 400).send(result);
		} catch (err: unknown) {
			request.log.error({ err }, 'changeStaffStatusHandler error');
			const message = err instanceof Error ? err.message : 'Failed to change staff status';
			return reply.status(500).send({ success: false, message });
		}
	}

	async deleteStaffHandler(
		request: FastifyRequest<{ Params: { staffId: string } }>,
		reply: FastifyReply
	) {
		try {
			const staffId = request.params.staffId;
			if (!staffId) {
				return reply.status(400).send({ success: false, message: 'Missing staffId' });
			}

			return reply.status(501).send({ success: false, message: 'Not implemented' });
		} catch (err: unknown) {
			request.log.error({ err }, 'deleteStaffHandler error');
			const message = err instanceof Error ? err.message : 'Failed to delete staff';
			return reply.status(500).send({ success: false, message });
		}
	}
}
