/* eslint-disable @typescript-eslint/no-explicit-any */
import { API_METHODS } from '../../interface/api.interface';
import { IRouteOptions } from '../../interface/fastify.interface';
import StaffController from './staff.controller';
import { createStaffSchemaJson, editStaffSchemaJson } from './staff.schema';

const controller = new StaffController();

const routes: IRouteOptions<{
	Body: any;
	Params: any;
	Querystring: any;
}>[] = [
	{
		url: '/',
		handler: controller.getStaffsHandler.bind(controller),
		method: API_METHODS.GET,
		preHandler: [],
	},
	{
		url: '/',
		handler: controller.createStaffHandler.bind(controller),
		method: API_METHODS.POST,
		preHandler: [],
		schema: createStaffSchemaJson,
	},
	{
		url: '/',
		handler: controller.editStaffHandler.bind(controller),
		method: API_METHODS.PUT,
		preHandler: [],
		schema: editStaffSchemaJson,
	},
	{
		url: '/status',
		handler: controller.changeStaffStatusHandler.bind(controller),
		method: API_METHODS.PUT,
		preHandler: [],
	},
];

export default routes;
