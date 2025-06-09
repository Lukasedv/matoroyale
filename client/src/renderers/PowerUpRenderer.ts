import * as Phaser from 'phaser';
import { PowerUp, PowerUpType, Position, ArenaConfig } from '../types/GameTypes';

export class PowerUpRenderer {
  private scene: Phaser.Scene;
  private arena: ArenaConfig;
  private powerUpGraphics = new Map<string, Phaser.GameObjects.Graphics>();
  private powerUpTweens = new Map<string, Phaser.Tweens.Tween>();
  private powerUpTexts = new Map<string, Phaser.GameObjects.Text>();

  constructor(scene: Phaser.Scene, arena: ArenaConfig) {
    this.scene = scene;
    this.arena = arena;
  }

  public renderPowerUp(powerUp: PowerUp): void {
    const powerUpId = powerUp.id;
    
    // Get or create graphics object for this power-up
    let graphics = this.powerUpGraphics.get(powerUpId);
    if (!graphics) {
      graphics = this.scene.add.graphics();
      this.powerUpGraphics.set(powerUpId, graphics);
      
      // Add rotating animation
      const rotationTween = this.scene.tweens.add({
        targets: graphics,
        rotation: Math.PI * 2,
        duration: 2000,
        repeat: -1,
        ease: 'Linear'
      });
      this.powerUpTweens.set(powerUpId + '_rotation', rotationTween);

      // Add pulsing animation
      const pulseTween = this.scene.tweens.add({
        targets: graphics,
        scaleX: 1.3,
        scaleY: 1.3,
        duration: 1000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
      this.powerUpTweens.set(powerUpId + '_pulse', pulseTween);
    }

    // Clear previous graphics
    graphics.clear();

    const worldPos = this.gridToWorld(powerUp.position);
    const color = this.getPowerUpColor(powerUp.type);
    const size = this.arena.cellSize * 0.4;

    // Draw power-up based on type
    switch (powerUp.type) {
      case PowerUpType.SpeedBoost:
        this.drawSpeedBoostPowerUp(graphics, worldPos, color, size);
        break;
      case PowerUpType.Invincible:
        this.drawInvinciblePowerUp(graphics, worldPos, color, size);
        break;
      case PowerUpType.GrowthBoost:
        this.drawGrowthBoostPowerUp(graphics, worldPos, color, size);
        break;
    }

    // Add duration indicator
    this.addDurationIndicator(powerUpId, worldPos, powerUp);

    // Handle expiring power-ups
    const timeLeft = powerUp.expiresAt - Date.now();
    if (timeLeft < 5000) { // Last 5 seconds
      this.addExpirationEffect(graphics, timeLeft);
    }
  }

  private drawSpeedBoostPowerUp(graphics: Phaser.GameObjects.Graphics, pos: Position, color: number, size: number): void {
    // Draw a star for speed boost
    graphics.fillStyle(color);
    graphics.lineStyle(2, 0xffffff, 1);
    
    const points: number[] = [];
    const starPoints = 5;
    const outerRadius = size;
    const innerRadius = size * 0.5;
    
    for (let i = 0; i < starPoints * 2; i++) {
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const angle = (i * Math.PI) / starPoints;
      points.push(pos.x + Math.cos(angle) * radius);
      points.push(pos.y + Math.sin(angle) * radius);
    }
    
    graphics.fillPoints(points);
    graphics.strokePoints(points);
  }

  private drawInvinciblePowerUp(graphics: Phaser.GameObjects.Graphics, pos: Position, color: number, size: number): void {
    // Draw a shield shape for invincibility
    graphics.fillStyle(color);
    graphics.lineStyle(3, 0xffffff, 1);
    
    graphics.beginPath();
    graphics.moveTo(pos.x, pos.y - size);
    graphics.lineTo(pos.x + size * 0.7, pos.y - size * 0.5);
    graphics.lineTo(pos.x + size * 0.7, pos.y + size * 0.3);
    graphics.lineTo(pos.x, pos.y + size);
    graphics.lineTo(pos.x - size * 0.7, pos.y + size * 0.3);
    graphics.lineTo(pos.x - size * 0.7, pos.y - size * 0.5);
    graphics.closePath();
    graphics.fillPath();
    graphics.strokePath();
  }

  private drawGrowthBoostPowerUp(graphics: Phaser.GameObjects.Graphics, pos: Position, color: number, size: number): void {
    // Draw a diamond for growth boost
    graphics.fillStyle(color);
    graphics.lineStyle(2, 0xffffff, 1);
    
    graphics.beginPath();
    graphics.moveTo(pos.x, pos.y - size);
    graphics.lineTo(pos.x + size, pos.y);
    graphics.lineTo(pos.x, pos.y + size);
    graphics.lineTo(pos.x - size, pos.y);
    graphics.closePath();
    graphics.fillPath();
    graphics.strokePath();
    
    // Add inner diamond
    graphics.fillStyle(0xffffff);
    const innerSize = size * 0.4;
    graphics.beginPath();
    graphics.moveTo(pos.x, pos.y - innerSize);
    graphics.lineTo(pos.x + innerSize, pos.y);
    graphics.lineTo(pos.x, pos.y + innerSize);
    graphics.lineTo(pos.x - innerSize, pos.y);
    graphics.closePath();
    graphics.fillPath();
  }

  private addDurationIndicator(powerUpId: string, pos: Position, powerUp: PowerUp): void {
    let text = this.powerUpTexts.get(powerUpId);
    if (!text) {
      text = this.scene.add.text(pos.x, pos.y + this.arena.cellSize * 0.8, '', {
        fontSize: '10px',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 2,
        align: 'center'
      });
      text.setOrigin(0.5, 0.5);
      this.powerUpTexts.set(powerUpId, text);
    }

    const timeLeft = Math.max(0, Math.ceil((powerUp.expiresAt - Date.now()) / 1000));
    text.setText(`${timeLeft}s`);
    text.setPosition(pos.x, pos.y + this.arena.cellSize * 0.8);
  }

  private addExpirationEffect(graphics: Phaser.GameObjects.Graphics, timeLeft: number): void {
    // Blink faster as expiration approaches
    const blinkSpeed = Math.max(100, timeLeft / 20);
    
    this.scene.tweens.add({
      targets: graphics,
      alpha: 0.4,
      duration: blinkSpeed,
      yoyo: true,
      repeat: Math.floor(timeLeft / (blinkSpeed * 2))
    });
  }

  public removePowerUp(powerUpId: string): void {
    const graphics = this.powerUpGraphics.get(powerUpId);
    if (graphics) {
      graphics.destroy();
      this.powerUpGraphics.delete(powerUpId);
    }

    const text = this.powerUpTexts.get(powerUpId);
    if (text) {
      text.destroy();
      this.powerUpTexts.delete(powerUpId);
    }

    // Clean up all tweens for this power-up
    const rotationTween = this.powerUpTweens.get(powerUpId + '_rotation');
    if (rotationTween) {
      rotationTween.destroy();
      this.powerUpTweens.delete(powerUpId + '_rotation');
    }

    const pulseTween = this.powerUpTweens.get(powerUpId + '_pulse');
    if (pulseTween) {
      pulseTween.destroy();
      this.powerUpTweens.delete(powerUpId + '_pulse');
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

  private getPowerUpColor(type: PowerUpType): number {
    switch (type) {
      case PowerUpType.SpeedBoost:
        return 0x00ffff; // Cyan
      case PowerUpType.Invincible:
        return 0xff00ff; // Magenta
      case PowerUpType.GrowthBoost:
        return 0x00ff00; // Green
      default:
        return 0xffffff;
    }
  }

  public setDepth(depth: number): void {
    this.powerUpGraphics.forEach(graphics => graphics.setDepth(depth));
    this.powerUpTexts.forEach(text => text.setDepth(depth + 1));
  }

  public destroy(): void {
    this.powerUpGraphics.forEach(graphics => graphics.destroy());
    this.powerUpTexts.forEach(text => text.destroy());
    this.powerUpTweens.forEach(tween => tween.destroy());
    this.powerUpGraphics.clear();
    this.powerUpTexts.clear();
    this.powerUpTweens.clear();
  }
}
