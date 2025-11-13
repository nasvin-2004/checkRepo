import { prisma } from '../../../prisma/prisma';
import type {
	ModulePermissions,
	GetRolesResponse,
	ModuleActions,
	UpdateRolePermissionsBody,
	RolePermissionPayload,
	GetRolesMinimalResponse,
} from './role.interface';

export class RoleDAO {
	async getModulesWithActionsByRoleId(roleId: string): Promise<ModulePermissions[]> {
		const role = await prisma.role.findUnique({
			where: { id: roleId },
			select: { isSystemRole: true },
		});

		if (!role) {
			throw new Error('Role not found');
		}

		const roleModules = await prisma.roleModule.findMany({
			where: { roleId },
			include: { module: true, permissions: { include: { moduleAction: true } } },
		});

		return roleModules.map(rm => ({
			module: rm.module.code,
			actions: rm.permissions.filter(p => p.isAllowed).map(p => p.moduleAction.code.toUpperCase()),
		}));
	}

	async getAllModulesWithActions(): Promise<ModuleActions[]> {
		const modules = await prisma.module.findMany({
			include: { moduleActions: { select: { name: true } } },
		});

		return modules.map(m => ({
			module: m.name,
			actions: m.moduleActions.map(a => a.name),
		}));
	}

	async getRolesByWorkspaceId(workspaceId: string): Promise<GetRolesResponse[]> {
		const roles = await prisma.role.findMany({
			where: {
				OR: [{ workspaceId }, { workspaceId: null }],
				deletedAt: null,
			},
			select: {
				id: true,
				name: true,
				description: true,
				isSystemRole: true,
				createdAt: true,
				updatedAt: true,
				userRoles: {
					select: {
						user: {
							select: {
								status: true,
							},
						},
					},
				},
			},
			orderBy: { createdAt: 'desc' },
		});

		return roles.map(r => {
			const totalMembers = r.userRoles.length;
			const activeCount = r.userRoles.filter(ur => ur.user.status === 'ACTIVE').length;
			const inactiveCount = r.userRoles.filter(ur => ur.user.status === 'INACTIVE').length;
			return {
				id: r.id,
				role: r.name,
				isSystemRole: r.isSystemRole,
				members: totalMembers,
				activeCount,
				inactiveCount,
			};
		});
	}

	async updateRolePermissions(roleId: string, data: UpdateRolePermissionsBody) {
		const { roleName, permissions } = data;

		await prisma.role.update({
			where: { id: roleId },
			data: { name: roleName },
		});

		for (const modulePayload of permissions) {
			const module = await prisma.module.findUnique({
				where: { name: modulePayload.module },
				include: { moduleActions: true },
			});
			if (!module) continue;

			const roleModule = await prisma.roleModule.upsert({
				where: { roleId_moduleId: { roleId, moduleId: module.id } },
				create: { roleId, moduleId: module.id },
				update: {},
			});

			await prisma.roleModulePermission.updateMany({
				where: { roleModuleId: roleModule.id },
				data: { isAllowed: false },
			});

			for (const actionName of modulePayload.actions) {
				const action = module.moduleActions.find(
					a => a.name.toLowerCase() === actionName.toLowerCase()
				);
				if (!action) continue;

				const existingPermission = await prisma.roleModulePermission.findUnique({
					where: {
						roleModuleId_moduleActionId: {
							roleModuleId: roleModule.id,
							moduleActionId: action.id,
						},
					},
				});

				if (existingPermission) {
					if (!existingPermission.isAllowed) {
						await prisma.roleModulePermission.update({
							where: { id: existingPermission.id },
							data: { isAllowed: true },
						});
					}
				} else {
					await prisma.roleModulePermission.create({
						data: {
							roleModuleId: roleModule.id,
							moduleActionId: action.id,
							isAllowed: true,
						},
					});
				}
			}
		}

		return { success: true, message: 'Role permissions updated successfully' };
	}

	async deleteRoleById(roleId: string) {
		const existingRole = await prisma.role.findUnique({ where: { id: roleId } });
		if (!existingRole) {
			throw new Error('Role not found');
		}
		await prisma.role.update({
			where: { id: roleId },
			data: { deletedAt: new Date() },
		});
		return { success: true, message: 'Role deleted successfully' };
	}

	async createRoleWithPermissions(payload: RolePermissionPayload, workspaceId: string) {
		const { roleName, permissions } = payload;

		const role = await prisma.role.create({
			data: { name: roleName, isSystemRole: false, workspaceId },
		});

		const modules = await prisma.module.findMany({ include: { moduleActions: true } });

		for (const mod of modules) {
			const actionsForModule = permissions.find(p => p.module === mod.name)?.actions;
			if (!actionsForModule || actionsForModule.length === 0) continue;

			const roleModule = await prisma.roleModule.create({
				data: { roleId: role.id, moduleId: mod.id },
			});

			for (const actionName of actionsForModule) {
				const action = mod.moduleActions.find(
					a => a.name.toUpperCase() === actionName.toUpperCase()
				);
				if (!action) continue;

				await prisma.roleModulePermission.create({
					data: {
						roleModuleId: roleModule.id,
						moduleActionId: action.id,
						isAllowed: true,
					},
				});
			}
		}

		return role;
	}

	async getRolesByWorkspaceIdFiltered(workspaceId: string): Promise<GetRolesMinimalResponse[]> {
		const roles = await prisma.role.findMany({
			where: {
				deletedAt: null,
				OR: [
					{ workspaceId },
					{
						AND: [{ code: { not: 'STUDENT' } }],
					},
				],
			},
			select: {
				id: true,
				name: true,
			},
			orderBy: { createdAt: 'desc' },
		});

		return roles.map(r => ({
			roleId: r.id,
			name: r.name,
		}));
	}
}
