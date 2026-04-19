import nacl from 'tweetnacl';
import util from 'tweetnacl-util';
import * as Crypto from 'expo-crypto';

function randomId(prefix = 'mob') {
  const bytes = nacl.randomBytes(8);
  return `${prefix}-${Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('')}`;
}

async function sha256(value) {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, value);
}

export async function derivePasswordVerifier(email, password) {
  return sha256(`${email.toLowerCase()}::auth::${password}`);
}

export async function createIdentity(deviceName) {
  const encKeyPair = nacl.box.keyPair();
  const signKeyPair = nacl.sign.keyPair();
  const fingerprint = (await sha256(
    util.encodeBase64(encKeyPair.publicKey) + util.encodeBase64(signKeyPair.publicKey)
  )).slice(0, 32);

  return {
    deviceId: randomId(),
    deviceName,
    publicEncryptionKey: util.encodeBase64(encKeyPair.publicKey),
    privateEncryptionKey: util.encodeBase64(encKeyPair.secretKey),
    publicSigningKey: util.encodeBase64(signKeyPair.publicKey),
    privateSigningKey: util.encodeBase64(signKeyPair.secretKey),
    fingerprint
  };
}
