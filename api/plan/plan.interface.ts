export interface PlanResponse {
	id: string;
	name: string;
	type: 'MAIN' | 'ADDON';
	description: string | null;
	priceMonthly: number | null;
	priceYearly: number | null;
	createdAt: Date;
	updatedAt: Date;
	features: PlanFeatureResponse[];
}

export interface PlanFeatureResponse {
	id: string;
	planId: string;
	planIdentifierId: string;
	valueInt: number;
	valueBool: boolean;
	identifier: {
		id: string;
		key: string;
		type: 'CREDIT' | 'ACCESS';
		displayName: string | null;
		description: string | null;
	};
}

export interface WorkspaceSubscriptionResponse {
	id: string;
	workspaceId: string;
	planId: string;
	planType: 'MAIN' | 'ADDON';
	active: boolean;
	startsAt: Date;
	endsAt: Date | null;
	createdAt: Date;
	updatedAt: Date;
	plan: {
		id: string;
		name: string;
		type: 'MAIN' | 'ADDON';
		description: string | null;
		priceMonthly: number | null;
		priceYearly: number | null;
	};
	workspace: {
		id: string;
		name: string;
	};
}

export interface PlansListResponse {
	success: boolean;
	data: PlanResponse[];
	message?: string;
}

export interface WorkspaceSubscriptionsListResponse {
	success: boolean;
	data: WorkspaceSubscriptionResponse[];
	message?: string;
}

export interface CurrentWorkspaceActivePlanResponse {
	success: boolean;
	data: WorkspaceSubscriptionResponse | null;
	message?: string;
}

