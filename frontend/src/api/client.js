const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export async function request(path, { method = 'GET', token, body } = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: body ? JSON.stringify(body) : undefined
  });

  if (!response.ok) {
    let errorMessage = 'Erro inesperado';
    try {
      const data = await response.json();
      errorMessage = data.error || errorMessage;
    } catch {
      // noop
    }
    throw new Error(errorMessage);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}
