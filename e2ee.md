# Estratégia de segurança e privacidade

## Garantias do MVP
- Nem administradores, nem operadores de banco, nem o backend conseguem ler o conteúdo dos e-mails.
- Chaves privadas são geradas e mantidas apenas no cliente.
- O backend guarda apenas chaves públicas, sessões, metadados mínimos e envelopes criptografados.

## Mecanismo E2EE
- Par de chaves de criptografia: Curve25519 via TweetNaCl.
- Par de chaves de assinatura: Ed25519 via TweetNaCl.
- Conteúdo criptografado no cliente com chave efêmera + chave pública do destinatário.
- Integridade do envelope garantida por assinatura do remetente.

## Senhas
- Cliente deriva `passwordVerifier` localmente.
- Backend armazena somente hash `argon2id(passwordVerifier)`.
- Web protege o bundle local com AES-GCM derivado por PBKDF2.
- Mobile usa SecureStore do sistema operacional.

## MITM e zero trust
- TLS obrigatório em produção.
- Fingerprint de chave pública disponível para validação fora de banda.
- O servidor é tratado como não confiável para conteúdo.
- Logs devem excluir subject, body e qualquer payload descriptografável.

## Política de logs
- Não registrar conteúdo de mensagem.
- Não registrar headers completos com payloads.
- Não registrar tokens em texto puro.
