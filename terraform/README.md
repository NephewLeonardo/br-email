# Infraestrutura AWS

Provisiona:
- VPC
- EC2 para backend Node.js
- RDS PostgreSQL criptografado
- S3 para anexos/artefatos do MVP

## Passos
1. `terraform init`
2. `terraform apply -var="db_password=..."`
3. Configurar Nginx + TLS no EC2
4. Rodar schema SQL no RDS
