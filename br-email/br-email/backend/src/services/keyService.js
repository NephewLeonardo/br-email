import { query } from '../config/db.js';

export async function registerPublicKeys({ userId, deviceId, deviceName, publicEncryptionKey, publicSigningKey, fingerprint }) {
  const result = await query(
    `INSERT INTO keys (user_id, device_id, device_name, public_encryption_key, public_signing_key, fingerprint)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (user_id, device_id)
     DO UPDATE SET device_name = EXCLUDED.device_name,
                   public_encryption_key = EXCLUDED.public_encryption_key,
                   public_signing_key = EXCLUDED.public_signing_key,
                   fingerprint = EXCLUDED.fingerprint,
                   updated_at = NOW()
     RETURNING id, device_id, device_name, fingerprint, created_at, updated_at`,
    [userId, deviceId, deviceName, publicEncryptionKey, publicSigningKey, fingerprint]
  );

  return result.rows[0];
}

export async function getPublicKeysByEmail(email) {
  const result = await query(
    `SELECT k.device_id, k.device_name, k.public_encryption_key, k.public_signing_key, k.fingerprint, u.email, u.display_name
     FROM keys k
     JOIN users u ON u.id = k.user_id
     WHERE u.email = $1 AND k.revoked_at IS NULL`,
    [email.toLowerCase()]
  );

  return result.rows;
}

export async function getPublicKeysByUserId(userId) {
  const result = await query(
    `SELECT device_id, device_name, public_encryption_key, public_signing_key, fingerprint
     FROM keys WHERE user_id = $1 AND revoked_at IS NULL`,
    [userId]
  );

  return result.rows;
}
