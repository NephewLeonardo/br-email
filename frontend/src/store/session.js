const STORAGE_KEY = 'br-email.session';
const BUNDLE_KEY = 'br-email.bundle';

export function saveSession(session) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function loadSession() {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function clearSession() {
  localStorage.removeItem(STORAGE_KEY);
}

export function saveProtectedBundle(email, protectedBundle) {
  localStorage.setItem(`${BUNDLE_KEY}.${email.toLowerCase()}`, JSON.stringify(protectedBundle));
}

export function loadProtectedBundle(email) {
  const raw = localStorage.getItem(`${BUNDLE_KEY}.${email.toLowerCase()}`);
  return raw ? JSON.parse(raw) : null;
}
