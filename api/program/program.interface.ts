export interface CreateProgramPayload {
	programName: string;
}

export interface EditProgramPayload extends CreateProgramPayload {
	programId: string;
}

export interface getProgramResponse {
	programId: string;
	programName: string;
}

export interface TransactionResult {
	success: boolean;
	message: string;
	data?: getProgramResponse;
}
