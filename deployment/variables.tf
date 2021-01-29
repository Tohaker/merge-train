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

resource "random_string" "storage_name" {
  length  = 24
  upper   = false
  lower   = true
  number  = true
  special = false
}
