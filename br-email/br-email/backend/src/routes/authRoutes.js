import { Router } from 'express';
import { z } from 'zod';
import { createUser, findUserByEmail, verifyPassword, getUserProfile } from '../services/userService.js';
import { createSession, getSessionByToken, revokeSession } from '../services/sessionService.js';
import { registerPublicKeys, getPublicKeysByUserId } from '../services/keyService.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/tokens.js';
import { requireAuth } from '../middleware/auth.js';

export const authRouter = Router();

const registerSchema = z.object({
  email: z.string().email(),
  displayName: z.string().min(2).max(80),
  passwordVerifier: z.string().min(32),
  deviceId: z.string().min(6),
  deviceName: z.string().min(2),
  publicEncryptionKey: z.string().min(32),
  publicSigningKey: z.string().min(32),
  fingerprint: z.string().min(16)
});

authRouter.post('/register', async (req, res) => {
  try {
    const payload = registerSchema.parse(req.body);
    const existing = await findUserByEmail(payload.email);
    if (existing) {
      return res.status(409).json({ error: 'E-mail já cadastrado' });
    }

    const user = await createUser(payload);
    await registerPublicKeys({ userId: user.id, ...payload });

    const accessToken = signAccessToken({ sub: user.id, email: user.email });
    const refreshToken = signRefreshToken({ sub: user.id, email: user.email });
    await createSession({
      userId: user.id,
      refreshToken,
      userAgent: req.headers['user-agent'] || 'unknown',
      ipAddress: req.ip
    });

    return res.status(201).json({
      user,
      keys: await getPublicKeysByUserId(user.id),
      accessToken,
      refreshToken
    });
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Payload inválido', details: error.issues });
    }
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Conflito de cadastro' });
    }
    return res.status(500).json({ error: 'Erro ao registrar usuário' });
  }
});

const loginSchema = z.object({
  email: z.string().email(),
  passwordVerifier: z.string().min(32)
});

authRouter.post('/login', async (req, res) => {
  try {
    const payload = loginSchema.parse(req.body);
    const user = await findUserByEmail(payload.email);

    if (!user) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const valid = await verifyPassword(payload.passwordVerifier, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const accessToken = signAccessToken({ sub: user.id, email: user.email });
    const refreshToken = signRefreshToken({ sub: user.id, email: user.email });
    await createSession({
      userId: user.id,
      refreshToken,
      userAgent: req.headers['user-agent'] || 'unknown',
      ipAddress: req.ip
    });

    return res.json({
      user: await getUserProfile(user.id),
      keys: await getPublicKeysByUserId(user.id),
      accessToken,
      refreshToken
    });
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Payload inválido', details: error.issues });
    }
    return res.status(500).json({ error: 'Erro ao autenticar' });
  }
});

const refreshSchema = z.object({ refreshToken: z.string().min(20) });
authRouter.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = refreshSchema.parse(req.body);
    const session = await getSessionByToken(refreshToken);
    if (!session || session.revoked_at || new Date(session.expires_at) < new Date()) {
      return res.status(401).json({ error: 'Sessão inválida' });
    }

    const payload = verifyRefreshToken(refreshToken);
    const accessToken = signAccessToken({ sub: payload.sub, email: payload.email });
    return res.json({ accessToken });
  } catch {
    return res.status(401).json({ error: 'Refresh token inválido' });
  }
});

authRouter.post('/logout', async (req, res) => {
  const refreshToken = req.body?.refreshToken;
  if (!refreshToken) {
    return res.status(204).end();
  }
  await revokeSession(refreshToken);
  return res.status(204).end();
});

authRouter.get('/me', requireAuth, async (req, res) => {
  const user = await getUserProfile(req.user.sub);
  const keys = await getPublicKeysByUserId(req.user.sub);
  return res.json({ user, keys });
});
