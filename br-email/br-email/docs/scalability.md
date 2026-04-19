# Estratégia de escalabilidade do MVP

## Meta
Atender até 1.000 usuários simultâneos com baixa latência para operações básicas.

## Estratégia
- API stateless em Node.js rodando em EC2 `t3.medium` ou `t3.large` com PM2.
- RDS PostgreSQL com índices focados em inbox e sessões.
- S3 para anexos futuros e artefatos estáticos.
- CloudFront opcional para frontend web estático.
- Rate limiting e payloads pequenos para reduzir pressão na API.
- Cache de diretório de chaves públicas no cliente por curta duração.
- Escala horizontal futura via ALB + múltiplas instâncias EC2 sem alterar o protocolo E2EE.
