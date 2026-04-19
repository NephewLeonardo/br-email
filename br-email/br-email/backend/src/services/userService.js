import argon2 from 'argon2';
import { query } from '../config/db.js';

export async function createUser({ email, passwordVerifier, displayName }) {
  const passwordHash = await argon2.hash(passwordVerifier, {
    type: argon2.argon2id,
    memoryCost: 2 ** 16,
    timeCost: 3,
    parallelism: 1
  });

  const result = await query(
    `INSERT INTO users (email, password_hash, display_name)
     VALUES ($1, $2, $3)
     RETURNING id, email, display_name, created_at`,
    [email.toLowerCase(), passwordHash, displayName]
  );

  return result.rows[0];
}

export async function findUserByEmail(email) {
  const result = await query(
    `SELECT id, email, password_hash, display_name, created_at
     FROM users WHERE email = $1`,
    [email.toLowerCase()]
  );
  return result.rows[0] || null;
}

export async function verifyPassword(passwordVerifier, hash) {
  return argon2.verify(hash, passwordVerifier);
}

export async function getUserProfile(userId) {
  const result = await query(
    `SELECT id, email, display_name, created_at FROM users WHERE id = $1`,
    [userId]
  );
  return result.rows[0] || null;
}
