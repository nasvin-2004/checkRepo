import { PrismaClient } from '@prisma/client';
import {
	GetWorkspaceByIdResponse,
	UpdateWorkspacePayload,
} from './workspace.interface';

const prisma = new PrismaClient();

class WorkspaceDAO {

	async getWorkspaceById(workspaceId: string): Promise<GetWorkspaceByIdResponse> {
        console.log("workspaceId:", workspaceId);
		const workspace = await prisma.workspace.findUnique({
			where: {
				id: workspaceId,
			},
			select: {
				id: true,
				// enterpriseId: true,
				name: true,
				description: true,
				websiteUrl: true,
				uniqueIdentifier: true,
				isActive: true,
				phoneNumber: true,
				phoneNumberCountryCode: true,
				email: true,
				logoUrl: true,
				type: true,
				details: {
					select: {
						ugcApproved: true,
						naacGrade: true,
						naacScore: true,
						nirfRanking: true,
						aicteApproved: true,
						nbaAccredited: true,
						autonomousStatus: true,
						accreditationValidTill: true,
						affliation: true,
						afflicationCode: true,
					},
				},
                enterprise: {
                    select: {
                        name: true,
                    }
                }
			},
		});

        console.log("workspace:", workspace);

		if (!workspace) {
			throw new Error(`Workspace not found for ID: ${workspaceId}`);
		}

		const workspaceAddresses = await prisma.address.findMany({
			where: {
				type: 'WORKSPACE',
				workspaceId,
			},
			select: {
				id: true,
				addressLine1: true,
				addressLine2: true,
				city: true,
				state: true,
				country: true,
				pincode: true,
				isPrimary: true,
			},
		});

		const details = workspace.details;
		if (!details) {
			throw new Error(`Workspace details not found for workspace ID: ${workspaceId}`);
		}

		return {
			id: workspace.id,
			enterpriseName: workspace.enterprise.name,
			name: workspace.name,
			description: workspace.description,
			websiteUrl: workspace.websiteUrl,
			uniqueIdentifier: workspace.uniqueIdentifier,
			type: workspace.type,
			isActive: workspace.isActive,
			phoneNumber: workspace.phoneNumber,
			phoneNumberCountryCode: workspace.phoneNumberCountryCode,
			email: workspace.email,
			logoUrl: workspace.logoUrl,
			ugcApproved: details.ugcApproved,
			naacGrade: details.naacGrade,
			naacScore: Number(details.naacScore),
			nirfRanking: details.nirfRanking,
			aicteApproved: details.aicteApproved,
			nbaAccredited: details.nbaAccredited,
			autonomousStatus: details.autonomousStatus,
			accreditationValidTill: details.accreditationValidTill
				? details.accreditationValidTill.toISOString()
				: null,
			affliation: details.affliation,
			afflicationCode: details.afflicationCode,
			Address: workspaceAddresses,
		};
	}

}

export default WorkspaceDAO;
