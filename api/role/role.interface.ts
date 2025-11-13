export interface ModulePermissions {
	module: string;
	actions: string[];
}

export interface JwtPayload {
	id: string;
	email: string;
	name: string;
	roleId: string;
	workspaceId: string;
}

export interface GetRolesResponse {
	id: string;
	role: string;
	members: number;
	activeCount: number;
	inactiveCount: number;
	isSystemRole: boolean;
}

export interface ModuleActions {
	module: string;
	actions: string[];
}

export interface PermissionUpdate {
	module: string;
	actions: string[];
}

export interface UpdateRolePermissionsBody {
	roleName: string;
	permissions: PermissionUpdate[];
}

export interface RolePermissionPayload {
	roleName: string;
	permissions: {
		module: string;
		actions: string[];
	}[];
}
export interface JwtPayload {
	id: string;
	email: string;
	name: string;
	roleId: string;
	workspaceId: string;
}
export interface GetRolesResponse {
	id: string;
	role: string;
	members: number;
	activeCount: number;
	inactiveCount: number;
	isSystemRole: boolean;
}
export interface ModuleActions {
	module: string;
	actions: string[];
}
export interface PermissionUpdate {
	module: string;
	actions: string[];
}
export interface UpdateRolePermissionsBody {
	roleName: string;
	permissions: PermissionUpdate[];
}
export interface RolePermissionPayload {
	roleName: string;
	permissions: {
		module: string;
		actions: string[];
	}[];
}
export interface RoleRouteParams {
	roleId: string;
}

export interface GetRolesMinimalResponse {
	roleId: string;
	name: string;
}

export interface roleidParams {
	roleId: string;
}
export interface emptybody {}
export interface emptyquery {}
