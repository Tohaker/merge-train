resource "azurerm_resource_group" "rg" {
  name     = "${var.prefix}-${var.environment}"
  location = var.location
}

resource "azurerm_storage_account" "storage" {
  name                     = random_string.storage_name.result
  resource_group_name      = azurerm_resource_group.rg.name
  location                 = var.location
  account_tier             = "Standard"
  account_replication_type = "LRS"
}

resource "azurerm_storage_container" "deployments" {
  name                  = "function-releases"
  storage_account_name  = azurerm_storage_account.storage.name
  container_access_type = "private"
}

resource "azurerm_storage_blob" "slackapp_functioncode" {
  name                   = var.slackapp_filename
  storage_account_name   = azurerm_storage_account.storage.name
  storage_container_name = azurerm_storage_container.deployments.name
  type                   = "Block"
  source                 = var.slackapp
  content_md5            = filemd5(var.slackapp)
}

resource "azurerm_storage_blob" "githubapp_functioncode" {
  name                   = var.githubapp_filename
  storage_account_name   = azurerm_storage_account.storage.name
  storage_container_name = azurerm_storage_container.deployments.name
  type                   = "Block"
  source                 = var.githubapp
  content_md5            = filemd5(var.githubapp)
}
