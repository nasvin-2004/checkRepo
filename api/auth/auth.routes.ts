/* eslint-disable @typescript-eslint/no-explicit-any */
//INTERNAL IMPORTS
import { API_METHODS } from '../../interface/api.interface';
import { IRouteOptions } from '../../interface/fastify.interface';
import AuthController from './auth.controller';
import {
	googleTokenSchema,
	emailPasswordLoginSchema,
	setPasswordSchema,
	forgotPasswordSchema,
} from './auth.schema';
import { zodToJsonSchema } from 'zod-to-json-schema';

const controller = new AuthController();

const routes: IRouteOptions<{
	Body: any;
	Params: any;
	Querystring: any;
}>[] = [
	{
		url: '/google',
		handler: controller.googleAuthHandler.bind(controller),
		method: API_METHODS.GET,
	},
	{
		url: '/google/callback',
		handler: controller.googleCallbackHandler.bind(controller),
		method: API_METHODS.GET,
	},
	{
		url: '/loginWithGoogle',
		handler: controller.loginWithGoogleHandler.bind(controller),
		method: API_METHODS.POST,
		schema: {
			body: zodToJsonSchema(googleTokenSchema),
		},
	},
	{
		url: '/logout',
		handler: controller.logoutHandler.bind(controller),
		method: API_METHODS.GET,
		preHandler: [],
	},
	{
		url: '/profile',
		handler: controller.profileHandler.bind(controller),
		method: API_METHODS.GET,
		preHandler: [],
	},
	{
		url: '/verify',
		handler: controller.verifyHandler.bind(controller),
		method: API_METHODS.GET,
	},
	{
		url: '/public-key',
		handler: controller.getPublicKeyHandler.bind(controller),
		method: API_METHODS.GET,
	},
	{
		url: '/login',
		handler: controller.loginWithEmailPasswordHandler.bind(controller),
		method: API_METHODS.POST,
		schema: {
			body: zodToJsonSchema(emailPasswordLoginSchema),
		},
	},
	{
		url: '/set-password',
		handler: controller.setPasswordHandler.bind(controller),
		method: API_METHODS.POST,
		schema: {
			body: zodToJsonSchema(setPasswordSchema),
		},
	},
	{
		url: '/forgot-password',
		handler: controller.forgotPasswordHandler.bind(controller),
		method: API_METHODS.POST,
		schema: {
			body: zodToJsonSchema(forgotPasswordSchema),
		},
	},
	{
		url: '/validate-reset-token',
		handler: controller.validateResetTokenHandler.bind(controller),
		method: API_METHODS.GET,
	},
];

export default routes;
