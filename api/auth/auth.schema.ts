import { z } from 'zod';

export const googleCallbackQuerySchema = z.object({
	code: z.string().optional(),
	error: z.string().optional(),
});

export const googleTokenSchema = z.object({
	token: z.string().min(1, 'Google token is required'),
});

export const jwtPayloadSchema = z.object({
	id: z.string().uuid(),
	email: z.string().email(),
	name: z.string(),
	roleId: z.string().uuid(),
	workspaceId: z.string().uuid(),
	userIdentifierKey: z.string(),
});

export const userPermissionSchema = z.object({
	module: z.string(),
	actions: z.array(z.string()),
});

export const profileResponseSchema = z.object({
	user: z.object({
		id: z.string().uuid(),
		email: z.string().email(),
		name: z.string(),
		roleId: z.string().uuid(),
		workspaceId: z.string().uuid(),
	}),
	permissions: z.array(userPermissionSchema),
});

export const emailPasswordLoginSchema = z.object({
	email: z.string().email('Valid email is required'),
	encryptedPassword: z.string().min(1, 'Encrypted password is required'),
});

export const setPasswordSchema = z.object({
	token: z.string().min(1, 'Token is required'),
	encryptedPassword: z.string().min(1, 'Encrypted password is required'),
});

export const forgotPasswordSchema = z.object({
	email: z.string().email('Valid email is required'),
});

export type GoogleCallbackQuery = z.infer<typeof googleCallbackQuerySchema>;
export type GoogleToken = z.infer<typeof googleTokenSchema>;
export type JwtPayload = z.infer<typeof jwtPayloadSchema>;
export type UserPermission = z.infer<typeof userPermissionSchema>;
export type ProfileResponse = z.infer<typeof profileResponseSchema>;
export type EmailPasswordLogin = z.infer<typeof emailPasswordLoginSchema>;
export type SetPassword = z.infer<typeof setPasswordSchema>;
export type ForgotPassword = z.infer<typeof forgotPasswordSchema>;
