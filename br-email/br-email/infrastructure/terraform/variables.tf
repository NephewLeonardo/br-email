variable "aws_region" {
  type    = string
  default = "sa-east-1"
}

variable "project_name" {
  type    = string
  default = "br-email"
}

variable "db_name" {
  type    = string
  default = "br_email"
}

variable "db_username" {
  type    = string
  default = "bremail"
}

variable "db_password" {
  type      = string
  sensitive = true
}

variable "backend_instance_type" {
  type    = string
  default = "t3.medium"
}


variable "public_key_path" {
  type    = string
  default = ""
}

locals {
  public_key_path = var.public_key_path != "" ? var.public_key_path : abspath("~/.ssh/id_rsa.pub")
}