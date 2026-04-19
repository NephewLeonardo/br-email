# Arquitetura do sistema

```mermaid
flowchart LR
  U1[Web Browser] -->|TLS| API[Node.js API / EC2]
  U2[Mobile App] -->|TLS| API
  API --> DB[(PostgreSQL / RDS)]
  API --> S3[(AWS S3)]
  U1 -. gera chaves .-> K1[(Privadas locais)]
  U2 -. gera chaves .-> K2[(Privadas locais)]
  API -. armazena apenas .-> PUB[Chaves públicas + envelopes criptografados]
```

## Princípios
- Zero-knowledge: o servidor não recebe chaves privadas.
- E2EE: subject/body são criptografados no cliente antes do envio.
- Assinatura digital do remetente para integridade do envelope.
- TLS obrigatório em trânsito.
