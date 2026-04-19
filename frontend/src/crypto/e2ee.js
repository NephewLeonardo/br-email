import nacl from 'tweetnacl';
import util from 'tweetnacl-util';

function toUtf8Base64(value) {
  return util.encodeBase64(util.decodeUTF8(value));
}

function fromUtf8Base64(value) {
  return util.encodeUTF8(util.decodeBase64(value));
}

export function encryptEnvelope({ subject, body, recipientKey, senderIdentity }) {
  const nonce = nacl.randomBytes(nacl.box.nonceLength);
  const ephemeral = nacl.box.keyPair();
  const recipientPublicKey = util.decodeBase64(recipientKey.public_encryption_key);

  const encryptedSubject = nacl.box(
    util.decodeBase64(toUtf8Base64(subject)),
    nonce,
    recipientPublicKey,
    ephemeral.secretKey
  );

  const encryptedBody = nacl.box(
    util.decodeBase64(toUtf8Base64(body)),
    nonce,
    recipientPublicKey,
    ephemeral.secretKey
  );

  const signaturePayload = JSON.stringify({
    encryptedSubject: util.encodeBase64(encryptedSubject),
    encryptedBody: util.encodeBase64(encryptedBody),
    nonce: util.encodeBase64(nonce),
    recipientDeviceId: recipientKey.device_id,
    senderDeviceId: senderIdentity.deviceId,
    ephemeralPublicKey: util.encodeBase64(ephemeral.publicKey)
  });

  const signature = nacl.sign.detached(
    util.decodeUTF8(signaturePayload),
    util.decodeBase64(senderIdentity.privateSigningKey)
  );

  return {
    version: '1',
    senderDeviceId: senderIdentity.deviceId,
    recipientDeviceId: recipientKey.device_id,
    nonce: util.encodeBase64(nonce),
    subjectHint: 'encrypted',
    encryptedSubject: util.encodeBase64(encryptedSubject),
    encryptedBody: util.encodeBase64(encryptedBody),
    signature: util.encodeBase64(signature),
    ephemeralPublicKey: util.encodeBase64(ephemeral.publicKey)
  };
}

export function decryptEnvelope({ envelope, privateEncryptionKey, senderPublicSigningKey }) {
  const signaturePayload = JSON.stringify({
    encryptedSubject: envelope.encryptedSubject,
    encryptedBody: envelope.encryptedBody,
    nonce: envelope.nonce,
    recipientDeviceId: envelope.recipientDeviceId,
    senderDeviceId: envelope.senderDeviceId,
    ephemeralPublicKey: envelope.ephemeralPublicKey
  });

  const signatureOk = nacl.sign.detached.verify(
    util.decodeUTF8(signaturePayload),
    util.decodeBase64(envelope.signature),
    util.decodeBase64(senderPublicSigningKey)
  );

  if (!signatureOk) {
    throw new Error('Assinatura inválida');
  }

  const nonce = util.decodeBase64(envelope.nonce);
  const subjectBytes = nacl.box.open(
    util.decodeBase64(envelope.encryptedSubject),
    nonce,
    util.decodeBase64(envelope.ephemeralPublicKey),
    util.decodeBase64(privateEncryptionKey)
  );

  const bodyBytes = nacl.box.open(
    util.decodeBase64(envelope.encryptedBody),
    nonce,
    util.decodeBase64(envelope.ephemeralPublicKey),
    util.decodeBase64(privateEncryptionKey)
  );

  if (!subjectBytes || !bodyBytes) {
    throw new Error('Falha ao descriptografar');
  }

  return {
    subject: fromUtf8Base64(util.encodeBase64(subjectBytes)),
    body: fromUtf8Base64(util.encodeBase64(bodyBytes))
  };
}
