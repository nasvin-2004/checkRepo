/* eslint-disable @typescript-eslint/no-explicit-any */
import zodToJsonSchema from 'zod-to-json-schema';
import { API_METHODS } from '../../interface/api.interface';
import { IRouteOptions } from '../../interface/fastify.interface';
import { RoleController } from './role.controller';
import { createRoleSchema, getRolesSchema, updateRolePermissionsSchema } from './role.schema';

const roleController = new RoleController();

const routes: IRouteOptions<{
	Body: any;
	Params: any;
	Querystring: any;
}>[] = [
	{
		url: '/me/modules',
		handler: roleController.getRoleModulesHandler.bind(roleController),
		method: API_METHODS.GET,
		preHandler: [],
	},
	{
		url: '/modules-with-actions',
		handler: roleController.getModulesWithActionsHandler.bind(roleController),
		method: API_METHODS.GET,
		preHandler: [],
	},
	{
		url: '/roles',
		handler: roleController.getRoles.bind(roleController),
		method: API_METHODS.GET,
		preHandler: [],
	},
	{
		url: '/:roleId/modules-with-actions',
		handler: roleController.getModulesAndActionsByRoleId.bind(roleController),
		method: API_METHODS.GET,
		preHandler: [],
	},
	{
		url: '/:roleId/update-permissions',
		handler: roleController.updateRolePermissionsHandler.bind(roleController),
		method: API_METHODS.POST,
		preHandler: [],
		schema: updateRolePermissionsSchema,
	},
	{
		url: '/create',
		handler: roleController.createRoleHandler.bind(roleController),
		method: API_METHODS.POST,
		preHandler: [],
		schema: { body: zodToJsonSchema(createRoleSchema) },
	},
	{
		url: '/:roleId',
		handler: roleController.deleteRoleHandler.bind(roleController),
		method: API_METHODS.DELETE,
		preHandler: [],
	},
	{
		url: '/forUser',
		handler: roleController.getRolesFilter.bind(roleController),
		method: API_METHODS.GET,
		preHandler: [],
		schema: getRolesSchema,
	},
];

export default routes;
