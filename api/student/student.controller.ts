import { FastifyReply, FastifyRequest } from 'fastify';
import { StudentDAO } from './student.dao';
import {
	AddStudentPayload,
	DeleteStudentParams,
	EditStudentPayload,
	GetStudentsParams,
} from './student.interface';

const studentDAO = new StudentDAO();

export class StudentController {
	async getStudentsHandler(
		request: FastifyRequest<{ Querystring: GetStudentsParams }>,
		reply: FastifyReply
	) {
		request.log.info('Fetching students...');

		try {
			const workspaceId = request.user?.workspaceId;
			if (!workspaceId) {
				return reply.status(401).send({
					success: false,
					message: 'Unauthorized: workspaceId missing in token',
				});
			}

			const result = await studentDAO.getStudents(workspaceId, request.query);

			return reply.status(result.success ? 200 : 400).send(result);
		} catch (err: unknown) {
			request.log.error({ err }, 'getStudentsHandler Error');
			return reply.status(500).send({
				success: false,
				message: 'Failed to fetch students',
			});
		}
	}

	async addStudentHandler(
		request: FastifyRequest<{ Body: AddStudentPayload }>,
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

			const result = await studentDAO.addStudent(workspaceId, request.body);

			return reply.status(result.success ? 201 : 200).send(result);
		} catch (err: unknown) {
			request.log.error({ err }, 'addStudentHandler Error');
			return reply.status(500).send({
				success: false,
				message: 'Failed to add student',
			});
		}
	}

	async editStudentHandler(
		request: FastifyRequest<{
			Params: { studentId: string };
			Body: EditStudentPayload;
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

			const result = await studentDAO.updateStudent(request.body);

			return reply.status(result.success ? 200 : 400).send(result);
		} catch (err: unknown) {
			request.log.error({ err }, 'editStudentHandler Error');
			return reply.status(500).send({
				success: false,
				message: 'Failed to update student',
			});
		}
	}

	async deleteStudentHandler(
		request: FastifyRequest<{ Params: DeleteStudentParams }>,
		reply: FastifyReply
	) {
		try {
			const result = await studentDAO.deleteStudent(request.params);

			return reply.code(result.success ? 200 : 404).send(result);
		} catch (err: unknown) {
			request.log.error({ err }, 'deleteStudentHandler Error');
			return reply.status(500).send({
				success: false,
				message: 'Failed to delete student',
			});
		}
	}

	async getProgramsWithDepartments(request: FastifyRequest, reply: FastifyReply) {
		try {
			const workspaceId = request.user?.workspaceId;
			if (!workspaceId) {
				return reply.status(401).send({
					success: false,
					message: 'Unauthorized: workspaceId missing in token',
				});
			}

			const result = await studentDAO.getProgramsWithDepartments(workspaceId);

			return reply.status(result.success ? 200 : 400).send(result);
		} catch (err: unknown) {
			request.log.error({ err }, 'getProgramsWithDepartments Error');
			return reply.status(500).send({
				success: false,
				message: 'Failed to fetch programs',
			});
		}
	}
}
