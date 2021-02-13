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

variable "githubapp" {
  type    = string
  default = "../build/githubapp.zip"
}

variable "githubapp_filename" {
  type    = string
  default = "githubapp.zip"
}

variable "slackapp" {
  type    = string
  default = "../build/slackapp.zip"
}

variable "slackapp_filename" {
  type    = string
  default = "slackapp.zip"
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

resource "random_string" "storage_name" {
  length  = 24
  upper   = false
  lower   = true
  number  = true
  special = false
}
