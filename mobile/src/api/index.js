import { request } from './client';

export const api = {
  register: (payload) => request('/api/auth/register', { method: 'POST', body: payload }),
  login: (payload) => request('/api/auth/login', { method: 'POST', body: payload }),
  logout: (payload) => request('/api/auth/logout', { method: 'POST', body: payload }),
  inbox: (token) => request('/api/messages', { token }),
  messageById: (token, id) => request(`/api/messages/${id}`, { token }),
  sendMessage: (token, payload) => request('/api/messages', { method: 'POST', token, body: payload }),
  keysByEmail: (token, email) => request(`/api/keys/${encodeURIComponent(email)}`, { token })
};
