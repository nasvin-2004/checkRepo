import { PrismaClient } from '@prisma/client';
import {
	PlansListResponse,
	WorkspaceSubscriptionsListResponse,
	CurrentWorkspaceActivePlanResponse,
} from './plan.interface';

const prisma = new PrismaClient();

class PlanDao {
	async getAllPlans(): Promise<PlansListResponse> {
		try {
			const plans = await prisma.plan.findMany({
				include: {
					features: {
						include: {
							identifier: true,
						},
					},
				},
				orderBy: { createdAt: 'desc' },
			});

			return {
				success: true,
				data: plans,
			};
		} catch (error) {
			const err = error as Error;
			return {
				success: false,
				data: [],
				message: err.message ?? 'Failed to fetch plans',
			};
		}
	}

	async getWorkspaceSubscriptions(
		workspaceId: string,
	): Promise<WorkspaceSubscriptionsListResponse> {
		try {
			const subscriptions = await prisma.workspacePlanSubscription.findMany({
				where: {
					workspaceId,
				},
				include: {
					plan: true,
					workspace: {
						select: {
							id: true,
							name: true,
						},
					},
				},
				orderBy: { createdAt: 'desc' },
			});

			return {
				success: true,
				data: subscriptions,
			};
		} catch (error) {
			const err = error as Error;
			return {
				success: false,
				data: [],
				message: err.message ?? 'Failed to fetch workspace subscriptions',
			};
		}
	}

	async getCurrentWorkspaceActivePlan(
		workspaceId: string,
	): Promise<CurrentWorkspaceActivePlanResponse> {
		try {
			const subscription = await prisma.workspacePlanSubscription.findFirst({
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
					workspace: {
						select: {
							id: true,
							name: true,
						},
					},
				},
				orderBy: { createdAt: 'desc' },
			});

			return {
				success: true,
				data: subscription,
			};
		} catch (error) {
			const err = error as Error;
			return {
				success: false,
				data: null,
				message: err.message ?? 'Failed to fetch current workspace active plan',
			};
		}
	}
}

export default PlanDao;

