import { v4 as uuidv4 } from 'uuid';
import {
  Player,
  Snake,
  Position,
  Direction,
  Pellet,
  PowerUp,
  GameState,
  GamePhase,
  PelletType,
  PowerUpType,
  InputEvent,
  GameUpdate,
  LeaderboardEntry,
  GameMetrics,
  ArenaConfig,
} from '../types/GameTypes';
import { SignalRService } from '../services/SignalRService';
import { TelemetryService } from '../services/TelemetryService';

export class GameEngine {
  private players = new Map<string, Player>();
  private pellets = new Map<string, Pellet>();
  private powerUps = new Map<string, PowerUp>();
  private gameState: GameState;
  private gameLoop: NodeJS.Timeout | null = null;
  private inputQueue: InputEvent[] = [];
  private metrics: GameMetrics;
  private lastTickTime = 0;
  private tickTimes: number[] = [];
  
  private readonly TICK_RATE = 20; // 20 Hz
  private readonly TICK_INTERVAL = 1000 / this.TICK_RATE;
  private readonly ROUND_DURATION = 90000; // 90 seconds
  private readonly ARENA_CONFIG: ArenaConfig = {
    width: 80,
    height: 60,
    cellSize: 10,
  };
  
  constructor(
    private signalR: SignalRService,
    private telemetry: TelemetryService
  ) {
    this.gameState = this.createInitialGameState();
    this.metrics = this.createInitialMetrics();
    this.setupSignalRHandlers();
  }

  async initialize(): Promise<void> {
    console.log('🎮 Initializing Game Engine...');
    this.spawnInitialPellets();
    this.startGameLoop();
    this.telemetry.trackEvent('GameEngineInitialized');
  }

  async shutdown(): Promise<void> {
    console.log('🛑 Shutting down Game Engine...');
    if (this.gameLoop) {
      clearInterval(this.gameLoop);
    }
    this.telemetry.trackEvent('GameEngineShutdown');
  }

  private createInitialGameState(): GameState {
    return {
      round: 1,
      phase: GamePhase.Waiting,
      timeRemaining: this.ROUND_DURATION,
      players: [],
      pellets: [],
      powerUps: [],
      leaderboard: [],
      arena: this.ARENA_CONFIG,
    };
  }

  private createInitialMetrics(): GameMetrics {
    return {
      playerCount: 0,
      tickRate: this.TICK_RATE,
      averageLatency: 0,
      p95Latency: 0,
      pelletsCount: 0,
      powerUpsCount: 0,
      roundsPlayed: 0,
      uptime: 0,
    };
  }

  private setupSignalRHandlers(): void {
    this.signalR.onPlayerJoined((connectionId: string) => {
      this.addPlayer(connectionId);
    });

    this.signalR.onPlayerLeft((connectionId: string) => {
      this.removePlayer(connectionId);
    });

    this.signalR.onPlayerInput((connectionId: string, direction: Direction) => {
      const player = this.findPlayerByConnection(connectionId);
      if (player) {
        this.inputQueue.push({
          playerId: player.id,
          direction,
          timestamp: Date.now(),
        });
      }
    });
  }

  private startGameLoop(): void {
    this.gameLoop = setInterval(() => {
      const startTime = Date.now();
      this.tick();
      const tickTime = Date.now() - startTime;
      
      this.trackTickPerformance(tickTime);
    }, this.TICK_INTERVAL);
  }

  private tick(): void {
    this.processInputs();
    this.updatePhysics();
    this.checkCollisions();
    this.updatePowerUps();
    this.updateGameState();
    this.broadcastUpdate();
    this.updateMetrics();
  }

  private processInputs(): void {
    while (this.inputQueue.length > 0) {
      const input = this.inputQueue.shift()!;
      const player = this.players.get(input.playerId);
      
      if (player && player.isAlive) {
        // Validate direction change (can't reverse)
        const currentDir = player.snake.direction;
        if (this.isValidDirectionChange(currentDir, input.direction)) {
          player.snake.nextDirection = input.direction;
        }
      }
    }
  }

  private isValidDirectionChange(current: Direction, next: Direction): boolean {
    const opposites = new Map([
      [Direction.Up, Direction.Down],
      [Direction.Down, Direction.Up],
      [Direction.Left, Direction.Right],
      [Direction.Right, Direction.Left],
    ]);
    
    return opposites.get(current) !== next;
  }

  private updatePhysics(): void {
    if (this.gameState.phase !== GamePhase.Playing) return;

    for (const player of this.players.values()) {
      if (!player.isAlive) continue;

      const snake = player.snake;
      snake.direction = snake.nextDirection;

      // Calculate new head position
      const head = snake.segments[0];
      const newHead = this.getNextPosition(head, snake.direction);

      // Move snake
      snake.segments.unshift(newHead);
      
      // Check if snake ate pellet (will grow), otherwise remove tail
      if (!this.checkPelletCollision(player, newHead)) {
        snake.segments.pop();
      }
    }
  }

  private getNextPosition(pos: Position, direction: Direction): Position {
    switch (direction) {
      case Direction.Up:
        return { x: pos.x, y: pos.y - 1 };
      case Direction.Down:
        return { x: pos.x, y: pos.y + 1 };
      case Direction.Left:
        return { x: pos.x - 1, y: pos.y };
      case Direction.Right:
        return { x: pos.x + 1, y: pos.y };
    }
  }

  private checkCollisions(): void {
    for (const player of this.players.values()) {
      if (!player.isAlive) continue;

      const head = player.snake.segments[0];
      
      // Wall collision
      if (this.isOutOfBounds(head)) {
        this.killPlayer(player);
        continue;
      }

      // Self collision
      for (let i = 1; i < player.snake.segments.length; i++) {
        if (this.positionsEqual(head, player.snake.segments[i])) {
          this.killPlayer(player);
          break;
        }
      }

      // Other snake collision
      for (const otherPlayer of this.players.values()) {
        if (otherPlayer.id === player.id || !otherPlayer.isAlive) continue;
        
        for (const segment of otherPlayer.snake.segments) {
          if (this.positionsEqual(head, segment)) {
            this.killPlayer(player);
            break;
          }
        }
      }
    }
  }

  private checkPelletCollision(player: Player, position: Position): boolean {
    for (const pellet of this.pellets.values()) {
      if (this.positionsEqual(position, pellet.position)) {
        player.score += pellet.value;
        this.pellets.delete(pellet.id);
        this.spawnRandomPellet();
        
        this.telemetry.trackEvent('PelletEaten', {
          playerId: player.id,
          pelletType: pellet.type,
          score: player.score.toString(),
        });
        
        return true;
      }
    }
    return false;
  }

  private updatePowerUps(): void {
    const now = Date.now();
    
    // Remove expired power-ups
    for (const [id, powerUp] of this.powerUps.entries()) {
      if (powerUp.expiresAt <= now) {
        this.powerUps.delete(id);
      }
    }

    // Randomly spawn new power-ups (every 10 seconds on average)
    if (Math.random() < 0.005) { // 0.5% chance per tick
      this.spawnRandomPowerUp();
    }
  }

  private updateGameState(): void {
    if (this.gameState.phase === GamePhase.Playing) {
      this.gameState.timeRemaining = Math.max(0, 
        this.ROUND_DURATION - (Date.now() - this.gameState.roundStartTime!));
      
      if (this.gameState.timeRemaining <= 0) {
        this.endRound();
      }
    }

    // Update leaderboard
    this.updateLeaderboard();
  }

  private updateLeaderboard(): void {
    const entries: LeaderboardEntry[] = Array.from(this.players.values())
      .map(player => ({
        playerId: player.id,
        score: player.score,
        length: player.snake.segments.length,
        rank: 0,
      }))
      .sort((a, b) => b.score - a.score);

    entries.forEach((entry, index) => {
      entry.rank = index + 1;
    });

    this.gameState.leaderboard = entries.slice(0, 10); // Top 10
  }

  private broadcastUpdate(): void {
    const update: GameUpdate = {
      timestamp: Date.now(),
      players: Array.from(this.players.values()).map(p => ({
        id: p.id,
        snake: p.snake,
        score: p.score,
        isAlive: p.isAlive,
      })),
      pellets: Array.from(this.pellets.values()),
      powerUps: Array.from(this.powerUps.values()),
      leaderboard: this.gameState.leaderboard,
      gameState: {
        phase: this.gameState.phase,
        timeRemaining: this.gameState.timeRemaining,
        round: this.gameState.round,
      },
    };

    this.signalR.broadcast('gameUpdate', update);
  }

  // Public methods for external control
  public startRound(): void {
    console.log('🚀 Starting new round');
    this.gameState.phase = GamePhase.Playing;
    this.gameState.roundStartTime = Date.now();
    this.gameState.timeRemaining = this.ROUND_DURATION;
    
    this.signalR.broadcast('roundStarted', {
      round: this.gameState.round,
      duration: this.ROUND_DURATION,
    });
    
    this.telemetry.trackEvent('RoundStarted', {
      round: this.gameState.round.toString(),
      playerCount: this.players.size.toString(),
    });
  }

  public endRound(): LeaderboardEntry[] {
    console.log('🏁 Ending round');
    this.gameState.phase = GamePhase.Ending;
    
    const finalLeaderboard = [...this.gameState.leaderboard];
    
    this.signalR.broadcast('roundEnded', {
      round: this.gameState.round,
      leaderboard: finalLeaderboard,
    });
    
    this.telemetry.trackEvent('RoundEnded', {
      round: this.gameState.round.toString(),
      winnerScore: finalLeaderboard[0]?.score.toString() || '0',
    });
    
    // Auto-reset after 10 seconds
    setTimeout(() => {
      this.resetArena();
    }, 10000);
    
    return finalLeaderboard;
  }

  public resetArena(): void {
    console.log('🔄 Resetting arena');
    this.gameState.phase = GamePhase.Resetting;
    
    // Reset all snakes to starting positions
    for (const player of this.players.values()) {
      this.respawnPlayer(player);
    }
    
    // Clear and respawn pellets
    this.pellets.clear();
    this.powerUps.clear();
    this.spawnInitialPellets();
    
    // Prepare for next round
    this.gameState.round++;
    this.gameState.phase = GamePhase.Waiting;
    this.gameState.timeRemaining = this.ROUND_DURATION;
    
    this.signalR.broadcast('arenaReset', {
      round: this.gameState.round,
    });
    
    // Auto-start next round after 5 seconds
    setTimeout(() => {
      this.startRound();
    }, 5000);
  }

  // Player management
  private addPlayer(connectionId: string): void {
    const playerId = uuidv4();
    const snake = this.createNewSnake(playerId);
    
    const player: Player = {
      id: playerId,
      connectionId,
      snake,
      score: 0,
      isAlive: true,
      lastInput: Date.now(),
    };
    
    this.players.set(playerId, player);
    
    this.signalR.sendToConnection(connectionId, 'playerJoined', {
      playerId,
      snake,
      arena: this.ARENA_CONFIG,
    });
    
    console.log(`👤 Player ${playerId} joined`);
    this.telemetry.trackEvent('PlayerJoined', { playerId });
  }

  private removePlayer(connectionId: string): void {
    const player = this.findPlayerByConnection(connectionId);
    if (player) {
      this.players.delete(player.id);
      console.log(`👋 Player ${player.id} left`);
      this.telemetry.trackEvent('PlayerLeft', { playerId: player.id });
    }
  }

  private findPlayerByConnection(connectionId: string): Player | undefined {
    return Array.from(this.players.values()).find(p => p.connectionId === connectionId);
  }

  private createNewSnake(playerId: string): Snake {
    const spawnPoint = this.getRandomSpawnPoint();
    
    return {
      id: playerId,
      segments: [spawnPoint],
      direction: Direction.Right,
      nextDirection: Direction.Right,
      color: this.getRandomColor(),
      speed: 1,
      size: 1,
    };
  }

  private getRandomSpawnPoint(): Position {
    return {
      x: Math.floor(Math.random() * (this.ARENA_CONFIG.width - 20)) + 10,
      y: Math.floor(Math.random() * (this.ARENA_CONFIG.height - 20)) + 10,
    };
  }

  private getRandomColor(): string {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57',
      '#FF9FF3', '#54A0FF', '#5F27CD', '#00D2D3', '#FF9F43',
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  private killPlayer(player: Player): void {
    player.isAlive = false;
    
    // Spawn pellets where snake died
    for (const segment of player.snake.segments) {
      if (Math.random() < 0.7) { // 70% chance per segment
        this.spawnPelletAt(segment, PelletType.Normal, 10);
      }
    }
    
    this.telemetry.trackEvent('PlayerDied', {
      playerId: player.id,
      score: player.score.toString(),
      length: player.snake.segments.length.toString(),
    });
  }

  private respawnPlayer(player: Player): void {
    player.snake = this.createNewSnake(player.id);
    player.score = 0;
    player.isAlive = true;
  }

  // Pellet and power-up management
  private spawnInitialPellets(): void {
    const pelletCount = 50;
    for (let i = 0; i < pelletCount; i++) {
      this.spawnRandomPellet();
    }
  }

  private spawnRandomPellet(): void {
    const position = this.getRandomEmptyPosition();
    if (position) {
      this.spawnPelletAt(position, PelletType.Normal, 10);
    }
  }

  private spawnPelletAt(position: Position, type: PelletType, value: number): void {
    const pellet: Pellet = {
      id: uuidv4(),
      position,
      type,
      value,
    };
    
    this.pellets.set(pellet.id, pellet);
  }

  private spawnRandomPowerUp(): void {
    const position = this.getRandomEmptyPosition();
    if (position) {
      const types = Object.values(PowerUpType);
      const type = types[Math.floor(Math.random() * types.length)];
      
      const powerUp: PowerUp = {
        id: uuidv4(),
        position,
        type,
        duration: 5000, // 5 seconds
        expiresAt: Date.now() + 30000, // Disappears after 30 seconds
      };
      
      this.powerUps.set(powerUp.id, powerUp);
    }
  }

  private getRandomEmptyPosition(): Position | null {
    for (let attempts = 0; attempts < 100; attempts++) {
      const position: Position = {
        x: Math.floor(Math.random() * this.ARENA_CONFIG.width),
        y: Math.floor(Math.random() * this.ARENA_CONFIG.height),
      };
      
      if (this.isPositionEmpty(position)) {
        return position;
      }
    }
    return null;
  }

  private isPositionEmpty(position: Position): boolean {
    // Check against all snake segments
    for (const player of this.players.values()) {
      if (!player.isAlive) continue;
      
      for (const segment of player.snake.segments) {
        if (this.positionsEqual(position, segment)) {
          return false;
        }
      }
    }
    
    // Check against existing pellets
    for (const pellet of this.pellets.values()) {
      if (this.positionsEqual(position, pellet.position)) {
        return false;
      }
    }
    
    return true;
  }

  // Utilities
  private isOutOfBounds(position: Position): boolean {
    return position.x < 0 || position.x >= this.ARENA_CONFIG.width ||
           position.y < 0 || position.y >= this.ARENA_CONFIG.height;
  }

  private positionsEqual(a: Position, b: Position): boolean {
    return a.x === b.x && a.y === b.y;
  }

  private trackTickPerformance(tickTime: number): void {
    this.tickTimes.push(tickTime);
    if (this.tickTimes.length > 100) {
      this.tickTimes.shift();
    }
  }

  private updateMetrics(): void {
    this.metrics.playerCount = this.players.size;
    this.metrics.pelletsCount = this.pellets.size;
    this.metrics.powerUpsCount = this.powerUps.size;
    this.metrics.uptime = process.uptime();
    
    if (this.tickTimes.length > 0) {
      this.metrics.averageLatency = this.tickTimes.reduce((a, b) => a + b, 0) / this.tickTimes.length;
      this.metrics.p95Latency = this.tickTimes.sort((a, b) => a - b)[Math.floor(this.tickTimes.length * 0.95)];
    }
  }

  // Public getters
  public getPlayerCount(): number {
    return this.players.size;
  }

  public getGameState(): GameState {
    return {
      ...this.gameState,
      players: Array.from(this.players.values()),
      pellets: Array.from(this.pellets.values()),
      powerUps: Array.from(this.powerUps.values()),
    };
  }

  public getMetrics(): GameMetrics {
    return { ...this.metrics };
  }
}
