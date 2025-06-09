# Deploy Mato Royale Infrastructure

This directory contains the Infrastructure as Code (IaC) templates for deploying Mato Royale to Azure.

## Prerequisites

- Azure CLI installed and logged in
- Resource Group `SnakeDemo-RG` created
- Permissions to create resources in the subscription

## Quick Deployment

```bash
# Deploy all infrastructure
az deployment group create \
  --resource-group SnakeDemo-RG \
  --template-file main.bicep \
  --parameters projectName=mato-royale environment=prod
```

## Resources Created

- **Container Registry**: For storing Docker images
- **SignalR Service**: Real-time WebSocket communication  
- **Container Apps**: Scalable game engine hosting
- **Azure Functions**: Round orchestration and timers
- **Static Web Apps**: Frontend hosting with CDN
- **Application Insights**: Monitoring and telemetry
- **Storage Account**: Functions runtime storage

## Configuration

The deployment outputs connection strings and URLs needed for the application. These are automatically configured via environment variables.

## Blue-Green Deployments

Container Apps support revision-based deployments:

```bash
# Deploy new revision
az containerapp update \
  --name mato-royale-prod-engine \
  --resource-group SnakeDemo-RG \
  --revision-suffix v2 \
  --traffic-weight latest=100

# Quick rollback if needed
az containerapp revision set-active \
  --revision mato-royale-prod-engine--v1 \
  --resource-group SnakeDemo-RG
```

## Monitoring

Access Application Insights dashboard for:
- Live connection count
- Game tick performance
- WebSocket latency metrics
- Error tracking
