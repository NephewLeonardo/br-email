import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';

export const commonSecurity = [
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
  }),
  cors({
    origin: env.corsOrigin,
    credentials: true
  }),
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false
  })
];

export function enforceTls(req, res, next) {
  if (!env.forceTls || env.nodeEnv !== 'production') {
    return next();
  }

  const proto = req.headers['x-forwarded-proto'];
  if (proto === 'https') {
    return next();
  }

  return res.status(400).json({ error: 'TLS obrigatório' });
}
