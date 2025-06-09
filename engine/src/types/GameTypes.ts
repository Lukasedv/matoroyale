export interface Position {
  x: number;
  y: number;
}

export interface Player {
  id: string;
  connectionId: string;
  snake: Snake;
  score: number;
  isAlive: boolean;
  lastInput: number;
}

export interface Snake {
  id: string;
  segments: Position[];
  direction: Direction;
  nextDirection: Direction;
  color: string;
  speed: number;
  size: number;
}

export enum Direction {
  Up = 0,
  Right = 1,
  Down = 2,
  Left = 3,
}

export interface Pellet {
  id: string;
  position: Position;
  type: PelletType;
  value: number;
  expiresAt?: number;
}

export enum PelletType {
  Normal = 'normal',
  Speed = 'speed',
  Shrink = 'shrink',
  Mine = 'mine',
}

export interface PowerUp {
  id: string;
  position: Position;
  type: PowerUpType;
  duration: number;
  expiresAt: number;
}

export enum PowerUpType {
  SpeedBoost = 'speed-boost',
  Invincible = 'invincible',
  GrowthBoost = 'growth-boost',
}

export interface GameState {
  round: number;
  phase: GamePhase;
  timeRemaining: number;
  roundStartTime?: number;
  players: Player[];
  pellets: Pellet[];
  powerUps: PowerUp[];
  leaderboard: LeaderboardEntry[];
  arena: ArenaConfig;
}

export enum GamePhase {
  Waiting = 'waiting',
  Playing = 'playing',
  Ending = 'ending',
  Resetting = 'resetting',
}

export interface LeaderboardEntry {
  playerId: string;
  score: number;
  length: number;
  rank: number;
}

export interface ArenaConfig {
  width: number;
  height: number;
  cellSize: number;
}

export interface InputEvent {
  playerId: string;
  direction: Direction;
  timestamp: number;
}

export interface GameUpdate {
  timestamp: number;
  players: Partial<Player>[];
  pellets: Pellet[];
  powerUps: PowerUp[];
  leaderboard: LeaderboardEntry[];
  gameState: {
    phase: GamePhase;
    timeRemaining: number;
    round: number;
  };
}

export interface GameMetrics {
  playerCount: number;
  tickRate: number;
  averageLatency: number;
  p95Latency: number;
  pelletsCount: number;
  powerUpsCount: number;
  roundsPlayed: number;
  uptime: number;
}
