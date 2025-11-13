/* eslint-disable @typescript-eslint/no-explicit-any */
import { API_METHODS } from '../../interface/api.interface';
import { IRouteOptions } from '../../interface/fastify.interface';
import DepartmentsController from './department.controller';
import { createDepartmentSchemaJson, editDepartmentSchemaJson } from './department.schema';

const controller = new DepartmentsController();

const routes: IRouteOptions<{
	Body: any;
	Params: any;
	Querystring: any;
}>[] = [
	{
		url: '/',
		method: API_METHODS.GET,
		handler: controller.getDepartmentsHandler.bind(controller),
		preHandler: [],
	},
	{
		url: '/',
		method: API_METHODS.POST,
		schema: createDepartmentSchemaJson,
		handler: controller.createDepartmentHandler.bind(controller),
		preHandler: [],
	},
	{
		url: '/',
		method: API_METHODS.PUT,
		schema: editDepartmentSchemaJson,
		handler: controller.editDepartmentHandler.bind(controller),
		preHandler: [],
	},
	{
		url: '/:departmentId',
		method: API_METHODS.DELETE,
		handler: controller.deleteDepartmentHandler.bind(controller),
		preHandler: [],
	},
];

export default routes;
