import { workSpaceType } from '@prisma/client';

export interface WorkspaceAddress {
	id?: string;
	addressLine1: string;
	addressLine2: string | null;
	city: string;
	state: string;
	country: string;
	pincode: string;
	isPrimary?: boolean;
}

export interface WorkspaceBase {
	name: string;
	description: string | null;
	websiteUrl: string | null;
	uniqueIdentifier: string;
	isActive: boolean;
	phoneNumber: string | null;
	phoneNumberCountryCode: string | null;
	email: string | null;
	logoUrl: string | null;
	type: workSpaceType;

	ugcApproved: boolean;
	naacGrade: string;
	naacScore: number;
	nirfRanking: number | null;
	aicteApproved: boolean;
	nbaAccredited: boolean;
	autonomousStatus: boolean;
	accreditationValidTill: string | null;
	affliation: string;
	afflicationCode: string;

	Address: WorkspaceAddress[];
}

export interface GetWorkspaceByIdResponse extends WorkspaceBase {
	id: string;
	enterpriseName: string;
}


export interface UpdateWorkspacePayload extends WorkspaceBase {
	id?: string;
}



