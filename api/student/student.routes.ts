/* eslint-disable @typescript-eslint/no-explicit-any */
import { API_METHODS } from '../../interface/api.interface';
import { IRouteOptions } from '../../interface/fastify.interface';
import { StudentController } from './student.controller';
import { deleteStudentSchemaJson } from './student.schema';

const studentController = new StudentController();

const routes: IRouteOptions<{
	Body: any;
	Params: any;
	Querystring: any;
}>[] = [
	{
		url: '/',
		handler: studentController.getStudentsHandler.bind(studentController),
		method: API_METHODS.GET,
		preHandler: [],
	},
	{
		url: '/programDepartments',
		handler: studentController.getProgramsWithDepartments.bind(studentController),
		method: API_METHODS.GET,
		preHandler: [],
	},
	{
		url: '/',
		handler: studentController.addStudentHandler.bind(studentController),
		method: API_METHODS.POST,
		preHandler: [],
	},

	{
		url: '/',
		handler: studentController.editStudentHandler.bind(studentController),
		method: API_METHODS.PUT,
		preHandler: [],
	},
	{
		url: '/:studentId',
		handler: studentController.deleteStudentHandler.bind(studentController),
		method: API_METHODS.DELETE,
		preHandler: [],
		schema: deleteStudentSchemaJson,
	},
];

export default routes;
