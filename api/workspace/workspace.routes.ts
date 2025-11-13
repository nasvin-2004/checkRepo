/* eslint-disable @typescript-eslint/no-explicit-any */
//INTERNAL IMPORTS
import { API_METHODS } from '../../interface/api.interface';
import { IRouteOptions } from '../../interface/fastify.interface';
import WorkspaceController from './workspace.controller';

const controller = new WorkspaceController();

const routes: IRouteOptions<{
	Body: any;
	Params: any;
	Querystring: any;
}>[] = [
	{
		url: '/',
		handler: controller.getWorkspaceById.bind(controller),
		method: API_METHODS.GET,
		preHandler: [],
	},
];

export default routes;
