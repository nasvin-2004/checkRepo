import { PrismaClient } from '@prisma/client';
import { OAuth2Client } from 'google-auth-library';
import { config } from '../../config';
import redisClient from '../../config/redis';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

export class GoogleAuthService {
	private client = new OAuth2Client({ clientId: config.googleClientId });

	async verifyOAuthToken(token: string) {
		try {
			const ticket = await this.client.verifyIdToken({
				idToken: token,
				audience: config.googleClientId,
			});

			return ticket;
		} catch (error) {
			throw new Error('Invalid Google OAuth token');
		}
	}

	async findUserByEmail(email: string) {
		return await prisma.user.findUnique({
			where: { email },
			select: {
				id: true,
				name: true,
				email: true,
				password: true,
				status: true,
				googleId: true,
			},
		});
	}

	async findUserById(userId: string) {
		return await prisma.user.findUnique({
			where: { id: userId },
			select: {
				id: true,
				email: true,
			},
		});
	}

	async getUserRoleWithWorkspace(userId: string) {
		return await prisma.userRole.findFirst({
			where: { userId },
			select: {
				roleId: true,
				workspaceId: true,
			},
		});
	}

	async getUserPermissions(userId: string, workspaceId: string) {
		// Get user's role for the workspace
		const userRole = await prisma.userRole.findUnique({
			where: {
				userId_workspaceId: {
					userId,
					workspaceId,
				},
			},
			include: {
				role: {
					include: {
						roleModules: {
							include: {
								module: true,
								permissions: {
									where: {
										isAllowed: true,
									},
									include: {
										moduleAction: true,
									},
								},
							},
						},
					},
				},
			},
		});

		if (!userRole) {
			return [];
		}

		// Transform the data into the required format
		const permissions = userRole.role.roleModules.map(roleModule => ({
			module: roleModule.module.name,
			actions: roleModule.permissions.map(permission => permission.moduleAction.name),
		}));

		return permissions;
	}

	async saveSession(userId: string, userIdentifierKey: string) {
		await redisClient.set(userId, userIdentifierKey);
	}

	async getSession(userId: string) {
		return await redisClient.get(userId);
	}

	async deleteSession(userId: string) {
		await redisClient.del(userId);
	}

	async getUserProfile(userId: string, roleId: string, workspaceId: string) {
		return await prisma.userRole.findUnique({
			where: {
				userId_roleId_workspaceId: {
					userId,
					roleId,
					workspaceId,
				},
			},
			select: {
				user: {
					select: {
						name: true,
						email: true,
						emailVerified: true,
					},
				},
				role: {
					select: {
						name: true,
					},
				},
			},
		});
	}

	async findUserByUsername(username: string) {
		return await prisma.user.findUnique({
			where: { username },
			select: {
				id: true,
				name: true,
				email: true,
				username: true,
				password: true,
				status: true,
			},
		});
	}

	async verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
		return await bcrypt.compare(plainPassword, hashedPassword);
	}

	async hashPassword(password: string): Promise<string> {
		const saltRounds = 10;
		return await bcrypt.hash(password, saltRounds);
	}

	async updateUserPassword(userId: string, hashedPassword: string): Promise<void> {
		await prisma.user.update({
			where: { id: userId },
			data: { password: hashedPassword },
		});
	}

	async savePasswordResetToken(
		token: string,
		userId: string,
		expiresInSeconds: number
	): Promise<void> {
		const key = `password-reset:${token}`;
		await redisClient.setex(key, expiresInSeconds, userId);
	}

	async getPasswordResetToken(token: string): Promise<string | null> {
		const key = `password-reset:${token}`;
		return await redisClient.get(key);
	}

	async deletePasswordResetToken(token: string): Promise<void> {
		const key = `password-reset:${token}`;
		await redisClient.del(key);
	}
	async getWorkspaceModuleAccess(workspaceId: string) {
		// Fetch all PlanIdentifiers where type is ACCESS
		const identifiers = await prisma.planIdentifier.findMany({
			where: { type: 'ACCESS' },
			select: {
				id: true,
				key: true,
				displayName: true,
				description: true,
			},
		});
		// Fetch active plan subscriptions for this workspace
		const activeSubscriptions = await prisma.workspacePlanSubscription.findMany({
			where: {
				workspaceId,
				active: true,
			},
			include: {
				plan: {
					include: {
						features: {
							include: {
								identifier: true,
							},
						},
					},
				},
			},
		});
		// Extract identifierIds granted by active plans
		const allowedIdentifierIds = new Set<string>();
		activeSubscriptions.forEach(sub => {
			sub.plan.features.forEach(f => {
				if (f.identifier.type === 'ACCESS' && f.valueBool === true) {
					allowedIdentifierIds.add(f.planIdentifierId);
				}
			});
		});
		// Build final result response
		return identifiers.map(identifier => ({
			module: identifier.key,
			access: allowedIdentifierIds.has(identifier.id),
		}));
	}
}
