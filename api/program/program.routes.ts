/* eslint-disable @typescript-eslint/no-explicit-any */
import { API_METHODS } from '../../interface/api.interface';
import { IRouteOptions } from '../../interface/fastify.interface';
import ProgramController from './program.controller';
import { createProgramSchemaJson, editProgramSchemaJson } from './program.schema';

const controller = new ProgramController();

const routes: IRouteOptions<{
	Body: any;
	Params: any;
	Querystring: any;
}>[] = [
	{
		url: '/',
		method: API_METHODS.GET,
		handler: controller.getProgramsHandler.bind(controller),
		preHandler: [],
	},
	{
		url: '/',
		method: API_METHODS.POST,
		schema: createProgramSchemaJson,
		handler: controller.createProgramHandler.bind(controller),
		preHandler: [],
	},
	{
		url: '/',
		method: API_METHODS.PUT,
		schema: editProgramSchemaJson,
		handler: controller.editProgramHandler.bind(controller),
		preHandler: [],
	},
	{
		url: '/:programId',
		method: API_METHODS.DELETE,
		handler: controller.deleteProgramHandler.bind(controller),
		preHandler: [],
	},
];

export default routes;
