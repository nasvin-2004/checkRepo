import { UserStatus } from '@prisma/client';

export interface CreateStaffPayload {
	departments: { departmentId: string; department: string }[];
	userName: string;
	email: string;
	roleId: string;
	phoneNumber?: string | null;
}

export interface EditStaffPayload extends CreateStaffPayload {
	userId: string;
}

export interface CreatedStaffResponse {
	id: string;
	name: string;
	email: string;
	phoneNumber?: string | null;
	status: string;
	role?: string | null;
	roleId?: string | null;
}

export interface GetStaffResponse {
	userId: string;
	userName: string;
	email: string;
	phoneNumber?: string | null;
	status: string;
	role?: string | null;
	roleId?: string | null;
	departments?: {
		departmentId: string;
		department: string;
		programId: string | null;
		programName: string | null;
	}[];
}

export interface TransactionResult<T = CreatedStaffResponse> {
	success: boolean;
	message: string;
	data?: T;
}

export interface GetStaffQuery {
	page?: number | string;
	limit?: number | string;
	search?: string;
	status?: UserStatus;
	departmentId?: string;
	roleId?: string;
}
