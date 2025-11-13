export interface CreateUserPayload {
	departmentId: string;
	userName: string;
	email: string;
	roleId: string;
	phoneNumber?: string | null;
}

export interface EditUserPayload extends CreateUserPayload {
	userId: string;
}

export interface CreatedUserResponse {
	id: string;
	name: string;
	email: string;
	phoneNumber?: string | null;
	status: string;
	role?: string | null;
	roleId?: string | null;
}

export interface GetUserResponse {
	userId: string;
	userName: string;
	email: string;
	phoneNumber?: string | null;
	status: string;
	role?: string | null;
	roleId?: string | null;
}

export interface PaginatedUsersResponse {
	users: GetUserResponse[];
	meta: {
		page: number;
		limit: number;
		total: number;
		totalPages: number;
	};
}

export interface TransactionResult<T = unknown> {
	success: boolean;
	message: string;
	data?: T;
}
