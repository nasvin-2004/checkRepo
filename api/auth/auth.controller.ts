/* eslint-disable @typescript-eslint/no-explicit-any */
import { FastifyRequest, FastifyReply } from 'fastify';
import axios from 'axios';
import { GoogleAuthService } from './auth.dao';
import type { GoogleAuthQuery, UserPayload } from './auth.interface';
import type { GoogleToken, EmailPasswordLogin, SetPassword, ForgotPassword } from './auth.schema';
import { config } from '../../config';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { getTokenFromCookie } from '../../pre-handler/auth.prehandler';
import { RoleDAO } from '../role/role.dao';
import mailService from '../../services/mail.service';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI!;
const FRONTEND_URL = process.env.FRONTEND_URL!;
const roleDAO = new RoleDAO();

class AuthController {
	private googleAuthService = new GoogleAuthService();

	async googleAuthHandler(req: FastifyRequest, reply: FastifyReply) {
		const redirectTo = (req.query as GoogleAuthQuery).redirectTo || '/';
		const googleAuthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');

		googleAuthUrl.searchParams.set('client_id', GOOGLE_CLIENT_ID);
		googleAuthUrl.searchParams.set('redirect_uri', REDIRECT_URI);
		googleAuthUrl.searchParams.set('response_type', 'code');
		googleAuthUrl.searchParams.set('scope', 'openid email profile');
		googleAuthUrl.searchParams.set('access_type', 'offline');
		googleAuthUrl.searchParams.set('prompt', 'consent');
		googleAuthUrl.searchParams.set('state', redirectTo);

		return reply.redirect(googleAuthUrl.toString());
	}

	async googleCallbackHandler(req: FastifyRequest, reply: FastifyReply) {
		const { code } = req.query as GoogleAuthQuery;
		if (!code) return reply.code(400).send({ error: 'No authorization code provided by Google.' });

		try {
			const tokenRes = await axios.post(
				'https://oauth2.googleapis.com/token',
				new URLSearchParams({
					code,
					client_id: GOOGLE_CLIENT_ID,
					client_secret: GOOGLE_CLIENT_SECRET,
					redirect_uri: REDIRECT_URI,
					grant_type: 'authorization_code',
				}).toString(),
				{ headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
			);

			const tokenData = tokenRes.data;
			if (!tokenData.access_token) {
				return reply.code(400).send({ error: 'Failed to retrieve access token from Google.' });
			}

			const profileRes = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
				headers: { Authorization: `Bearer ${tokenData.access_token}` },
			});
			const profile = profileRes.data;

			const user = await this.googleAuthService.findUserByEmail(profile.email);
			if (!user) {
				req.log.info('User not found');
				return reply.send({ error: 'User not found' });
			}

			const userRole = await this.googleAuthService.getUserRoleWithWorkspace(user.id);
			if (!userRole) {
				req.log.info('User Role not found');
				return reply.send({ error: 'User Role not found' });
			}

			req.log.info({ user, userRole }, 'User and Role loaded');

			const oldSession = await this.googleAuthService.getSession(user.id);
			if (oldSession) {
				await this.googleAuthService.deleteSession(user.id);
			}

			// Generate user identifier key for Redis
			const userIdentifierKey = crypto.randomBytes(32).toString('hex');

			const jwtToken = jwt.sign(
				{
					id: user.id,
					email: user.email,
					name: user.name,
					roleId: userRole.roleId,
					workspaceId: userRole.workspaceId,
					userIdentifierKey: userIdentifierKey,
				},
				config.jwtSecret,
				{ expiresIn: '1h' }
			);

			await this.googleAuthService.saveSession(user.id, userIdentifierKey);

			// Send login notification email (non-blocking)
			const ipAddress =
				req.ip || req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || 'Unknown';
			const userAgent = req.headers['user-agent'] || 'Unknown';
			mailService
				.sendLoginNotification({
					name: user.name,
					email: user.email,
					loginMethod: 'google',
					loginTime: new Date().toLocaleString('en-US', {
						timeZone: 'UTC',
						dateStyle: 'full',
						timeStyle: 'long',
					}),
					ipAddress: Array.isArray(ipAddress) ? ipAddress[0] : ipAddress,
					userAgent: userAgent,
				})
				.catch(err => {
					req.log.error({ error: err }, 'Failed to send login notification email');
				});

			reply.setCookie('token', jwtToken, {
				httpOnly: true,
				secure: false,
				path: '/',
				maxAge: 60 * 60,
				sameSite: 'lax',
			});

			return reply.redirect(`${FRONTEND_URL}/dashboard`);
		} catch (err) {
			req.log.error(err);
			return reply.code(500).send({ error: 'Google Authentication Failed.' });
		}
	}

	async loginWithGoogleHandler(req: FastifyRequest, reply: FastifyReply) {
		const { token } = req.body as GoogleToken;

		if (!token) {
			return reply.code(400).send({ error: 'Google token is required' });
		}

		try {
			// Verify the Google OAuth token
			const ticket = await this.googleAuthService.verifyOAuthToken(token);
			const payload = ticket.getPayload();

			if (!payload) {
				return reply.code(400).send({ error: 'Invalid Google token payload' });
			}

			const email = payload.email;
			if (!email) {
				return reply.code(400).send({ error: 'Email not found in Google token' });
			}

			// Find user by email
			const user = await this.googleAuthService.findUserByEmail(email);
			if (!user) {
				return reply.code(404).send({ error: 'User not found' });
			}

			// Get user role and workspace
			const userRole = await this.googleAuthService.getUserRoleWithWorkspace(user.id);
			if (!userRole) {
				return reply.code(404).send({ error: 'User Role not found' });
			}

			req.log.info({ user, userRole }, 'User and Role loaded');

			// Generate user identifier key for Redis
			const userIdentifierKey = crypto.randomBytes(32).toString('hex');

			// Set expiry to 1 day
			const expiry_1d = new Date();
			expiry_1d.setDate(expiry_1d.getDate() + 1);

			// Generate JWT token with user identifier using jsonwebtoken
			const jwtToken = jwt.sign(
				{
					id: user.id,
					email: user.email,
					name: user.name,
					roleId: userRole.roleId,
					workspaceId: userRole.workspaceId,
					userIdentifierKey: userIdentifierKey,
				},
				config.jwtSecret,
				{ expiresIn: '12h' }
			);

			// Set cookie with security options
			reply.setCookie('token', jwtToken, {
				path: '/',
				expires: expiry_1d,
				httpOnly: true, // Prevents XSS attacks
				secure: true, // HTTPS only
				sameSite: 'none', // CSRF protection
				domain: 'quickrecruit.com',
				priority: 'high',
			});

			// Store user identifier in Redis using DAO
			await this.googleAuthService.saveSession(user.id, userIdentifierKey);

			// Get user modules and permissions
			const modules = await roleDAO.getModulesWithActionsByRoleId(userRole.roleId);
			const plans = await this.googleAuthService.getWorkspaceModuleAccess(userRole.workspaceId);

			// Send login notification email (non-blocking)
			const ipAddress =
				req.ip || req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || 'Unknown';
			const userAgent = req.headers['user-agent'] || 'Unknown';
			mailService
				.sendLoginNotification({
					name: user.name,
					email: user.email,
					loginMethod: 'google',
					loginTime: new Date().toLocaleString('en-US', {
						timeZone: 'UTC',
						dateStyle: 'full',
						timeStyle: 'long',
					}),
					ipAddress: Array.isArray(ipAddress) ? ipAddress[0] : ipAddress,
					userAgent: userAgent,
				})
				.catch(err => {
					req.log.error({ error: err }, 'Failed to send login notification email');
				});

			// Return token and user details
			return reply.send({
				token: jwtToken,
				user: {
					id: user.id,
					email: user.email,
					name: user.name,
					roleId: userRole.roleId,
					workspaceId: userRole.workspaceId,
				},
				modules,
				plans,
			});
		} catch (err) {
			req.log.error(err);
			return reply.code(500).send({ error: 'Google Authentication Failed.' });
		}
	}

	async logoutHandler(req: FastifyRequest, reply: FastifyReply) {
		const user = (req as { user?: UserPayload }).user;

		if (user?.id) {
			// Delete session using DAO
			await this.googleAuthService.deleteSession(user.id);
		}

		// Clear cookie with same options used when setting it
		reply.clearCookie('token', {
			path: '/',
			httpOnly: true,
			secure: true,
			sameSite: 'none',
			domain: 'quickrecruit.com',
		});
		return reply.code(200).send({ message: 'Logged out Successfully.' });
	}

	async profileHandler(req: FastifyRequest, reply: FastifyReply) {
		const user = (req as { user?: UserPayload }).user;
		if (!user) return reply.code(401).send({ error: 'Unauthorized access. Please log in.' });
		const profileData = await this.googleAuthService.getUserProfile(
			user.id,
			user.roleId,
			user.workspaceId
		);
		reply.send({ profile: profileData });
	}

	async verifyHandler(req: FastifyRequest, reply: FastifyReply) {
		try {
			// Get token from cookie/headers
			const token = await getTokenFromCookie(req);
			if (!token) {
				return reply.code(401).send({ error: 'No token provided' });
			}

			// Verify JWT token using jsonwebtoken
			const decoded = jwt.verify(token, config.jwtSecret) as any;

			// Get user role and workspace information
			const userRole = await this.googleAuthService.getUserRoleWithWorkspace(decoded.id);
			if (!userRole) {
				return reply.code(404).send({ error: 'User Role not found' });
			}

			// Get user modules and permissions
			const modules = await roleDAO.getModulesWithActionsByRoleId(userRole.roleId);
			const plans = await this.googleAuthService.getWorkspaceModuleAccess(userRole.workspaceId);

			// Return token and user details
			return reply.send({
				user: {
					id: decoded.id,
					email: decoded.email,
					name: decoded.name,
					roleId: userRole.roleId,
					workspaceId: userRole.workspaceId,
				},
				modules,
				plans,
				// plans: [
				//     {
				//         module: "STUDENTS",
				//         access: false,
				//     },
				// 	{
				//         module: "STAFF",
				//         access: true,
				//     }
				// ]
			});
		} catch (err) {
			req.log.error(err);
			return reply.code(401).send({ error: 'Invalid or expired token' });
		}
	}

	async getPublicKeyHandler(req: FastifyRequest, reply: FastifyReply) {
		try {
			// eslint-disable-next-line no-console
			console.log('public key', config.passwordPublicKey);

			if (!config.passwordPublicKey) {
				return reply.code(500).send({ error: 'Public key not configured' });
			}
			return reply.send({ publicKey: config.passwordPublicKey });
		} catch (err) {
			req.log.error(err);
			return reply.code(500).send({ error: 'Failed to retrieve public key' });
		}
	}

	async loginWithEmailPasswordHandler(req: FastifyRequest, reply: FastifyReply) {
		const { email, encryptedPassword } = req.body as EmailPasswordLogin;

		if (!email || !encryptedPassword) {
			return reply.code(400).send({ error: 'Email and encrypted password are required' });
		}

		try {
			// Decrypt the password using private key
			if (!config.passwordPrivateKey) {
				return reply.code(500).send({ error: 'Private key not configured' });
			}

			let decryptedPassword: string;
			try {
				const buffer = Buffer.from(encryptedPassword, 'base64');
				// Use OAEP padding to match Web Crypto API (RSA-OAEP with SHA-256)
				decryptedPassword = crypto
					.privateDecrypt(
						{
							key: config.passwordPrivateKey,
							padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
							oaepHash: 'sha256',
						},
						buffer
					)
					.toString('utf8');
			} catch (decryptError) {
				req.log.error(decryptError);
				return reply.code(400).send({ error: 'Failed to decrypt password' });
			}

			// Find user by email
			const user = await this.googleAuthService.findUserByEmail(email);
			if (!user) {
				return reply.code(404).send({ error: 'User not found' });
			}

			if (user.status !== 'ACTIVE') {
				return reply.code(403).send({ error: 'User account is not active' });
			}

			if (!user.password) {
				return reply.code(400).send({ error: 'Password not set for this user' });
			}

			// Verify password
			const isPasswordValid = await this.googleAuthService.verifyPassword(
				decryptedPassword,
				user.password
			);
			console.log('isPasswordValid', isPasswordValid);
			console.log('decryptedPassword', decryptedPassword);
			console.log(await this.googleAuthService.hashPassword('QConnect@123'));

			if (!isPasswordValid) {
				return reply.code(401).send({ error: 'Invalid email or password' });
			}

			// Get user role and workspace
			const userRole = await this.googleAuthService.getUserRoleWithWorkspace(user.id);
			if (!userRole) {
				return reply.code(404).send({ error: 'User Role not found' });
			}

			req.log.info({ user, userRole }, 'User and Role loaded');

			// Generate user identifier key for Redis
			const userIdentifierKey = crypto.randomBytes(32).toString('hex');

			// Set expiry to 1 day
			const expiry_1d = new Date();
			expiry_1d.setDate(expiry_1d.getDate() + 1);

			// Generate JWT token with user identifier using jsonwebtoken
			const jwtToken = jwt.sign(
				{
					id: user.id,
					email: user.email,
					name: user.name,
					roleId: userRole.roleId,
					workspaceId: userRole.workspaceId,
					userIdentifierKey: userIdentifierKey,
				},
				config.jwtSecret,
				{ expiresIn: '12h' }
			);

			// Set cookie with security options
			reply.setCookie('token', jwtToken, {
				path: '/',
				expires: expiry_1d,
				httpOnly: true, // Prevents XSS attacks
				secure: true, // HTTPS only
				sameSite: 'none', // CSRF protection
				domain: 'quickrecruit.com',
				priority: 'high',
			});

			// Store user identifier in Redis using DAO
			await this.googleAuthService.saveSession(user.id, userIdentifierKey);

			// Get user modules and permissions
			const modules = await roleDAO.getModulesWithActionsByRoleId(userRole.roleId);
			const plans = await this.googleAuthService.getWorkspaceModuleAccess(userRole.workspaceId);

			// Send login notification email (non-blocking)
			const ipAddress =
				req.ip || req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || 'Unknown';
			const userAgent = req.headers['user-agent'] || 'Unknown';
			mailService
				.sendLoginNotification({
					name: user.name,
					email: user.email,
					loginMethod: 'password',
					loginTime: new Date().toLocaleString('en-US', {
						timeZone: 'UTC',
						dateStyle: 'full',
						timeStyle: 'long',
					}),
					ipAddress: Array.isArray(ipAddress) ? ipAddress[0] : ipAddress,
					userAgent: userAgent,
				})
				.catch(err => {
					req.log.error({ error: err }, 'Failed to send login notification email');
				});

			// Return token and user details
			return reply.send({
				token: jwtToken,
				user: {
					id: user.id,
					email: user.email,
					name: user.name,
					roleId: userRole.roleId,
					workspaceId: userRole.workspaceId,
				},
				modules,
				plans,
			});
		} catch (err) {
			req.log.error(err);
			return reply.code(500).send({ error: 'Login failed' });
		}
	}

	async setPasswordHandler(req: FastifyRequest, reply: FastifyReply) {
		const { token, encryptedPassword } = req.body as SetPassword;

		if (!token || !encryptedPassword) {
			return reply.code(400).send({ error: 'Token and encrypted password are required' });
		}

		try {
			// Validate token from Redis first
			const userId = await this.googleAuthService.getPasswordResetToken(token);
			if (!userId) {
				return reply.code(401).send({
					error: 'Invalid or expired token. Please request a new password reset link.',
				});
			}

			// Decrypt the password using private key
			if (!config.passwordPrivateKey) {
				return reply.code(500).send({ error: 'Private key not configured' });
			}

			let decryptedPassword: string;
			try {
				const buffer = Buffer.from(encryptedPassword, 'base64');
				decryptedPassword = crypto
					.privateDecrypt(
						{
							key: config.passwordPrivateKey,
							padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
							oaepHash: 'sha256',
						},
						buffer
					)
					.toString('utf8');
			} catch (decryptError) {
				req.log.error(decryptError);
				return reply.code(400).send({ error: 'Failed to decrypt password' });
			}

			// Validate password strength
			if (decryptedPassword.length < 8) {
				return reply.code(400).send({ error: 'Password must be at least 8 characters long' });
			}

			// Check if user exists
			const user = await this.googleAuthService.findUserById(userId);
			if (!user) {
				// Delete token if user not found
				await this.googleAuthService.deletePasswordResetToken(token);
				return reply.code(404).send({ error: 'User not found' });
			}

			// Hash the new password
			const hashedPassword = await this.googleAuthService.hashPassword(decryptedPassword);

			// Update user password
			await this.googleAuthService.updateUserPassword(userId, hashedPassword);

			// Delete the reset token after successful password change
			await this.googleAuthService.deletePasswordResetToken(token);

			return reply.send({ message: 'Password set successfully' });
		} catch (err) {
			req.log.error(err);
			return reply.code(500).send({ error: 'Failed to set password' });
		}
	}

	async forgotPasswordHandler(req: FastifyRequest, reply: FastifyReply) {
		const { email } = req.body as ForgotPassword;

		if (!email) {
			return reply.code(400).send({ error: 'Email is required' });
		}

		try {
			// Find user by email
			const user = await this.googleAuthService.findUserByEmail(email);

			// Always return success message to prevent email enumeration
			// Don't reveal if user exists or not
			if (!user) {
				// Return success even if user doesn't exist (security best practice)
				return reply.send({
					message: 'If an account with that email exists, a password reset link has been sent.',
				});
			}

			if (user.status !== 'ACTIVE') {
				// Still return success to prevent revealing account status
				return reply.send({
					message: 'If an account with that email exists, a password reset link has been sent.',
				});
			}

			// Generate secure random token
			const resetToken = crypto.randomBytes(32).toString('hex');

			// Store token in Redis with 10 minutes expiry (600 seconds)
			const expiresInSeconds = 10 * 60; // 10 minutes
			await this.googleAuthService.savePasswordResetToken(resetToken, user.id, expiresInSeconds);

			// Generate reset link
			const resetLink = `${config.frontendUrl}/set-password?token=${resetToken}`;

			// Send email with reset link (non-blocking)
			mailService
				.sendPasswordResetEmail({
					name: user.name,
					email: user.email,
					resetLink: resetLink,
				})
				.catch(err => {
					req.log.error({ error: err }, 'Failed to send password reset email');
				});

			req.log.info({ email: user.email }, 'Password reset link generated and sent');

			return reply.send({
				message: 'If an account with that email exists, a password reset link has been sent.',
			});
		} catch (err) {
			req.log.error(err);
			// Still return success to prevent revealing errors
			return reply.send({
				message: 'If an account with that email exists, a password reset link has been sent.',
			});
		}
	}

	async validateResetTokenHandler(req: FastifyRequest, reply: FastifyReply) {
		const { token } = req.query as { token: string };

		if (!token) {
			return reply.code(400).send({ valid: false, message: 'Token is required' });
		}

		try {
			// Check if token exists in Redis
			const userId = await this.googleAuthService.getPasswordResetToken(token);

			if (!userId) {
				return reply.send({
					valid: false,
					message: 'Invalid or expired token. Please request a new password reset link.',
				});
			}

			// Token is valid
			return reply.send({
				valid: true,
				message: 'Token is valid',
			});
		} catch (err) {
			req.log.error(err);
			return reply.code(500).send({
				valid: false,
				message: 'Error validating token',
			});
		}
	}
}

export default AuthController;
