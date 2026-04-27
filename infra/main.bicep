targetScope = 'resourceGroup'

param environmentName string = '${AZURE_ENV_NAME}'
param location string = '${AZURE_LOCATION}'

@secure()
param mongodbUri string

@secure()
param nextauthSecret string

@secure()
param jwtSecret string

@secure()
param googleClientId string

@secure()
param googleClientSecret string

@secure()
param cloudinaryName string

@secure()
param cloudinaryApiKey string

@secure()
param cloudinaryApiSecret string

@secure()
param geminiApiKey string

@secure()
param openrouterApiKey string

var resourceToken = uniqueString(subscription().id, resourceGroup().id, location, environmentName)
var serviceName = 'flavourai-web'
var planName = 'azpl${resourceToken}'
var appName = 'azweb${resourceToken}'
var logName = 'azlog${resourceToken}'
var aiName = 'azai${resourceToken}'
var uamiName = 'azid${resourceToken}'
var kvName = 'azkv${resourceToken}'

resource uami 'Microsoft.ManagedIdentity/userAssignedIdentities@2023-01-31' = {
  name: uamiName
  location: location
}

resource logAnalytics 'Microsoft.OperationalInsights/workspaces@2023-09-01' = {
  name: logName
  location: location
  properties: {
    sku: {
      name: 'PerGB2018'
    }
    retentionInDays: 30
  }
}

resource appInsights 'Microsoft.Insights/components@2020-02-02' = {
  name: aiName
  location: location
  kind: 'web'
  properties: {
    Application_Type: 'web'
    WorkspaceResourceId: logAnalytics.id
  }
}

resource keyVault 'Microsoft.KeyVault/vaults@2023-07-01' = {
  name: kvName
  location: location
  properties: {
    tenantId: subscription().tenantId
    enableRbacAuthorization: true
    enableSoftDelete: true
    enablePurgeProtection: true
    publicNetworkAccess: 'Enabled'
    sku: {
      family: 'A'
      name: 'standard'
    }
    networkAcls: {
      bypass: 'AzureServices'
      defaultAction: 'Allow'
    }
  }
}

resource kvSecretsOfficer 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(keyVault.id, uami.id, 'kv-secrets-officer')
  scope: keyVault
  properties: {
    principalId: uami.properties.principalId
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', 'b86a8fe4-44ce-4948-aee5-eccb2c155cd7')
    principalType: 'ServicePrincipal'
  }
}

resource secretMongo 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  name: '${keyVault.name}/mongodb-uri'
  properties: {
    value: mongodbUri
  }
}

resource secretNextAuth 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  name: '${keyVault.name}/nextauth-secret'
  properties: {
    value: nextauthSecret
  }
}

resource secretJwt 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  name: '${keyVault.name}/jwt-secret'
  properties: {
    value: jwtSecret
  }
}

resource secretGoogleId 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  name: '${keyVault.name}/google-client-id'
  properties: {
    value: googleClientId
  }
}

resource secretGoogleSecret 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  name: '${keyVault.name}/google-client-secret'
  properties: {
    value: googleClientSecret
  }
}

resource secretCloudName 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  name: '${keyVault.name}/cloudinary-name'
  properties: {
    value: cloudinaryName
  }
}

resource secretCloudKey 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  name: '${keyVault.name}/cloudinary-api-key'
  properties: {
    value: cloudinaryApiKey
  }
}

resource secretCloudSecret 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  name: '${keyVault.name}/cloudinary-api-secret'
  properties: {
    value: cloudinaryApiSecret
  }
}

resource secretGemini 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  name: '${keyVault.name}/gemini-api-key'
  properties: {
    value: geminiApiKey
  }
}

resource secretOpenrouter 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  name: '${keyVault.name}/openrouter-api-key'
  properties: {
    value: openrouterApiKey
  }
}

resource plan 'Microsoft.Web/serverfarms@2023-12-01' = {
  name: planName
  location: location
  sku: {
    name: 'P1v3'
    tier: 'PremiumV3'
    capacity: 2
  }
  properties: {
    reserved: true
    zoneRedundant: true
  }
}

resource app 'Microsoft.Web/sites@2023-12-01' = {
  name: appName
  location: location
  kind: 'app,linux'
  tags: {
    'azd-service-name': serviceName
  }
  identity: {
    type: 'UserAssigned'
    userAssignedIdentities: {
      '${uami.id}': {}
    }
  }
  properties: {
    serverFarmId: plan.id
    httpsOnly: true
    siteConfig: {
      alwaysOn: true
      linuxFxVersion: 'NODE|20-lts'
      minTlsVersion: '1.2'
      cors: {
        allowedOrigins: [
          'https://${appName}.azurewebsites.net'
          'https://localhost:3000'
        ]
        supportCredentials: true
      }
      appSettings: [
        {
          name: 'APPLICATIONINSIGHTS_CONNECTION_STRING'
          value: appInsights.properties.ConnectionString
        }
        {
          name: 'NEXTAUTH_URL'
          value: 'https://${appName}.azurewebsites.net'
        }
        {
          name: 'NEXTAUTH_SECRET'
          value: '@Microsoft.KeyVault(SecretUri=${secretNextAuth.properties.secretUriWithVersion})'
        }
        {
          name: 'JWT_SECRET'
          value: '@Microsoft.KeyVault(SecretUri=${secretJwt.properties.secretUriWithVersion})'
        }
        {
          name: 'MONGODB_URI'
          value: '@Microsoft.KeyVault(SecretUri=${secretMongo.properties.secretUriWithVersion})'
        }
        {
          name: 'GOOGLE_CLIENT_ID'
          value: '@Microsoft.KeyVault(SecretUri=${secretGoogleId.properties.secretUriWithVersion})'
        }
        {
          name: 'GOOGLE_CLIENT_SECRET'
          value: '@Microsoft.KeyVault(SecretUri=${secretGoogleSecret.properties.secretUriWithVersion})'
        }
        {
          name: 'CLOUDINARY_NAME'
          value: '@Microsoft.KeyVault(SecretUri=${secretCloudName.properties.secretUriWithVersion})'
        }
        {
          name: 'CLOUDINARY_API_KEY'
          value: '@Microsoft.KeyVault(SecretUri=${secretCloudKey.properties.secretUriWithVersion})'
        }
        {
          name: 'CLOUDINARY_API_SECRET'
          value: '@Microsoft.KeyVault(SecretUri=${secretCloudSecret.properties.secretUriWithVersion})'
        }
        {
          name: 'GEMINI_API_KEY'
          value: '@Microsoft.KeyVault(SecretUri=${secretGemini.properties.secretUriWithVersion})'
        }
        {
          name: 'OPENROUTER_API_KEY'
          value: '@Microsoft.KeyVault(SecretUri=${secretOpenrouter.properties.secretUriWithVersion})'
        }
        {
          name: 'WEBSITE_NODE_DEFAULT_VERSION'
          value: '20-lts'
        }
      ]
    }
  }
  dependsOn: [
    kvSecretsOfficer
  ]
}

resource appDiagnostics 'Microsoft.Insights/diagnosticSettings@2021-05-01-preview' = {
  name: '${app.name}-diag'
  scope: app
  properties: {
    workspaceId: logAnalytics.id
    logs: [
      {
        category: 'AppServiceHTTPLogs'
        enabled: true
      }
      {
        category: 'AppServiceConsoleLogs'
        enabled: true
      }
      {
        category: 'AppServiceAppLogs'
        enabled: true
      }
    ]
    metrics: [
      {
        category: 'AllMetrics'
        enabled: true
      }
    ]
  }
}

resource kvDiagnostics 'Microsoft.Insights/diagnosticSettings@2021-05-01-preview' = {
  name: '${keyVault.name}-diag'
  scope: keyVault
  properties: {
    workspaceId: logAnalytics.id
    logs: [
      {
        categoryGroup: 'audit'
        enabled: true
      }
    ]
    metrics: [
      {
        category: 'AllMetrics'
        enabled: true
      }
    ]
  }
}

resource appAutoscale 'Microsoft.Insights/autoscaleSettings@2022-10-01' = {
  name: '${plan.name}-autoscale'
  location: location
  properties: {
    enabled: true
    targetResourceUri: plan.id
    profiles: [
      {
        name: 'default'
        capacity: {
          minimum: '2'
          maximum: '4'
          default: '2'
        }
        rules: []
      }
    ]
  }
}

output RESOURCE_GROUP_ID string = resourceGroup().id
output APP_SERVICE_NAME string = app.name
