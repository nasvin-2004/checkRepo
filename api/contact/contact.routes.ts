/* eslint-disable @typescript-eslint/no-explicit-any */
//INTERNAL IMPORTS
import { API_METHODS } from '../../interface/api.interface';
import { IRouteOptions } from '../../interface/fastify.interface';
import { ContactController } from './contact.controller';
import { createContactJsonSchema } from './contact.schema';

const contactController = new ContactController();

const routes: IRouteOptions<{
	Body: any;
	Params: any;
	Querystring: any;
}>[] = [
	{
		url: '/',
		handler: contactController.createContactHandler.bind(contactController),
		method: API_METHODS.POST,
		schema: { body: createContactJsonSchema },
	},
	{
		url: '/',
		handler: contactController.getAllContactsHandler.bind(contactController),
		method: API_METHODS.GET,
	},
];

export default routes;
