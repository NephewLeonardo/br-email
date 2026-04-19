import { request } from './client.js';

export const api = {
  register: (payload) => request('/api/auth/register', { method: 'POST', body: payload }),
  login: (payload) => request('/api/auth/login', { method: 'POST', body: payload }),
  refresh: (payload) => request('/api/auth/refresh', { method: 'POST', body: payload }),
  logout: (payload) => request('/api/auth/logout', { method: 'POST', body: payload }),
  me: (token) => request('/api/auth/me', { token }),
  keysByEmail: (token, email) => request(`/api/keys/${encodeURIComponent(email)}`, { token }),
  registerDevice: (token, payload) => request('/api/keys/register-device', { method: 'POST', token, body: payload }),
  sendMessage: (token, payload) => request('/api/messages', { method: 'POST', token, body: payload }),
  inbox: (token) => request('/api/messages', { token }),
  messageById: (token, id) => request(`/api/messages/${id}`, { token })
};
