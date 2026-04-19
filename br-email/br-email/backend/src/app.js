import express from 'express';
import { commonSecurity, enforceTls } from './middleware/security.js';
import { healthRouter } from './routes/healthRoutes.js';
import { authRouter } from './routes/authRoutes.js';
import { keyRouter } from './routes/keyRoutes.js';
import { messageRouter } from './routes/messageRoutes.js';
import cors from 'cors';

export function createApp() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));
  app.use(commonSecurity);
  app.use(enforceTls);

  app.get('/', (_, res) => {
    res.json({
      name: 'br-email API',
      privacy: 'zero-knowledge',
      messageContentAccess: false
    });
  });

  app.use('/health', healthRouter);
  app.use('/api/auth', authRouter);
  app.use('/api/keys', keyRouter);
  app.use('/api/messages', messageRouter);

  app.use((_, res) => {
    res.status(404).json({ error: 'Rota não encontrada' });
  });

  return app;
}
