import * as Phaser from 'phaser';
import { Player, Position, ArenaConfig } from '../types/GameTypes';

export class SnakeRenderer {
  private scene: Phaser.Scene;
  private arena: ArenaConfig;
  private snakeGraphics = new Map<string, Phaser.GameObjects.Graphics>();
  private nameTexts = new Map<string, Phaser.GameObjects.Text>();

  constructor(scene: Phaser.Scene, arena: ArenaConfig) {
    this.scene = scene;
    this.arena = arena;
  }

  public renderPlayer(player: Player, isMyPlayer: boolean = false): void {
    const playerId = player.id;
    
    // Get or create graphics object for this snake
    let graphics = this.snakeGraphics.get(playerId);
    if (!graphics) {
      graphics = this.scene.add.graphics();
      this.snakeGraphics.set(playerId, graphics);
    }

    // Get or create name text for this player
    let nameText = this.nameTexts.get(playerId);
    if (!nameText) {
      nameText = this.scene.add.text(0, 0, `Player ${playerId.substring(0, 8)}`, {
        fontSize: '12px',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 2,
        align: 'center'
      });
      nameText.setOrigin(0.5, 0.5);
      this.nameTexts.set(playerId, nameText);
    }

    // Clear previous graphics
    graphics.clear();

    if (!player.isAlive || !player.snake.segments.length) {
      // Hide dead snake
      graphics.setVisible(false);
      nameText.setVisible(false);
      return;
    }

    graphics.setVisible(true);
    nameText.setVisible(true);

    // Set colors based on player
    const snakeColor = this.getSnakeColor(player.snake.color, isMyPlayer);
    const headColor = this.getHeadColor(snakeColor, isMyPlayer);

    // Draw snake segments
    const segments = player.snake.segments;
    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      const worldPos = this.gridToWorld(segment);
      
      // Make head slightly different
      const isHead = i === 0;
      const color = isHead ? headColor : snakeColor;
      const size = isHead ? this.arena.cellSize * 0.9 : this.arena.cellSize * 0.8;
      
      graphics.fillStyle(color);
      graphics.fillRoundedRect(
        worldPos.x - size / 2,
        worldPos.y - size / 2,
        size,
        size,
        size * 0.2
      );

      // Add outline for better visibility
      graphics.lineStyle(2, isMyPlayer ? 0xffffff : 0x000000, 0.8);
      graphics.strokeRoundedRect(
        worldPos.x - size / 2,
        worldPos.y - size / 2,
        size,
        size,
        size * 0.2
      );
    }

    // Position name text above the head
    if (segments.length > 0) {
      const headPos = this.gridToWorld(segments[0]);
      nameText.setPosition(headPos.x, headPos.y - this.arena.cellSize);
      
      // Add score to name
      nameText.setText(`${playerId.substring(0, 8)} (${player.score})`);
    }
  }

  public removePlayer(playerId: string): void {
    const graphics = this.snakeGraphics.get(playerId);
    if (graphics) {
      graphics.destroy();
      this.snakeGraphics.delete(playerId);
    }

    const nameText = this.nameTexts.get(playerId);
    if (nameText) {
      nameText.destroy();
      this.nameTexts.delete(playerId);
    }
  }

  public updateArena(arena: ArenaConfig): void {
    this.arena = arena;
  }

  private gridToWorld(gridPos: Position): Position {
    return {
      x: gridPos.x * this.arena.cellSize + this.arena.cellSize / 2,
      y: gridPos.y * this.arena.cellSize + this.arena.cellSize / 2
    };
  }

  private getSnakeColor(colorString: string, isMyPlayer: boolean): number {
    if (isMyPlayer) {
      return 0x00ff00; // Bright green for my player
    }

    // Convert color string to hex number
    if (colorString.startsWith('#')) {
      return parseInt(colorString.substring(1), 16);
    }

    // Default colors based on hash of color string
    const colors = [
      0xff6b6b, // Red
      0x4ecdc4, // Teal
      0x45b7d1, // Blue
      0x96ceb4, // Green
      0xffeaa7, // Yellow
      0xdda0dd, // Plum
      0xffa07a, // Light Salmon
      0x98d8c8, // Mint
      0xf7dc6f, // Light Yellow
      0xbb8fce  // Light Purple
    ];

    let hash = 0;
    for (let i = 0; i < colorString.length; i++) {
      hash = colorString.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    return colors[Math.abs(hash) % colors.length];
  }

  private getHeadColor(bodyColor: number, isMyPlayer: boolean): number {
    if (isMyPlayer) {
      return 0x00cc00; // Slightly darker green for my player's head
    }
    
    // Make head slightly darker than body
    const r = (bodyColor >> 16) & 0xff;
    const g = (bodyColor >> 8) & 0xff;
    const b = bodyColor & 0xff;
    
    return ((Math.max(0, r - 30) << 16) | 
            (Math.max(0, g - 30) << 8) | 
            Math.max(0, b - 30));
  }

  public setDepth(depth: number): void {
    this.snakeGraphics.forEach(graphics => graphics.setDepth(depth));
    this.nameTexts.forEach(text => text.setDepth(depth + 1));
  }

  public destroy(): void {
    this.snakeGraphics.forEach(graphics => graphics.destroy());
    this.nameTexts.forEach(text => text.destroy());
    this.snakeGraphics.clear();
    this.nameTexts.clear();
  }
}
