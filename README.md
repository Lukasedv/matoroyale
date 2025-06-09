# 🚀 Mato Royale - Mass-Multiplayer Browser Snake

A real-time, no-login, mobile-friendly "Snake" arena that supports 200-300 concurrent players with hot-swappable updates via Azure.

## 🎯 Quick Start

### Prerequisites
- Node.js 18+
- Azure CLI
- Docker (for local development)

### Local Development

1. **Clone and install dependencies:**
```bash
npm install
```

2. **Start local development stack:**
```bash
# Start all services in development mode
npm run dev

# Or start individual services:
npm run dev:engine    # Game engine server
npm run dev:client    # Frontend development server
npm run dev:functions # Azure Functions
```

3. **Open your browser:**
   - Game: http://localhost:3000
   - Engine API: http://localhost:3001
   - Functions: http://localhost:7071

### Production Deployment

1. **Set up Azure resources:**
```bash
cd infra
az deployment group create --resource-group SnakeDemo-RG --template-file main.bicep
```

2. **Deploy application:**
```bash
npm run deploy
```

## 🏗️ Architecture

- **Frontend**: TypeScript + Phaser.js (Azure Static Web Apps)
- **Game Engine**: Node.js + TypeScript (Azure Container Apps)  
- **Real-time**: Azure SignalR Service
- **Orchestration**: Azure Durable Functions
- **CI/CD**: GitHub Actions + Azure Container Registry

## 🎮 Game Features

- **Mobile-first**: Swipe controls with D-pad fallback
- **Real-time multiplayer**: Up to 500 concurrent players
- **Hot updates**: Deploy new features without disconnecting players
- **90-second rounds**: Automatic reset and scoring
- **Live leaderboard**: Top 10 players displayed

## 📁 Project Structure

```
/client          # Phaser.js frontend (TypeScript)
/engine          # Authoritative game server (Node.js)
/functions       # Round orchestration (Azure Functions)  
/infra           # Infrastructure as Code (Bicep)
/tests           # E2E and load tests
```

## 🚀 Hot Deployment Demo

1. Tag current version: `git tag v1`
2. Merge new feature PR
3. GitHub Actions auto-deploys with blue-green strategy
4. Players see updates without reconnection

## 📊 Monitoring

- **Live metrics**: Application Insights dashboard
- **Performance**: <150ms latency target
- **Reliability**: Blue-green deployments with rollback

---

Built for high-scale keynote demos with zero authentication and maximum mobile performance.