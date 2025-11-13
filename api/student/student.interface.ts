export interface AddStudentPayload {
	name: string;
	email: string;
	rollNumber: string;
	departmentId?: string;
	graduationYear?: number;
	batch?: string;
	section?: string;
	admissionNumber?: string;
	phoneNumber?: string;
}

export interface EditStudentPayload extends AddStudentPayload {
	studentId: string;
	userId: string;
}

export interface StudentResponse {
	studentId: string;
	userId: string;
	name: string;
	email: string;
	rollNumber: string;
	departmentId?: string | null;
	department?: string | null;
	program?: string | null;
	section?: string | null;
	graduationYear?: number | null;
	batch?: string | null;
	admissionNumber?: string | null;
	phoneNumber?: string | null;
	status: string;
}

export interface PaginatedStudents {
	students: StudentResponse[];
	meta: {
		total: number;
		page: number;
		limit: number;
		totalPages: number;
	};
}

export interface TransactionResult<T = unknown> {
	success: boolean;
	message: string;
	limitReached?: boolean;
	data?: T;
}
export interface ProgramWithDepartments {
	programId: string;
	programName: string;
	departments: {
		id: string;
		name: string;
	}[];
}
export interface GetStudentsParams {
	page?: number | string;
	limit?: number | string;
	search?: string;
	departmentId?: string;
	status?: string;
}

export interface DeleteStudentParams {
	studentId: string;
}
