import { Router } from 'express';
import { getPublicKeysByEmail, registerPublicKeys } from '../services/keyService.js';
import { requireAuth } from '../middleware/auth.js';

export const keyRouter = Router();

keyRouter.get('/:email', requireAuth, async (req, res) => {
  const keys = await getPublicKeysByEmail(req.params.email);
  if (!keys.length) {
    return res.status(404).json({ error: 'Usuário não encontrado' });
  }
  return res.json({ keys });
});

keyRouter.post('/register-device', requireAuth, async (req, res) => {
  const body = req.body;
  const record = await registerPublicKeys({
    userId: req.user.sub,
    deviceId: body.deviceId,
    deviceName: body.deviceName,
    publicEncryptionKey: body.publicEncryptionKey,
    publicSigningKey: body.publicSigningKey,
    fingerprint: body.fingerprint
  });

  return res.status(201).json({ key: record });
});
