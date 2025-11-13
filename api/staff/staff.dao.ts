import { Prisma, UserStatus } from '@prisma/client';
import { prisma } from '../../../prisma/prisma';
import {
	CreateStaffPayload,
	EditStaffPayload,
	CreatedStaffResponse,
	GetStaffResponse,
	TransactionResult,
	GetStaffQuery,
} from './staff.interface';

export default class StaffDao {
	async createStaffWithRelations(
		payload: CreateStaffPayload,
		workspaceId: string
	): Promise<TransactionResult<CreatedStaffResponse>> {
		const { userName, email, phoneNumber, departments = [], roleId } = payload;

		const existing = await prisma.user.findUnique({ where: { email } });
		if (existing) {
			return { success: false, message: 'Duplicate user: email already exists' };
		}

		try {
			const result = await prisma.$transaction(async tx => {
				const user = await tx.user.create({
					data: {
						name: userName,
						email,
						phoneNumber,
						status: UserStatus.ACTIVE,
					},
				});

				await tx.userRole.create({
					data: {
						userId: user.id,
						roleId,
						workspaceId,
					},
				});

				await tx.userWorkspace.create({
					data: { userId: user.id, workspaceId },
				});

				const staff = await tx.staff.create({
					data: {
						userId: user.id,
						workspaceId,
						email,
						phoneNumber,
					},
				});

				if (departments.length > 0) {
					await tx.staffDepartments.createMany({
						data: departments.map(d => ({
							staffId: staff.id,
							departmentId: d.departmentId,
						})),
					});
				}

				return {
					success: true,
					message: 'Staff created successfully',
					data: {
						id: user.id,
						name: user.name,
						email: user.email,
						phoneNumber: user.phoneNumber ?? null,
						status: user.status,
						roleId,
					},
				};
			});

			return result;
		} catch (error) {
			return {
				success: false,
				message: error instanceof Error ? error.message : 'Failed to create staff',
			};
		}
	}

	async editStaffWithRelations(
		payload: EditStaffPayload,
		workspaceId: string
	): Promise<TransactionResult<CreatedStaffResponse>> {
		const { userId, userName, email, phoneNumber, departments = [], roleId } = payload;

		const existingUser = await prisma.user.findUnique({ where: { id: userId } });
		if (!existingUser) {
			return { success: false, message: 'Staff not found' };
		}

		try {
			const result = await prisma.$transaction(async tx => {
				const updatedUser = await tx.user.update({
					where: { id: userId },
					data: { name: userName, email, phoneNumber },
				});

				const existingUR = await tx.userRole.findFirst({
					where: { userId, workspaceId },
				});

				if (existingUR) {
					await tx.userRole.update({
						where: { id: existingUR.id },
						data: { roleId },
					});
				} else {
					await tx.userRole.create({
						data: { userId, workspaceId, roleId },
					});
				}

				let staff = await tx.staff.findUnique({ where: { userId } });

				if (!staff) {
					staff = await tx.staff.create({
						data: { userId, workspaceId, email, phoneNumber },
					});
				} else {
					await tx.staff.update({
						where: { id: staff.id },
						data: { email, phoneNumber },
					});
				}

				await tx.staffDepartments.deleteMany({ where: { staffId: staff.id } });

				if (departments.length > 0) {
					await tx.staffDepartments.createMany({
						data: departments.map(d => ({
							staffId: staff?.id!,
							departmentId: d.departmentId,
						})),
					});
				}

				return {
					success: true,
					message: 'Staff updated successfully',
					data: {
						id: updatedUser.id,
						name: updatedUser.name,
						email: updatedUser.email,
						phoneNumber: updatedUser.phoneNumber ?? null,
						status: updatedUser.status,
						roleId,
					},
				};
			});

			return result;
		} catch (error) {
			return {
				success: false,
				message: error instanceof Error ? error.message : 'Failed to update staff',
			};
		}
	}

	async getStaffs(
		workspaceId: string,
		params: GetStaffQuery
	): Promise<TransactionResult<GetStaffResponse[]>> {
		try {
			const { page = 1, limit = 10, search, status, departmentId, roleId } = params;

			const skip = (Number(page) - 1) * Number(limit);
			const take = Number(limit);

			const where: Prisma.UserWhereInput = {
				userRoles: {
					some: {
						workspaceId,
						OR: [{ role: { code: null } }, { role: { code: { not: 'STUDENT' } } }],
					},
				},
			};

			const andConditions: Prisma.UserWhereInput[] = [];

			if (search) {
				andConditions.push({
					OR: [
						{ name: { contains: search, mode: 'insensitive' } },
						{ email: { contains: search, mode: 'insensitive' } },
						{ phoneNumber: { contains: search, mode: 'insensitive' } },
					],
				});
			}

			if (status) andConditions.push({ status });
			if (roleId) andConditions.push({ userRoles: { some: { roleId, workspaceId } } });
			if (departmentId)
				andConditions.push({
					staff: {
						departments: { some: { departmentId } },
					},
				});

			if (andConditions.length > 0) where.AND = andConditions;

			const users = await prisma.user.findMany({
				where,
				skip,
				take,
				include: {
					userRoles: { include: { role: true } },
					staff: {
						include: {
							departments: {
								include: {
									department: { include: { program: true } },
								},
							},
						},
					},
				},
				orderBy: { createdAt: 'desc' },
			});

			const formatted: GetStaffResponse[] = users.map(u => {
				const userRole = u.userRoles?.[0];
				const staffInfo = u.staff?.departments ?? [];

				return {
					userId: u.id,
					userName: u.name,
					email: u.email,
					phoneNumber: u.phoneNumber ?? null,
					status: u.status,
					role: userRole?.role?.name ?? null,
					roleId: userRole?.roleId ?? null,
					departments: staffInfo.map(sd => ({
						departmentId: sd.departmentId,
						department: sd.department?.department ?? '-',
						programId: sd.department?.program?.id ?? null,
						programName: sd.department?.program?.program ?? null,
					})),
				};
			});

			return {
				success: true,
				message: 'Staff fetched successfully',
				data: formatted,
			};
		} catch (error) {
			return {
				success: false,
				message: error instanceof Error ? error.message : 'Failed to fetch staff',
			};
		}
	}

	async changeStaffStatus(
		staffId: string,
		status: UserStatus
	): Promise<TransactionResult<CreatedStaffResponse>> {
		try {
			const existing = await prisma.user.findUnique({ where: { id: staffId } });
			if (!existing) {
				return { success: false, message: 'Staff not found' };
			}

			const updated = await prisma.user.update({
				where: { id: staffId },
				data: { status },
			});

			return {
				success: true,
				message: 'Status updated successfully',
				data: {
					id: updated.id,
					name: updated.name,
					email: updated.email,
					phoneNumber: updated.phoneNumber ?? null,
					status: updated.status,
				},
			};
		} catch (error) {
			return {
				success: false,
				message: error instanceof Error ? error.message : 'Failed to update status',
			};
		}
	}
}
