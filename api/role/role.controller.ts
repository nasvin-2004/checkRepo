import { FastifyReply, FastifyRequest } from 'fastify';
import { RoleDAO } from './role.dao';
import type { UpdateRolePermissionsBody, RolePermissionPayload } from './role.interface';
import { createRoleSchema } from './role.schema';

const roleDAO = new RoleDAO();

export class RoleController {
	async getRoles(request: FastifyRequest, reply: FastifyReply) {
		try {
			const workspaceId = request.user?.workspaceId;
			if (!workspaceId)
				return reply.status(401).send({
					success: false,
					message: 'Unauthorized: workspaceId missing in token',
				});

			const roles = await roleDAO.getRolesByWorkspaceId(workspaceId);
			return reply.status(200).send({ success: true, data: roles });
		} catch (err) {
			request.log.error(err);
			return reply.status(500).send({
				success: false,
				message: 'Internal server error while fetching roles',
			});
		}
	}

	async getModulesAndActionsByRoleId(request: FastifyRequest, reply: FastifyReply) {
		try {
			const { roleId } = request.params as { roleId: string };
			if (!roleId)
				return reply.status(400).send({
					success: false,
					message: 'roleId param is required',
				});

			const modules = await roleDAO.getModulesWithActionsByRoleId(roleId);
			return reply.status(200).send({ success: true, data: modules });
		} catch (err) {
			request.log.error(err);
			return reply.status(500).send({
				success: false,
				message: 'Error fetching modules for role',
			});
		}
	}

	async getModulesWithActionsHandler(request: FastifyRequest, reply: FastifyReply) {
		try {
			const modules = await roleDAO.getAllModulesWithActions();
			return reply.status(200).send({ success: true, data: modules });
		} catch (err) {
			request.log.error(err);
			return reply.status(500).send({
				success: false,
				message: 'Failed to fetch modules',
			});
		}
	}

	async updateRolePermissionsHandler(
		request: FastifyRequest<{
			Params: { roleId: string };
			Body: UpdateRolePermissionsBody;
		}>,
		reply: FastifyReply
	) {
		try {
			const { roleId } = request.params;
			const result = await roleDAO.updateRolePermissions(roleId, request.body);
			return reply.status(200).send(result);
		} catch (err) {
			request.log.error(err);
			return reply.status(500).send({
				success: false,
				message: 'Failed to update role permissions',
			});
		}
	}

	async getRoleModulesHandler(request: FastifyRequest, reply: FastifyReply) {
		try {
			const roleId = request.user?.roleId;
			if (!roleId)
				return reply.status(401).send({
					success: false,
					message: 'Unauthorized: roleId missing in token',
				});

			const modules = await roleDAO.getModulesWithActionsByRoleId(roleId);
			return reply.status(200).send({ success: true, data: modules });
		} catch (err) {
			request.log.error(err);
			return reply.status(500).send({
				success: false,
				message: 'Failed to fetch modules',
			});
		}
	}

	async createRoleHandler(request: FastifyRequest, reply: FastifyReply) {
		try {
			const parsedBody = createRoleSchema.parse(request.body);
			const workspaceId = request.user?.workspaceId;
			if (!workspaceId)
				return reply.status(401).send({
					success: false,
					message: 'Unauthorized: workspaceId missing in token',
				});

			const payload: RolePermissionPayload = {
				roleName: parsedBody.roleName,
				permissions: parsedBody.permissions || [],
			};

			const role = await roleDAO.createRoleWithPermissions(payload, workspaceId);
			return reply.status(201).send({
				success: true,
				data: role,
				message: 'Role created successfully',
			});
		} catch (err) {
			request.log.error(err);
			return reply.status(400).send({
				success: false,
				message: err || 'Failed to create role',
			});
		}
	}

	async deleteRoleHandler(
		request: FastifyRequest<{ Params: { roleId: string } }>,
		reply: FastifyReply
	) {
		try {
			const { roleId } = request.params;
			if (!roleId)
				return reply.status(400).send({
					success: false,
					message: 'roleId param is required',
				});

			const result = await roleDAO.deleteRoleById(roleId);
			return reply.status(200).send(result);
		} catch (err) {
			request.log.error(err);
			return reply.status(500).send({
				success: false,
				message: 'Failed to delete role',
			});
		}
	}

	async getRolesFilter(request: FastifyRequest, reply: FastifyReply) {
		try {
			const workspaceId = request.user?.workspaceId;

			if (!workspaceId) {
				return reply.status(401).send({
					success: false,
					message: 'Unauthorized: workspaceId missing in token',
				});
			}

			const roles = await roleDAO.getRolesByWorkspaceIdFiltered(workspaceId);
			return reply.status(200).send({
				success: true,
				data: roles,
			});
		} catch (err) {
			request.log.error(err);
			return reply.status(500).send({
				success: false,
				message: 'Internal server error while fetching roles',
			});
		}
	}
}
