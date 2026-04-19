import nacl from 'tweetnacl';
import util from 'tweetnacl-util';

function randomId(prefix = 'dev') {
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  return `${prefix}-${Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('')}`;
}

async function sha256(input) {
  const data = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function deriveAesKey(email, password) {
  const baseKey = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(`${email.toLowerCase()}::${password}`),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: new TextEncoder().encode(`br-email::${email.toLowerCase()}`),
      iterations: 200000,
      hash: 'SHA-256'
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function derivePasswordVerifier(email, password) {
  return sha256(`${email.toLowerCase()}::auth::${password}`);
}

export async function createIdentity(email, password, deviceName) {
  const encKeyPair = nacl.box.keyPair();
  const signKeyPair = nacl.sign.keyPair();
  const fingerprint = (await sha256(
    util.encodeBase64(encKeyPair.publicKey) + util.encodeBase64(signKeyPair.publicKey)
  )).slice(0, 32);

  const privateBundle = {
    privateEncryptionKey: util.encodeBase64(encKeyPair.secretKey),
    publicEncryptionKey: util.encodeBase64(encKeyPair.publicKey),
    privateSigningKey: util.encodeBase64(signKeyPair.secretKey),
    publicSigningKey: util.encodeBase64(signKeyPair.publicKey),
    deviceId: randomId(),
    deviceName,
    fingerprint
  };

  const protectedBundle = await encryptPrivateBundle(email, password, privateBundle);
  return {
    deviceId: privateBundle.deviceId,
    deviceName,
    publicEncryptionKey: privateBundle.publicEncryptionKey,
    publicSigningKey: privateBundle.publicSigningKey,
    fingerprint,
    protectedBundle
  };
}

export async function encryptPrivateBundle(email, password, bundle) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveAesKey(email, password);
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    new TextEncoder().encode(JSON.stringify(bundle))
  );

  return {
    iv: util.encodeBase64(iv),
    ciphertext: util.encodeBase64(new Uint8Array(ciphertext))
  };
}

export async function decryptPrivateBundle(email, password, protectedBundle) {
  const key = await deriveAesKey(email, password);
  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: util.decodeBase64(protectedBundle.iv) },
    key,
    util.decodeBase64(protectedBundle.ciphertext)
  );

  return JSON.parse(new TextDecoder().decode(plaintext));
}
