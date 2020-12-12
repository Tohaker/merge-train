variable "prefix" {
  type    = string
  default = "merge-train"
}

variable "environment" {
  type    = string
  default = "dev"
}

variable "location" {
  type    = string
  default = "uksouth"
}

variable "functionapp" {
  type    = string
  default = "./build/functionapp.zip"
}

variable "filename" {
  type    = string
  default = "functionapp.zip"
}

resource "random_string" "storage_name" {
  length  = 24
  upper   = false
  lower   = true
  number  = true
  special = false
}
