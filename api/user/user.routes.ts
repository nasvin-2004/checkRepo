/* eslint-disable @typescript-eslint/no-explicit-any */
import { API_METHODS } from '../../interface/api.interface';
import { IRouteOptions } from '../../interface/fastify.interface';
import UserController from './user.controller';
import { createUserSchemaJson, editUserSchemaJson } from './user.schema';

const controller = new UserController();

const routes: IRouteOptions<{
	Body: any;
	Params: any;
	Querystring: any;
}>[] = [
	{
		url: '/',
		handler: controller.getUsersHandler.bind(controller),
		method: API_METHODS.GET,
		preHandler: [],
	},
	{
		url: '/',
		handler: controller.createUserHandler.bind(controller),
		method: API_METHODS.POST,
		preHandler: [],
		schema: createUserSchemaJson,
	},
	{
		url: '/',
		handler: controller.editUserHandler.bind(controller),
		method: API_METHODS.PUT,
		preHandler: [],
		schema: editUserSchemaJson,
	},
	{
		url: '/status',
		handler: controller.changeUserStatusHandler.bind(controller),
		method: API_METHODS.PUT,
		preHandler: [],
	},
];

export default routes;
