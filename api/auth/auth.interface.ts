export interface GoogleAuthQuery {
	redirectTo?: string;
	code?: string;
}

export interface UserPayload {
	id: string;
	email: string;
	name: string;
	roleId: string;
	workspaceId: string;
}
