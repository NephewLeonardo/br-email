# Fluxos técnicos

## Fluxo de autenticação
1. Cliente gera `passwordVerifier` localmente.
2. Backend armazena apenas hash argon2id do `passwordVerifier`.
3. Registro também publica chaves públicas do dispositivo.
4. Login retorna JWT de acesso e refresh token.
5. Sessões ficam em tabela separada, com hash do refresh token.

## Fluxo de envio de e-mail
1. Cliente consulta diretório de chaves públicas do destinatário.
2. Cliente gera chave efêmera, nonce e envelope criptografado.
3. Subject e body são criptografados localmente.
4. Envelope é assinado com chave privada de assinatura do remetente.
5. API persiste somente envelope, metadados mínimos e carimbo de tempo.

## Fluxo de leitura
1. Cliente autenticado baixa envelope criptografado.
2. Cliente baixa chave pública do remetente.
3. Cliente valida assinatura.
4. Cliente decripta localmente com chave privada do dispositivo.
