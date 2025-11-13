/* eslint-disable @typescript-eslint/no-explicit-any */
import { API_METHODS } from '../../interface/api.interface';
import { IRouteOptions } from '../../interface/fastify.interface';
import PlanController from './plan.controller';

const controller = new PlanController();

const routes: IRouteOptions<{
	Body: any;
	Params: any;
	Querystring: any;
}>[] = [
	{
		url: '/',
		method: API_METHODS.GET,
		handler: controller.getAllPlansHandler.bind(controller),
		preHandler: [],
	},
	{
		url: '/workspace-subscriptions',
		method: API_METHODS.GET,
		handler: controller.getWorkspaceSubscriptionsHandler.bind(controller),
		preHandler: [],
	},
	{
		url: '/current-active-plan',
		method: API_METHODS.GET,
		handler: controller.getCurrentWorkspaceActivePlanHandler.bind(controller),
		preHandler: [],
	},
];

export default routes;
