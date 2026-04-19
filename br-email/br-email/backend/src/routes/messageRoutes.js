import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth.js';
import { createMessage, getMessageById, listInbox, markAsRead } from '../services/messageService.js';
import { findUserByEmail } from '../services/userService.js';

export const messageRouter = Router();
messageRouter.use(requireAuth);

const sendSchema = z.object({
  to: z.string().email(),
  envelope: z.object({
    senderDeviceId: z.string().min(3),
    recipientDeviceId: z.string().min(3),
    nonce: z.string().min(8),
    subjectHint: z.string().max(64).optional(),
    encryptedSubject: z.string().min(8),
    encryptedBody: z.string().min(8),
    signature: z.string().min(8),
    ephemeralPublicKey: z.string().min(8),
    version: z.string().default('1')
  })
});

messageRouter.post('/', async (req, res) => {
  try {
    const payload = sendSchema.parse(req.body);
    const recipient = await findUserByEmail(payload.to);
    if (!recipient) {
      return res.status(404).json({ error: 'Destinatário não encontrado' });
    }

    const record = await createMessage({
      senderUserId: req.user.sub,
      recipientUserId: recipient.id,
      envelope: payload.envelope
    });

    return res.status(201).json({ id: record.id, sentAt: record.sent_at });
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Payload inválido', details: error.issues });
    }
    return res.status(500).json({ error: 'Erro ao enviar mensagem' });
  }
});

messageRouter.get('/', async (req, res) => {
  const items = await listInbox(req.user.sub, Number(req.query.limit || 50));
  return res.json({ items });
});

messageRouter.get('/:id', async (req, res) => {
  const item = await getMessageById(req.user.sub, req.params.id);
  if (!item) {
    return res.status(404).json({ error: 'Mensagem não encontrada' });
  }
  await markAsRead(req.user.sub, req.params.id);
  return res.json({ item });
});
