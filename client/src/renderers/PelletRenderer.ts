import * as Phaser from 'phaser';
import { Pellet, PelletType, Position, ArenaConfig } from '../types/GameTypes';

export class PelletRenderer {
  private scene: Phaser.Scene;
  private arena: ArenaConfig;
  private pelletGraphics = new Map<string, Phaser.GameObjects.Graphics>();
  private pelletTweens = new Map<string, Phaser.Tweens.Tween>();

  constructor(scene: Phaser.Scene, arena: ArenaConfig) {
    this.scene = scene;
    this.arena = arena;
  }

  public renderPellet(pellet: Pellet): void {
    const pelletId = pellet.id;
    
    // Get or create graphics object for this pellet
    let graphics = this.pelletGraphics.get(pelletId);
    if (!graphics) {
      graphics = this.scene.add.graphics();
      this.pelletGraphics.set(pelletId, graphics);
      
      // Add pulsing animation for special pellets
      if (pellet.type !== PelletType.Normal) {
        const tween = this.scene.tweens.add({
          targets: graphics,
          scaleX: 1.2,
          scaleY: 1.2,
          duration: 800,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut'
        });
        this.pelletTweens.set(pelletId, tween);
      }
    }

    // Clear previous graphics
    graphics.clear();

    const worldPos = this.gridToWorld(pellet.position);
    const color = this.getPelletColor(pellet.type);
    const size = this.getPelletSize(pellet.type);

    // Draw pellet based on type
    switch (pellet.type) {
      case PelletType.Normal:
        this.drawNormalPellet(graphics, worldPos, color, size);
        break;
      case PelletType.Speed:
        this.drawSpeedPellet(graphics, worldPos, color, size);
        break;
      case PelletType.Shrink:
        this.drawShrinkPellet(graphics, worldPos, color, size);
        break;
      case PelletType.Mine:
        this.drawMinePellet(graphics, worldPos, color, size);
        break;
    }

    // Add value indicator for valuable pellets
    if (pellet.value > 1) {
      this.drawValueIndicator(graphics, worldPos, pellet.value);
    }

    // Handle expiring pellets
    if (pellet.expiresAt) {
      const timeLeft = pellet.expiresAt - Date.now();
      if (timeLeft < 3000) { // Last 3 seconds
        this.addExpirationEffect(graphics, timeLeft);
      }
    }
  }

  private drawNormalPellet(graphics: Phaser.GameObjects.Graphics, pos: Position, color: number, size: number): void {
    graphics.fillStyle(color);
    graphics.fillCircle(pos.x, pos.y, size);
    
    // Add subtle outline
    graphics.lineStyle(1, 0xffffff, 0.8);
    graphics.strokeCircle(pos.x, pos.y, size);
  }

  private drawSpeedPellet(graphics: Phaser.GameObjects.Graphics, pos: Position, color: number, size: number): void {
    // Lightning bolt shape for speed
    graphics.fillStyle(color);
    graphics.beginPath();
    graphics.moveTo(pos.x - size * 0.5, pos.y - size * 0.3);
    graphics.lineTo(pos.x + size * 0.2, pos.y - size * 0.8);
    graphics.lineTo(pos.x - size * 0.1, pos.y - size * 0.1);
    graphics.lineTo(pos.x + size * 0.5, pos.y + size * 0.3);
    graphics.lineTo(pos.x - size * 0.2, pos.y + size * 0.8);
    graphics.lineTo(pos.x + size * 0.1, pos.y + size * 0.1);
    graphics.closePath();
    graphics.fillPath();
  }

  private drawShrinkPellet(graphics: Phaser.GameObjects.Graphics, pos: Position, color: number, size: number): void {
    // Triangle for shrink pellet
    graphics.fillStyle(color);
    graphics.fillTriangle(
      pos.x, pos.y - size,
      pos.x - size * 0.8, pos.y + size * 0.5,
      pos.x + size * 0.8, pos.y + size * 0.5
    );
    
    graphics.lineStyle(2, 0xffffff, 0.8);
    graphics.strokeTriangle(
      pos.x, pos.y - size,
      pos.x - size * 0.8, pos.y + size * 0.5,
      pos.x + size * 0.8, pos.y + size * 0.5
    );
  }

  private drawMinePellet(graphics: Phaser.GameObjects.Graphics, pos: Position, color: number, size: number): void {
    // Skull shape for mine (simplified)
    graphics.fillStyle(color);
    graphics.fillCircle(pos.x, pos.y - size * 0.2, size);
    
    // Draw X mark
    graphics.lineStyle(3, 0xff0000, 1);
    graphics.beginPath();
    graphics.moveTo(pos.x - size * 0.5, pos.y - size * 0.5);
    graphics.lineTo(pos.x + size * 0.5, pos.y + size * 0.5);
    graphics.moveTo(pos.x + size * 0.5, pos.y - size * 0.5);
    graphics.lineTo(pos.x - size * 0.5, pos.y + size * 0.5);
    graphics.strokePath();
  }

  private drawValueIndicator(_graphics: Phaser.GameObjects.Graphics, pos: Position, value: number): void {
    // Small text showing the value
    const text = this.scene.add.text(pos.x, pos.y + this.arena.cellSize * 0.6, `+${value}`, {
      fontSize: '10px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 1,
      align: 'center'
    });
    text.setOrigin(0.5, 0.5);
    
    // Auto-destroy the text after a short time
    this.scene.time.delayedCall(2000, () => {
      if (text) {
        text.destroy();
      }
    });
  }

  private addExpirationEffect(graphics: Phaser.GameObjects.Graphics, timeLeft: number): void {
    // Blink faster as expiration approaches
    const blinkSpeed = Math.max(100, timeLeft / 10);
    
    this.scene.tweens.add({
      targets: graphics,
      alpha: 0.3,
      duration: blinkSpeed,
      yoyo: true,
      repeat: Math.floor(timeLeft / (blinkSpeed * 2))
    });
  }

  public removePellet(pelletId: string): void {
    const graphics = this.pelletGraphics.get(pelletId);
    if (graphics) {
      graphics.destroy();
      this.pelletGraphics.delete(pelletId);
    }

    const tween = this.pelletTweens.get(pelletId);
    if (tween) {
      tween.destroy();
      this.pelletTweens.delete(pelletId);
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

  private getPelletColor(type: PelletType): number {
    switch (type) {
      case PelletType.Normal:
        return 0xffffff; // White
      case PelletType.Speed:
        return 0xffff00; // Yellow
      case PelletType.Shrink:
        return 0xff8c00; // Orange
      case PelletType.Mine:
        return 0x8b0000; // Dark red
      default:
        return 0xffffff;
    }
  }

  private getPelletSize(type: PelletType): number {
    const baseSize = this.arena.cellSize * 0.3;
    
    switch (type) {
      case PelletType.Normal:
        return baseSize;
      case PelletType.Speed:
      case PelletType.Shrink:
        return baseSize * 1.2;
      case PelletType.Mine:
        return baseSize * 1.5;
      default:
        return baseSize;
    }
  }

  public setDepth(depth: number): void {
    this.pelletGraphics.forEach(graphics => graphics.setDepth(depth));
  }

  public destroy(): void {
    this.pelletGraphics.forEach(graphics => graphics.destroy());
    this.pelletTweens.forEach(tween => tween.destroy());
    this.pelletGraphics.clear();
    this.pelletTweens.clear();
  }
}
