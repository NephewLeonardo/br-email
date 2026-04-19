# Backend br-email

API REST em Node.js para autenticação, diretório de chaves públicas e armazenamento de envelopes criptografados.

## Endpoints
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `GET /api/keys/:email`
- `POST /api/keys/register-device`
- `POST /api/messages`
- `GET /api/messages`
- `GET /api/messages/:id`

## Observações de segurança
- O backend **não recebe chaves privadas**.
- Conteúdo de mensagem é armazenado somente como envelope criptografado.
- TLS obrigatório em produção.
