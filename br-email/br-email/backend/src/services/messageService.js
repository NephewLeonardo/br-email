import { query } from '../config/db.js';

export async function createMessage({ senderUserId, recipientUserId, envelope }) {
  const result = await query(
    `INSERT INTO messages (
      sender_user_id,
      recipient_user_id,
      sender_device_id,
      recipient_device_id,
      subject_hint,
      envelope,
      sent_at
    ) VALUES ($1, $2, $3, $4, $5, $6::jsonb, NOW())
    RETURNING id, sent_at`,
    [
      senderUserId,
      recipientUserId,
      envelope.senderDeviceId,
      envelope.recipientDeviceId,
      envelope.subjectHint || 'encrypted',
      JSON.stringify(envelope)
    ]
  );

  return result.rows[0];
}

export async function listInbox(userId, limit = 50) {
  const result = await query(
    `SELECT m.id, m.subject_hint, m.sent_at, m.read_at,
            sender.email AS sender_email, sender.display_name AS sender_name,
            recipient.email AS recipient_email,
            m.envelope
     FROM messages m
     JOIN users sender ON sender.id = m.sender_user_id
     JOIN users recipient ON recipient.id = m.recipient_user_id
     WHERE m.recipient_user_id = $1
     ORDER BY m.sent_at DESC
     LIMIT $2`,
    [userId, limit]
  );

  return result.rows;
}

export async function getMessageById(userId, messageId) {
  const result = await query(
    `SELECT m.id, m.subject_hint, m.sent_at, m.read_at,
            sender.email AS sender_email, sender.display_name AS sender_name,
            recipient.email AS recipient_email,
            m.envelope
     FROM messages m
     JOIN users sender ON sender.id = m.sender_user_id
     JOIN users recipient ON recipient.id = m.recipient_user_id
     WHERE m.id = $1 AND (m.recipient_user_id = $2 OR m.sender_user_id = $2)`,
    [messageId, userId]
  );

  return result.rows[0] || null;
}

export async function markAsRead(userId, messageId) {
  await query(
    `UPDATE messages SET read_at = NOW() WHERE id = $1 AND recipient_user_id = $2 AND read_at IS NULL`,
    [messageId, userId]
  );
}
