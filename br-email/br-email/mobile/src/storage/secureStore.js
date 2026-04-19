import * as SecureStore from 'expo-secure-store';

const SESSION_KEY = 'br-email.mobile.session';

export async function saveSession(session) {
  await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(session));
}

export async function loadSession() {
  const raw = await SecureStore.getItemAsync(SESSION_KEY);
  return raw ? JSON.parse(raw) : null;
}

export async function clearSession() {
  await SecureStore.deleteItemAsync(SESSION_KEY);
}

export async function saveIdentity(email, identity) {
  await SecureStore.setItemAsync(`br-email.identity.${email.toLowerCase()}`, JSON.stringify(identity));
}

export async function loadIdentity(email) {
  const raw = await SecureStore.getItemAsync(`br-email.identity.${email.toLowerCase()}`);
  return raw ? JSON.parse(raw) : null;
}
