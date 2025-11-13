import { PrismaClient } from '@prisma/client';
import {
	CreateProgramPayload,
	EditProgramPayload,
	getProgramResponse,
	TransactionResult,
} from './program.interface';

const prisma = new PrismaClient();

class ProgramDao {
	async createProgram(
		payload: CreateProgramPayload,
		workSpaceId: string
	): Promise<TransactionResult> {
		const { programName } = payload;

		const existing = await prisma.programs.findFirst({
			where: {
				workSpaceId,
				deletedAt: null,
				program: { equals: programName, mode: 'insensitive' },
			},
		});

		if (existing) {
			return {
				success: false,
				message: 'Duplicate program: Program name already exists',
			};
		}

		const newProgram = await prisma.programs.create({
			data: {
				program: programName,
				workSpaceId,
			},
		});

		return {
			success: true,
			message: 'Program created successfully',
			data: {
				programId: newProgram.id,
				programName: newProgram.program,
			},
		};
	}

	async getPrograms(
		workSpaceId: string,
		search = ''
	): Promise<{
		success: boolean;
		data: getProgramResponse[];
	}> {
		const programs = await prisma.programs.findMany({
			where: {
				workSpaceId,
				deletedAt: null,
				...(search ? { program: { contains: search, mode: 'insensitive' } } : {}),
			},
			select: {
				id: true,
				program: true,
			},
			orderBy: { createdAt: 'desc' },
		});

		const formatted = programs.map(p => ({
			programId: p.id,
			programName: p.program,
		}));

		return { success: true, data: formatted };
	}

	async editProgram(payload: EditProgramPayload, workSpaceId: string): Promise<TransactionResult> {
		const { programId, programName } = payload;

		const existing = await prisma.programs.findFirst({
			where: { id: programId, workSpaceId, deletedAt: null },
		});
		if (!existing) {
			return { success: false, message: 'Program not found' };
		}

		const duplicate = await prisma.programs.findFirst({
			where: {
				id: { not: programId },
				workSpaceId,
				deletedAt: null,
				program: { equals: programName, mode: 'insensitive' },
			},
		});
		if (duplicate) {
			return {
				success: false,
				message: 'Duplicate program: Program name already exists',
			};
		}

		const updated = await prisma.programs.update({
			where: { id: programId },
			data: { program: programName },
		});

		return {
			success: true,
			message: 'Program updated successfully',
			data: {
				programId: updated.id,
				programName: updated.program,
			},
		};
	}

	async deleteProgram(programId: string, workSpaceId: string): Promise<TransactionResult> {
		try {
			const existing = await prisma.programs.findFirst({
				where: { id: programId, workSpaceId, deletedAt: null },
			});

			if (!existing) {
				return { success: false, message: 'Program not found' };
			}

			await prisma.$transaction(async tx => {
				await tx.departments.updateMany({
					where: {
						programId,
						workSpaceId,
						deletedAt: null,
					},
					data: {
						deletedAt: new Date(),
					},
				});

				await tx.programs.update({
					where: { id: programId },
					data: { deletedAt: new Date() },
				});
			});

			return { success: true, message: 'Program and related departments deleted successfully' };
		} catch (error) {
			return {
				success: false,
				message: 'Failed to delete program',
			};
		}
	}
}

export default ProgramDao;
