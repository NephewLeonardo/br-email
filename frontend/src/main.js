import { api } from './api/index.js';
import { shell } from './components/templates.js';
import { createIdentity, decryptPrivateBundle, derivePasswordVerifier } from './crypto/identity.js';
import { decryptEnvelope, encryptEnvelope } from './crypto/e2ee.js';
import { clearSession, loadProtectedBundle, loadSession, saveProtectedBundle, saveSession } from './store/session.js';

const state = {
  authMode: 'login',
  status: '',
  session: loadSession(),
  inbox: [],
  selectedMessage: null,
  senderIdentity: null
};

const app = document.querySelector('#app');

function setStatus(message) {
  state.status = message;
  render();
}

async function boot() {
  render();
  if (state.session) {
    setStatus('Sessão restaurada. Informe a senha novamente para descriptografar suas chaves, se necessário.');
    await refreshInbox();
  }
}

function render() {
  app.innerHTML = shell(state);
  bindEvents();
}

function bindEvents() {
  document.querySelectorAll('[data-auth-tab]').forEach((button) => {
    button.onclick = () => {
      state.authMode = button.dataset.authTab;
      state.status = '';
      render();
    };
  });

  const authForm = document.querySelector('#auth-form');
  if (authForm) {
    authForm.onsubmit = handleAuthSubmit;
  }

  document.querySelector('#logout-button')?.addEventListener('click', async () => {
    try {
      await api.logout({ refreshToken: state.session.refreshToken });
    } catch {
      // noop
    }
    state.session = null;
    state.inbox = [];
    state.selectedMessage = null;
    state.senderIdentity = null;
    clearSession();
    setStatus('Sessão encerrada.');
  });

  document.querySelector('#refresh-button')?.addEventListener('click', refreshInbox);
  document.querySelector('#compose-button')?.addEventListener('click', () => {
    state.selectedMessage = null;
    render();
  });

  document.querySelector('#compose-form')?.addEventListener('submit', handleComposeSubmit);

  document.querySelectorAll('[data-message-id]').forEach((button) => {
    button.onclick = () => openMessage(button.dataset.messageId);
  });
}

async function unlockIdentity(email, password) {
  const protectedBundle = loadProtectedBundle(email);
  if (!protectedBundle) {
    throw new Error('Bundle local não encontrado neste dispositivo');
  }
  return decryptPrivateBundle(email, password, protectedBundle);
}

async function handleAuthSubmit(event) {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const email = form.get('email');
  const password = form.get('password');

  try {
    if (state.authMode === 'register') {
      const displayName = form.get('displayName');
      const deviceName = navigator.userAgent.slice(0, 40);
      const identity = await createIdentity(email, password, deviceName);
      const passwordVerifier = await derivePasswordVerifier(email, password);
      const response = await api.register({
        email,
        displayName,
        passwordVerifier,
        deviceId: identity.deviceId,
        deviceName,
        publicEncryptionKey: identity.publicEncryptionKey,
        publicSigningKey: identity.publicSigningKey,
        fingerprint: identity.fingerprint
      });
      saveProtectedBundle(email, identity.protectedBundle);
      state.senderIdentity = await unlockIdentity(email, password);
      state.session = response;
      saveSession(response);
      state.status = 'Conta criada com sucesso.';
      await refreshInbox();
      return;
    }

    const passwordVerifier = await derivePasswordVerifier(email, password);
    const response = await api.login({ email, passwordVerifier });
    state.senderIdentity = await unlockIdentity(email, password);
    state.session = response;
    saveSession(response);
    state.status = 'Login realizado com sucesso.';
    await refreshInbox();
  } catch (error) {
    setStatus(error.message);
  }
}

async function refreshInbox() {
  if (!state.session) return;
  try {
    const response = await api.inbox(state.session.accessToken);
    state.inbox = response.items;
    render();
  } catch (error) {
    setStatus(error.message);
  }
}

async function handleComposeSubmit(event) {
  event.preventDefault();
  try {
    if (!state.senderIdentity) {
      throw new Error('Faça login novamente para desbloquear a chave privada neste dispositivo');
    }

    const form = new FormData(event.currentTarget);
    const to = form.get('to');
    const subject = form.get('subject');
    const body = form.get('body');
    const keyDirectory = await api.keysByEmail(state.session.accessToken, to);
    const recipientKey = keyDirectory.keys[0];

    const envelope = encryptEnvelope({
      subject,
      body,
      recipientKey,
      senderIdentity: state.senderIdentity
    });

    await api.sendMessage(state.session.accessToken, { to, envelope });
    event.currentTarget.reset();
    setStatus('Mensagem criptografada e enviada.');
    await refreshInbox();
  } catch (error) {
    setStatus(error.message);
  }
}

async function openMessage(id) {
  try {
    if (!state.senderIdentity) {
      throw new Error('As chaves privadas não estão desbloqueadas neste dispositivo.');
    }

    const response = await api.messageById(state.session.accessToken, id);
    const item = response.item;
    const senderKeys = await api.keysByEmail(state.session.accessToken, item.sender_email);
    const senderKey = senderKeys.keys.find((key) => key.device_id === item.envelope.senderDeviceId) || senderKeys.keys[0];
    const plaintext = decryptEnvelope({
      envelope: item.envelope,
      privateEncryptionKey: state.senderIdentity.privateEncryptionKey,
      senderPublicSigningKey: senderKey.public_signing_key
    });

    state.selectedMessage = {
      subject: plaintext.subject,
      body: plaintext.body,
      from: item.sender_name || item.sender_email,
      sentAt: new Date(item.sent_at).toLocaleString()
    };
    render();
  } catch (error) {
    setStatus(error.message);
  }
}

boot();
