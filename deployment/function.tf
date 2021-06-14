data "azurerm_storage_account_sas" "sas" {
  connection_string = azurerm_storage_account.storage.primary_connection_string
  https_only        = true
  start             = "2020-12-12"
  expiry            = "2021-12-31"

  resource_types {
    object    = true
    container = false
    service   = false
  }

  services {
    blob  = true
    queue = false
    table = false
    file  = false
  }

  permissions {
    read    = true
    write   = false
    delete  = false
    list    = false
    add     = false
    create  = false
    update  = false
    process = false
  }
}

resource "azurerm_app_service_plan" "serviceplan" {
  name                = "${var.prefix}-plan"
  resource_group_name = azurerm_resource_group.rg.name
  location            = var.location
  kind                = "FunctionApp"

  sku {
    tier = "Free"
    size = "F1"
  }
}

resource "azurerm_function_app" "slack_function" {
  name                       = "${var.prefix}-${var.environment}-slack"
  location                   = var.location
  resource_group_name        = azurerm_resource_group.rg.name
  app_service_plan_id        = azurerm_app_service_plan.serviceplan.id
  storage_account_name       = azurerm_storage_account.storage.name
  storage_account_access_key = azurerm_storage_account.storage.primary_access_key
  version                    = "~3"

  app_settings = {
    https_only                     = true
    FUNCTIONS_WORKER_RUNTIME       = "node"
    WEBSITE_NODE_DEFAULT_VERSION   = "~14"
    FUNCTION_APP_EDIT_MODE         = "readonly"
    HASH                           = base64encode(filesha256(var.function))
    WEBSITE_RUN_FROM_PACKAGE       = "https://${azurerm_storage_account.storage.name}.blob.core.windows.net/${azurerm_storage_container.deployments.name}/${azurerm_storage_blob.function_code.name}${data.azurerm_storage_account_sas.sas.sas}"
    APPINSIGHTS_INSTRUMENTATIONKEY = azurerm_application_insights.insights.instrumentation_key
    SLACK_BOT_TOKEN                = var.slack_bot_token
    SLACK_SIGNING_SECRET           = var.slack_signing_secret
    GHAPP_SECRET                   = var.github_signature
    GITHUB_HOSTNAME                = var.github_hostname
    GITHUB_OWNER                   = var.github_owner
    GITHUB_REPOSITORY              = var.github_repository
    GITHUB_APP_ID                  = var.github_app_id
    GITHUB_INSTALLATION_ID         = var.github_installation_id
    MERGE_ENABLED                  = var.default_enabled
    PRIVATE_KEY                    = var.github_private_key
    CLIENT_PLATFORM                = "slack"
  }
}

resource "azurerm_function_app" "teams_function" {
  name                       = "${var.prefix}-${var.environment}-teams"
  location                   = var.location
  resource_group_name        = azurerm_resource_group.rg.name
  app_service_plan_id        = azurerm_app_service_plan.serviceplan.id
  storage_account_name       = azurerm_storage_account.storage.name
  storage_account_access_key = azurerm_storage_account.storage.primary_access_key
  version                    = "~3"

  app_settings = {
    https_only                     = true
    FUNCTIONS_WORKER_RUNTIME       = "node"
    WEBSITE_NODE_DEFAULT_VERSION   = "~14"
    FUNCTION_APP_EDIT_MODE         = "readonly"
    HASH                           = base64encode(filesha256(var.function))
    WEBSITE_RUN_FROM_PACKAGE       = "https://${azurerm_storage_account.storage.name}.blob.core.windows.net/${azurerm_storage_container.deployments.name}/${azurerm_storage_blob.function_code.name}${data.azurerm_storage_account_sas.sas.sas}"
    APPINSIGHTS_INSTRUMENTATIONKEY = azurerm_application_insights.insights.instrumentation_key
    TEAMS_TOKEN                    = var.teams_token
    GHAPP_SECRET                   = var.github_signature
    GITHUB_HOSTNAME                = var.github_hostname
    GITHUB_OWNER                   = var.github_owner
    GITHUB_REPOSITORY              = var.github_repository
    GITHUB_APP_ID                  = var.github_app_id
    GITHUB_INSTALLATION_ID         = var.github_installation_id
    MERGE_ENABLED                  = var.default_enabled
    PRIVATE_KEY                    = var.github_private_key
    CLIENT_PLATFORM                = "teams"
  }
}

resource "azurerm_application_insights" "insights" {
  name                = "${var.prefix}-${var.environment}-appinsights"
  location            = var.location
  resource_group_name = azurerm_resource_group.rg.name
  application_type    = "Node.JS"
}
