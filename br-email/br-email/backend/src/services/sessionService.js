import { query } from '../config/db.js';
import { sha256 } from '../utils/tokens.js';

export async function createSession({ userId, refreshToken, userAgent, ipAddress }) {
  const tokenHash = sha256(refreshToken);
  await query(
    `INSERT INTO sessions (user_id, refresh_token_hash, user_agent, ip_address, expires_at)
     VALUES ($1, $2, $3, $4, NOW() + INTERVAL '7 days')`,
    [userId, tokenHash, userAgent, ipAddress]
  );
}

export async function getSessionByToken(refreshToken) {
  const tokenHash = sha256(refreshToken);
  const result = await query(
    `SELECT id, user_id, expires_at, revoked_at
     FROM sessions WHERE refresh_token_hash = $1`,
    [tokenHash]
  );
  return result.rows[0] || null;
}

export async function revokeSession(refreshToken) {
  const tokenHash = sha256(refreshToken);
  await query(
    `UPDATE sessions SET revoked_at = NOW() WHERE refresh_token_hash = $1`,
    [tokenHash]
  );
}
