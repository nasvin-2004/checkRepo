import { Prisma, UserStatus } from '@prisma/client';
import { prisma } from '../../../prisma/prisma';

import {
	AddStudentPayload,
	DeleteStudentParams,
	EditStudentPayload,
	GetStudentsParams,
	TransactionResult,
	StudentResponse,
	PaginatedStudents,
	ProgramWithDepartments,
} from './student.interface';

export class StudentDAO {
	async addStudent(workspaceId: string, payload: AddStudentPayload): Promise<TransactionResult> {
		try {
			const {
				name,
				email,
				rollNumber,
				departmentId,
				graduationYear,
				batch,
				section,
				admissionNumber,
				phoneNumber,
			} = payload;

			const existingUser = await prisma.user.findUnique({ where: { email } });
			if (existingUser) {
				return { success: false, message: 'Duplicate user: email already exists' };
			}

			// ✅ Fetch current student count
			const studentCount = await prisma.student.count({
				where: { workspaceId, deletedAt: null },
			});
			// ✅ Fetch active plan credits for workspace
			const activePlans = await prisma.workspacePlanSubscription.findMany({
				where: {
					workspaceId,
					active: true,
				},
				include: {
					plan: {
						include: {
							features: {
								include: {
									identifier: true,
								},
							},
						},
					},
				},
			});
			// ✅ Sum credit features (only type: CREDIT)
			const totalCredits = activePlans.reduce((sum, sub) => {
				const featureCredits = sub.plan.features
					.filter(f => f.identifier.type === 'CREDIT')
					.reduce((acc, cf) => acc + (cf.valueInt ?? 0), 0);
				return sum + featureCredits;
			}, 0);
			// ✅ Block if credit exhausted
			if (studentCount >= totalCredits) {
				return {
					success: false,
					message: 'Student limit reached. Upgrade plan to add more students!',
					limitReached: true,
				};
			}

			const studentRole = await prisma.role.findFirst({
				where: { code: 'STUDENT', deletedAt: null },
				select: { id: true },
			});

			if (!studentRole?.id) {
				return { success: false, message: 'Student role not found for this workspace' };
			}

			const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
				const user = await tx.user.create({
					data: {
						name,
						email,
						status: UserStatus.ACTIVE,
					},
				});

				await tx.userRole.create({
					data: { userId: user.id, roleId: studentRole.id, workspaceId },
				});

				await tx.userWorkspace.create({
					data: { userId: user.id, workspaceId },
				});

				const student = await tx.student.create({
					data: {
						userId: user.id,
						workspaceId,
						email,
						rollNumber,
						departmentId,
						graduationYear,
						batch,
						section,
						admissionNumber,
						phoneNumber,
					},
					include: { user: true },
				});

				return {
					success: true,
					message: 'Student added successfully',
					data: {
						id: student.id,
						userId: student.userId,
						name: student.user?.name,
						email: student.email,
						status: student.user?.status,
					},
				};
			});

			return result;
		} catch (error) {
			return { success: false, message: 'Failed to add student' };
		}
	}

	async getStudents(
		workspaceId: string,
		params: GetStudentsParams
	): Promise<TransactionResult<PaginatedStudents>> {
		try {
			const { page = 1, limit = 10, search, departmentId, status } = params;

			const skip = (Number(page) - 1) * Number(limit);
			const take = Number(limit);

			const where: Prisma.StudentWhereInput = {
				workspaceId,
				deletedAt: null,
				AND: [],
			};

			if (search) {
				(where.AND as Prisma.StudentWhereInput[]).push({
					OR: [
						{ rollNumber: { contains: search, mode: 'insensitive' } },
						{ email: { contains: search, mode: 'insensitive' } },
						{
							user: {
								name: { contains: search, mode: 'insensitive' },
							},
						},
					],
				});
			}

			if (departmentId) {
				(where.AND as Prisma.StudentWhereInput[]).push({ departmentId });
			}

			if (status) {
				(where.AND as Prisma.StudentWhereInput[]).push({
					user: { status: status as UserStatus },
				});
			}

			const [students, totalCount] = await Promise.all([
				prisma.student.findMany({
					where,
					skip,
					take,
					include: {
						user: { select: { id: true, name: true, email: true, status: true } },
						department: {
							select: {
								id: true,
								department: true,
								program: { select: { id: true, program: true } },
							},
						},
					},
					orderBy: { createdAt: 'desc' },
				}),
				prisma.student.count({ where }),
			]);

			const formattedStudents: StudentResponse[] = students.map(s => ({
				studentId: s.id,
				userId: s.user?.id,
				name: s.user?.name || '-',
				email: s.user?.email || s.email,
				rollNumber: s.rollNumber || '-',
				departmentId: s.departmentId,
				department: s.department?.department || '-',
				program: s.department?.program?.program || '-',
				section: s.section || '-',
				graduationYear: s.graduationYear || null,
				batch: s.batch || '-',
				admissionNumber: s.admissionNumber || '-',
				phoneNumber: s.phoneNumber || '-',
				status: s.user?.status || 'INACTIVE',
			}));

			return {
				success: true,
				message: 'Students fetched successfully',
				data: {
					students: formattedStudents,
					meta: {
						total: totalCount,
						page: Number(page),
						totalPages: Math.ceil(totalCount / take),
						limit: take,
					},
				},
			};
		} catch {
			return { success: false, message: 'Failed to fetch students' };
		}
	}

	// async updateStudent(payload: EditStudentPayload): Promise<TransactionResult> {
	// 	try {
	// 		const { studentId, userId, email, ...updateFields } = payload;

	// 		const existingStudent = await prisma.student.findUnique({ where: { id: studentId } });
	// 		if (!existingStudent) return { success: false, message: 'Student not found' };

	// 		if (email) {
	// 			const existingUser = await prisma.user.findUnique({ where: { email } });
	// 			if (existingUser && existingUser.id !== userId) {
	// 				return { success: false, message: 'Duplicate email exists' };
	// 			}
	// 		}

	// 		const updatedStudent = await prisma.student.update({
	// 			where: { id: studentId },
	// 			data: { email, ...updateFields },
	// 			include: { user: true, department: true },
	// 		});

	// 		return {
	// 			success: true,
	// 			message: 'Student updated successfully',
	// 			data: {
	// 				studentId: updatedStudent.id,
	// 				userId: updatedStudent.userId,
	// 				name: updatedStudent.user?.name,
	// 				email: updatedStudent.email,
	// 				status: updatedStudent.user?.status,
	// 			},
	// 		};
	// 	} catch (error) {
	// 		return { success: false, message: 'Failed to update student' };
	// 	}
	// }

	async updateStudent(payload: EditStudentPayload): Promise<TransactionResult> {
		try {
			const { studentId, userId, email, name, phoneNumber, ...studentFields } = payload;
			if (!studentId) {
				return { success: false, message: 'studentId is required' };
			}
			const existingStudent = await prisma.student.findUnique({
				where: { id: studentId },
				include: { user: true },
			});
			if (!existingStudent) {
				return { success: false, message: 'Student not found' };
			}
			// Email duplicate validation
			if (email) {
				const existingUser = await prisma.user.findUnique({ where: { email } });
				if (existingUser && existingUser.id !== userId) {
					return { success: false, message: 'Duplicate email exists' };
				}
			}
			const updatedStudent = await prisma.$transaction(async tx => {
				await tx.user.update({
					where: { id: userId },
					data: {
						name,
						email,
						phoneNumber,
					},
				});
				return await tx.student.update({
					where: { id: studentId },
					data: {
						email,
						phoneNumber,
						...studentFields,
					},
					include: { user: true, department: true },
				});
			});
			return {
				success: true,
				message: 'Student updated successfully',
				data: {
					studentId: updatedStudent.id,
					userId: updatedStudent.userId,
					name: updatedStudent.user?.name,
					email: updatedStudent.email,
					status: updatedStudent.user?.status,
				},
			};
		} catch (error) {
			return {
				success: false,
				message: 'Failed to update student',
			};
		}
	}

	async deleteStudent({ studentId }: DeleteStudentParams): Promise<TransactionResult> {
		try {
			const student = await prisma.student.findUnique({ where: { id: studentId } });
			if (!student) return { success: false, message: 'Student not found' };

			await prisma.student.update({
				where: { id: studentId },
				data: { deletedAt: new Date() },
			});

			return { success: true, message: 'Student deleted successfully' };
		} catch (error) {
			return { success: false, message: 'Failed to delete student' };
		}
	}

	async getProgramsWithDepartments(
		workspaceId: string
	): Promise<TransactionResult<ProgramWithDepartments[]>> {
		try {
			const programs = await prisma.programs.findMany({
				where: { workSpaceId: workspaceId, deletedAt: null },
				include: {
					departments: {
						where: { deletedAt: null },
						select: { id: true, department: true },
					},
				},
			});

			const formatted: ProgramWithDepartments[] = programs.map(p => ({
				programId: p.id,
				programName: p.program,
				departments: p.departments.map(d => ({
					id: d.id,
					name: d.department,
				})),
			}));

			return {
				success: true,
				message: 'Programs fetched successfully',
				data: formatted,
			};
		} catch {
			return { success: false, message: 'Failed to fetch programs' };
		}
	}
}
