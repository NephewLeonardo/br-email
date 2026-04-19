output "backend_public_ip" { value = aws_instance.backend.public_ip }
output "rds_endpoint" { value = aws_db_instance.postgres.address }
output "s3_bucket" { value = aws_s3_bucket.attachments.id }
