import * as Phaser from 'phaser';
import { NetworkManager } from '../network/NetworkManager';
import { InputManager } from '../input/InputManager';
import { SnakeRenderer } from '../renderers/SnakeRenderer';
import { PelletRenderer } from '../renderers/PelletRenderer';
import { PowerUpRenderer } from '../renderers/PowerUpRenderer';
import { 
  GameUpdate, 
  Player, 
  Pellet, 
  PowerUp, 
  ArenaConfig,
  Direction 
} from '../types/GameTypes';

export class GameScene extends Phaser.Scene {
  private networkManager!: NetworkManager;
  private inputManager!: InputManager;
  private snakeRenderer!: SnakeRenderer;
  private pelletRenderer!: PelletRenderer;
  private powerUpRenderer!: PowerUpRenderer;

  private players = new Map<string, Player>();
  private pellets = new Map<string, Pellet>();
  private powerUps = new Map<string, PowerUp>();
  
  private myPlayerId: string | null = null;
  private arena!: ArenaConfig;
  private camera!: Phaser.Cameras.Scene2D.Camera;
  
  private interpolationBuffer: GameUpdate[] = [];

  constructor() {
    super({ key: 'GameScene' });
  }

  create(): void {
    console.log('🎮 Creating Game Scene...');

    // Initialize camera
    this.camera = this.cameras.main;
    this.camera.setBackgroundColor('#0f0f23');

    // Initialize managers
    this.networkManager = new NetworkManager();
    this.inputManager = new InputManager(this);
    
    // Default arena config (will be updated from server)
    this.arena = {
      width: 50,
      height: 50,
      cellSize: 20
    };
    
    // Initialize renderers
    this.snakeRenderer = new SnakeRenderer(this, this.arena);
    this.pelletRenderer = new PelletRenderer(this, this.arena);
    this.powerUpRenderer = new PowerUpRenderer(this, this.arena);

    // Setup network event handlers
    this.setupNetworkHandlers();

    // Setup input handlers
    this.setupInputHandlers();

    // Connect to game server
    this.connectToGame();

    // Start render loop
    this.startRenderLoop();
  }

  private setupNetworkHandlers(): void {
    this.networkManager.on('connected', () => {
      console.log('🔗 Connected to game server');
      this.updateConnectionStatus(true);
    });

    this.networkManager.on('disconnected', () => {
      console.log('🔌 Disconnected from game server');
      this.updateConnectionStatus(false);
    });

    this.networkManager.on('playerJoined', (data: any) => {
      console.log('👤 Player joined:', data);
      this.myPlayerId = data.playerId;
      this.arena = data.arena;
      this.setupArena();
    });

    this.networkManager.on('gameUpdate', (update: GameUpdate) => {
      this.handleGameUpdate(update);
    });

    this.networkManager.on('roundStarted', (data: any) => {
      console.log('🚀 Round started:', data);
      this.scene.get('UIScene').events.emit('roundStarted', data);
    });

    this.networkManager.on('roundEnded', (data: any) => {
      console.log('🏁 Round ended:', data);
      this.scene.get('UIScene').events.emit('roundEnded', data);
    });

    this.networkManager.on('arenaReset', (data: any) => {
      console.log('🔄 Arena reset:', data);
      this.resetVisuals();
    });
  }

  private setupInputHandlers(): void {
    this.inputManager.setDirectionChangeCallback((direction: Direction) => {
      if (this.myPlayerId) {
        this.networkManager.sendInput(direction);
      }
    });
  }

  private async connectToGame(): Promise<void> {
    try {
      await this.networkManager.connect();
    } catch (error) {
      console.error('Failed to connect to game:', error);
      this.showConnectionError();
    }
  }

  private setupArena(): void {
    if (!this.arena) return;

    // Setup camera bounds
    const worldWidth = this.arena.width * this.arena.cellSize;
    const worldHeight = this.arena.height * this.arena.cellSize;
    
    this.camera.setBounds(0, 0, worldWidth, worldHeight);
    
    // Create arena grid (optional visual guide)
    if (this.game.config.physics?.arcade?.debug) {
      this.createArenaGrid();
    }

    console.log(`🏟️  Arena setup: ${this.arena.width}x${this.arena.height} (${worldWidth}x${worldHeight}px)`);
  }

  private createArenaGrid(): void {
    const graphics = this.add.graphics();
    graphics.lineStyle(1, 0x333333, 0.3);

    for (let x = 0; x <= this.arena.width; x++) {
      graphics.moveTo(x * this.arena.cellSize, 0);
      graphics.lineTo(x * this.arena.cellSize, this.arena.height * this.arena.cellSize);
    }

    for (let y = 0; y <= this.arena.height; y++) {
      graphics.moveTo(0, y * this.arena.cellSize);
      graphics.lineTo(this.arena.width * this.arena.cellSize, y * this.arena.cellSize);
    }

    graphics.strokePath();
  }

  private handleGameUpdate(update: GameUpdate): void {
    // Add to interpolation buffer
    this.interpolationBuffer.push(update);
    
    // Keep buffer size manageable (last 5 updates)
    if (this.interpolationBuffer.length > 5) {
      this.interpolationBuffer.shift();
    }

    // Update game state immediately for latest data
    this.updateGameState(update);
    
    // Update UI
    this.scene.get('UIScene').events.emit('gameUpdate', update);
  }

  private updateGameState(update: GameUpdate): void {
    // Update players
    this.players.clear();
    update.players.forEach(playerData => {
      if (playerData.id) {
        this.players.set(playerData.id, playerData as Player);
      }
    });

    // Update pellets
    this.pellets.clear();
    update.pellets.forEach(pellet => {
      this.pellets.set(pellet.id, pellet);
    });

    // Update power-ups
    this.powerUps.clear();
    update.powerUps.forEach(powerUp => {
      this.powerUps.set(powerUp.id, powerUp);
    });
  }

  private startRenderLoop(): void {
    // Use Phaser's update loop for rendering
    this.events.on('preupdate', this.renderFrame, this);
  }

  private renderFrame(): void {
    if (!this.arena) return;

    // Render all game objects
    this.renderSnakes();
    this.renderPellets();
    this.renderPowerUps();
    
    // Update camera to follow player
    this.updateCameraPosition();
  }

  private renderSnakes(): void {
    for (const player of this.players.values()) {
      if (player.snake && player.isAlive) {
        const isMySnake = player.id === this.myPlayerId;
        this.snakeRenderer.renderPlayer(player, isMySnake);
      }
    }
  }

  private renderPellets(): void {
    for (const pellet of this.pellets.values()) {
      this.pelletRenderer.renderPellet(pellet);
    }
  }

  private renderPowerUps(): void {
    for (const powerUp of this.powerUps.values()) {
      this.powerUpRenderer.renderPowerUp(powerUp);
    }
  }

  private updateCameraPosition(): void {
    if (!this.myPlayerId || !this.arena) return;

    const myPlayer = this.players.get(this.myPlayerId);
    if (!myPlayer || !myPlayer.snake || !myPlayer.isAlive) return;

    const head = myPlayer.snake.segments[0];
    if (!head) return;

    const worldX = head.x * this.arena.cellSize;
    const worldY = head.y * this.arena.cellSize;

    // Smooth camera follow
    this.camera.pan(worldX, worldY, 100, 'Linear');
  }

  private updateConnectionStatus(connected: boolean): void {
    const statusElement = document.getElementById('connection-status');
    if (statusElement) {
      statusElement.className = `connection-status ${connected ? 'connected' : 'disconnected'}`;
      statusElement.textContent = connected ? '● Connected' : '● Disconnected';
    }
  }

  private showConnectionError(): void {
    // Show error message to user
    const loadingElement = document.getElementById('loading');
    if (loadingElement) {
      loadingElement.innerHTML = `
        <div class="spinner" style="border-color: #ff4757; border-top-color: transparent;"></div>
        <div class="loading-text" style="color: #ff4757;">Connection Failed</div>
        <div class="loading-subtitle">Unable to connect to game servers. Please refresh to try again.</div>
      `;
    }
  }

  private resetVisuals(): void {
    // Clear all game state
    this.players.clear();
    this.pellets.clear();
    this.powerUps.clear();
    this.powerUps.clear();
    
    console.log('🔄 Visuals reset');
  }

  // Public methods for external access
  public getMyPlayer(): Player | undefined {
    return this.myPlayerId ? this.players.get(this.myPlayerId) : undefined;
  }

  public getArena(): ArenaConfig | undefined {
    return this.arena;
  }

  shutdown(): void {
    this.networkManager?.disconnect();
    this.inputManager?.destroy();
  }
}
