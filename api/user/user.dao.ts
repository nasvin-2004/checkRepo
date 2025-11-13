import { Prisma, PrismaClient, UserStatus } from '@prisma/client';
import { CreateUserPayload, EditUserPayload, TransactionResult } from './user.interface';

const prisma = new PrismaClient();

class UserDao {
	async createUserWithRelations(
		payload: CreateUserPayload,
		workspaceId: string
	): Promise<TransactionResult> {
		const { userName, email, roleId, phoneNumber } = payload;

		const existingUser = await prisma.user.findUnique({ where: { email } });
		if (existingUser) {
			return { success: false, message: 'Duplicate user: email already exists' };
		}

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
				data: { userId: user.id, roleId, workspaceId },
			});

			await tx.userWorkspace.create({
				data: { userId: user.id, workspaceId },
			});

			return {
				success: true,
				message: 'User created successfully',
				data: {
					id: user.id,
					name: user.name,
					email: user.email,
					status: user.status,
					phoneNumber: user.phoneNumber,
				},
			};
		});

		return result;
	}

	async editUserWithRelations(
		payload: EditUserPayload,
		workspaceId: string
	): Promise<TransactionResult> {
		const { userId, userName, email, phoneNumber, roleId } = payload;
		const existingUser = await prisma.user.findUnique({ where: { id: userId } });

		if (!existingUser) {
			return { success: false, message: 'User not found' };
		}

		const result = await prisma.$transaction(async tx => {
			const user = await tx.user.update({
				where: { id: userId },
				data: { name: userName, email, phoneNumber },
			});

			const userRole = await tx.userRole.findFirst({
				where: { userId, workspaceId },
			});

			if (userRole && userRole.roleId !== roleId) {
				await tx.userRole.update({
					where: { id: userRole.id },
					data: { roleId },
				});
			}

			return {
				success: true,
				message: 'User updated successfully',
				data: {
					id: user.id,
					name: user.name,
					email: user.email,
					status: user.status,
					phoneNumber: user.phoneNumber,
				},
			};
		});

		return result;
	}

	async getUsersByWorkspace(
		workspaceId: string,
		params: { page?: number; limit?: number; search?: string; roleId?: string; status?: string }
	) {
		try {
			const { page = 1, limit = 10, search, roleId, status } = params;
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

			if (search) {
				where.OR = [
					{ name: { contains: search, mode: 'insensitive' } },
					{ email: { contains: search, mode: 'insensitive' } },
					{ phoneNumber: { contains: search, mode: 'insensitive' } },
				];
			}

			if (roleId) {
				where.userRoles = {
					some: {
						workspaceId,
						roleId,
					},
				};
			}

			if (status) {
				where.status = status as UserStatus;
			}

			const [users, totalCount] = await Promise.all([
				prisma.user.findMany({
					where,
					skip,
					take,
					include: {
						userRoles: {
							where: { workspaceId },
							include: { role: true },
						},
						staff: {
							include: {
								departments: {
									include: { department: true },
								},
							},
						},
					},
					orderBy: { createdAt: 'desc' },
				}),
				prisma.user.count({ where }),
			]);

			const formattedUsers = users.map(u => {
				const userRole = u.userRoles?.[0];
				const staffDept = u.staff?.departments?.[0];
				return {
					userId: u.id,
					userName: u.name || '-',
					email: u.email || '-',
					phoneNumber: u.phoneNumber || '-',
					status: u.status || 'INACTIVE',
					roleId: userRole?.roleId || null,
					role: userRole?.role?.name || '-',
					departmentId: staffDept?.departmentId || null,
					department: staffDept?.department?.department || '-',
				};
			});

			return {
				success: true,
				message: 'Users fetched successfully',
				data: {
					users: formattedUsers,
					meta: {
						total: totalCount,
						page: Number(page),
						totalPages: Math.ceil(totalCount / take),
						limit: take,
					},
				},
			};
		} catch (error) {
			return {
				success: false,
				message: error instanceof Error ? error.message : 'Failed to fetch users',
			};
		}
	}

	async changeUserStatus(userId: string, status: string): Promise<TransactionResult> {
		const upperStatus = status.toUpperCase();

		if (!Object.values(UserStatus).includes(upperStatus as UserStatus)) {
			return { success: false, message: 'Invalid status value' };
		}

		const existingUser = await prisma.user.findUnique({ where: { id: userId } });
		if (!existingUser) {
			return { success: false, message: 'User not found' };
		}

		const updatedUser = await prisma.user.update({
			where: { id: userId },
			data: { status: upperStatus as UserStatus },
		});

		return {
			success: true,
			message: 'User status updated successfully',
			data: {
				id: updatedUser.id,
				name: updatedUser.name,
				email: updatedUser.email,
				status: updatedUser.status,
				phoneNumber: updatedUser.phoneNumber,
			},
		};
	}
}

export default UserDao;
