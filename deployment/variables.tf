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

variable "function" {
  type    = string
  default = "../build/functions.zip"
}

variable "function_filename" {
  type    = string
  default = "functions.zip"
}

variable "slack_bot_token" {
  type = string
}

variable "slack_signing_secret" {
  type = string
}

variable "github_signature" {
  type = string
}

variable "github_private_key" {
  type = string
}

variable "github_app_id" {
  type = string
}

variable "github_installation_id" {
  type = string
}

variable "github_hostname" {
  type = string
}

variable "github_owner" {
  type = string
}

variable "github_repository" {
  type = string
}

variable "default_enabled" {
  type    = string
  default = "false"
}

variable "teams_token" {
  type        = string
  description = "Outgoing webhook token for Teams Client"
}

variable "teams_incoming_webhook" {
  type        = string
  description = "Incoming webhook url for Teams Client"
}

resource "random_string" "storage_name" {
  length  = 24
  upper   = false
  lower   = true
  number  = true
  special = false
}
