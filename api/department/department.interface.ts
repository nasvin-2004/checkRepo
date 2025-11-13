export interface CreateDepartmentPayload {
	programId?: string | null;
	programName?: string | null;
	departmentName: string;
}

export interface EditDepartmentPayload {
	departmentId: string;
	programId?: string | null;
	programName?: string | null;
	departmentName: string;
}

export interface DepartmentData {
	departmentId: string;
	departmentName: string;
	programId: string;
	programName: string;
}

export interface DepartmentResponse<T> {
	success: boolean;
	data?: T;
	message?: string;
	error?: unknown;
}
