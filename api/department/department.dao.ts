import { Prisma, PrismaClient } from '@prisma/client';
import {
	CreateDepartmentPayload,
	EditDepartmentPayload,
	DepartmentData,
	DepartmentResponse,
} from './department.interface';

const prisma = new PrismaClient();

type GetDepartmentsParams = {
	workSpaceId: string;
	programId?: string | null;
	search?: string | null;
	page?: number;
	limit?: number;
};

class DepartmentsDao {
	async createDepartment(
		payload: CreateDepartmentPayload,
		workSpaceId: string
	): Promise<DepartmentResponse<DepartmentData>> {
		const { programId, programName, departmentName } = payload;
		if (!programId && !programName) {
			return { success: false, message: 'Either programId or programName must be provided' };
		}

		const normalizedDept = departmentName.trim();

		try {
			const result = await prisma.$transaction(async tx => {
				let finalProgramId = programId ?? null;
				let finalProgramName = programName ?? null;

				if (!finalProgramId) {
					const existingProgram = await tx.programs.findFirst({
						where: {
							workSpaceId,
							deletedAt: null,
							program: { equals: finalProgramName!, mode: 'insensitive' },
						},
					});

					if (existingProgram) {
						finalProgramId = existingProgram.id;
						finalProgramName = existingProgram.program;
					} else {
						const createdProgram = await tx.programs.create({
							data: { program: finalProgramName!, workSpaceId },
						});
						finalProgramId = createdProgram.id;
						finalProgramName = createdProgram.program;
					}
				} else {
					const prog = await tx.programs.findFirst({
						where: { id: finalProgramId, workSpaceId, deletedAt: null },
					});
					if (!prog) {
						throw new Error('Program not found for provided programId');
					}
					finalProgramName = prog.program;
				}

				const existingDept = await tx.departments.findFirst({
					where: {
						workSpaceId,
						programId: finalProgramId,
						deletedAt: null,
						department: { equals: normalizedDept, mode: 'insensitive' },
					},
				});

				if (existingDept) {
					return {
						success: false,
						message: 'Duplicate department: Department already exists for selected program',
					};
				}

				const createdDept = await tx.departments.create({
					data: {
						programId: finalProgramId,
						workSpaceId,
						department: normalizedDept,
						isSystem: false,
					},
				});

				return {
					success: true,
					message: 'Department created successfully',
					data: {
						departmentId: createdDept.id,
						departmentName: createdDept.department,
						programId: finalProgramId!,
						programName: finalProgramName!,
					},
				};
			});

			return result;
		} catch (err: unknown) {
			const error = err as Error;
			return {
				success: false,
				message: error.message ?? 'Failed to create department',
				error,
			};
		}
	}

	async getDepartments(
		params: GetDepartmentsParams
	): Promise<DepartmentResponse<DepartmentData[]>> {
		const { workSpaceId, programId, search, page = 1, limit = 100 } = params;

		try {
			const whereClause: Prisma.DepartmentsWhereInput = {
				workSpaceId,
				deletedAt: null,
				...(programId && { programId }),
				...(search && {
					department: { contains: search, mode: 'insensitive' },
				}),
			};

			const skip = (page - 1) * limit;

			const departments = await prisma.departments.findMany({
				where: whereClause,
				include: { program: true },
				skip,
				take: limit,
				orderBy: { createdAt: 'desc' },
			});

			return {
				success: true,
				data: departments.map(d => ({
					departmentId: d.id,
					departmentName: d.department,
					programId: d.programId,
					programName: d.program?.program ?? '',
				})),
			};
		} catch (err: unknown) {
			const error = err as Error;
			return {
				success: false,
				message: error.message ?? 'Failed to fetch departments',
				error,
			};
		}
	}

	async editDepartment(
		payload: EditDepartmentPayload,
		workSpaceId: string
	): Promise<DepartmentResponse<DepartmentData>> {
		const { departmentId, programId, programName, departmentName } = payload;
		const normalizedDept = departmentName.trim();

		try {
			const result = await prisma.$transaction(async tx => {
				const existing = await tx.departments.findFirst({
					where: { id: departmentId, workSpaceId, deletedAt: null },
				});
				if (!existing) {
					return { success: false, message: 'Department not found' };
				}

				let targetProgramId = programId ?? existing.programId;
				let targetProgramName = programName ?? undefined;

				if (!targetProgramId && programName) {
					const existingProgram = await tx.programs.findFirst({
						where: {
							workSpaceId,
							deletedAt: null,
							program: { equals: programName, mode: 'insensitive' },
						},
					});

					if (existingProgram) {
						targetProgramId = existingProgram.id;
						targetProgramName = existingProgram.program;
					} else {
						const createdProg = await tx.programs.create({
							data: { program: programName, workSpaceId },
						});
						targetProgramId = createdProg.id;
						targetProgramName = createdProg.program;
					}
				}

				const dup = await tx.departments.findFirst({
					where: {
						id: { not: departmentId },
						workSpaceId,
						programId: targetProgramId,
						deletedAt: null,
						department: { equals: normalizedDept, mode: 'insensitive' },
					},
				});

				if (dup) {
					return {
						success: false,
						message: 'Duplicate department: already exists for selected program',
					};
				}

				const updated = await tx.departments.update({
					where: { id: departmentId },
					data: {
						department: normalizedDept,
						programId: targetProgramId,
					},
				});

				return {
					success: true,
					message: 'Department updated successfully',
					data: {
						departmentId: updated.id,
						departmentName: updated.department,
						programId: updated.programId,
						programName: targetProgramName ?? '',
					},
				};
			});

			return result;
		} catch (err: unknown) {
			const error = err as Error;
			return {
				success: false,
				message: error.message ?? 'Failed to update department',
				error,
			};
		}
	}

	async deleteDepartment(
		departmentId: string,
		workSpaceId: string
	): Promise<DepartmentResponse<null>> {
		try {
			const existing = await prisma.departments.findFirst({
				where: { id: departmentId, workSpaceId, deletedAt: null },
			});

			if (!existing) {
				return { success: false, message: 'Department not found' };
			}

			await prisma.departments.update({
				where: { id: departmentId },
				data: { deletedAt: new Date() },
			});

			return { success: true, message: 'Department deleted successfully' };
		} catch (err: unknown) {
			const error = err as Error;
			return {
				success: false,
				message: error.message ?? 'Failed to delete department',
				error,
			};
		}
	}
}

export default DepartmentsDao;
