import * as Phaser from 'phaser';
import { GamePhase, LeaderboardEntry, Direction } from '../types/GameTypes';

export class UIScene extends Phaser.Scene {
  private scoreText!: Phaser.GameObjects.Text;
  private timeText!: Phaser.GameObjects.Text;
  private phaseText!: Phaser.GameObjects.Text;
  private leaderboardText!: Phaser.GameObjects.Text;
  private connectionStatusText!: Phaser.GameObjects.Text;
  private roundText!: Phaser.GameObjects.Text;
  
  // Mobile D-pad controls
  private dpadContainer!: Phaser.GameObjects.Container;
  private upButton!: Phaser.GameObjects.Graphics;
  private downButton!: Phaser.GameObjects.Graphics;
  private leftButton!: Phaser.GameObjects.Graphics;
  private rightButton!: Phaser.GameObjects.Graphics;
  
  private onDirectionInput: ((direction: Direction) => void) | null = null;
  
  // Game state
  private currentPhase = GamePhase.Waiting;
  private timeRemaining = 0;
  private isMobile = false;
  private isConnected = false;

  constructor() {
    super({ key: 'UIScene' });
  }

  create(): void {
    // Detect if on mobile device
    this.isMobile = this.sys.game.device.input.touch;
    
    this.createUI();
    this.createMobileControls();
    this.setupEventListeners();
    
    // Start UI update loop
    this.time.addEvent({
      delay: 100, // Update UI every 100ms
      callback: this.updateUI,
      callbackScope: this,
      loop: true
    });
  }

  private createUI(): void {
    const { width } = this.cameras.main;
    
    // Score display (top-left)
    this.scoreText = this.add.text(20, 20, 'Score: 0', {
      fontSize: '24px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3
    });

    // Round and time display (top-center)
    this.roundText = this.add.text(width / 2, 20, 'Round: 1', {
      fontSize: '20px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5, 0);

    this.timeText = this.add.text(width / 2, 50, 'Time: 90s', {
      fontSize: '18px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5, 0);

    // Game phase display (top-center)
    this.phaseText = this.add.text(width / 2, 80, 'Waiting for players...', {
      fontSize: '16px',
      color: '#ffff00',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5, 0);

    // Connection status (top-right)
    this.connectionStatusText = this.add.text(width - 20, 20, '🔴 Disconnected', {
      fontSize: '16px',
      color: '#ff0000',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(1, 0);

    // Leaderboard (right side)
    this.leaderboardText = this.add.text(width - 20, 120, 'Leaderboard:\n', {
      fontSize: '14px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2,
      align: 'right'
    }).setOrigin(1, 0);
  }

  private createMobileControls(): void {
    if (!this.isMobile) return;

    const { height } = this.cameras.main;
    const buttonSpacing = 80;
    
    // Create D-pad container in bottom-left
    this.dpadContainer = this.add.container(100, height - 100);
    
    // Create direction buttons
    this.upButton = this.createDPadButton(0, -buttonSpacing, '▲');
    this.downButton = this.createDPadButton(0, buttonSpacing, '▼');
    this.leftButton = this.createDPadButton(-buttonSpacing, 0, '◀');
    this.rightButton = this.createDPadButton(buttonSpacing, 0, '▶');
    
    this.dpadContainer.add([this.upButton, this.downButton, this.leftButton, this.rightButton]);
    
    // Set up touch events
    this.setupDPadInput(this.upButton, Direction.Up);
    this.setupDPadInput(this.downButton, Direction.Down);
    this.setupDPadInput(this.leftButton, Direction.Left);
    this.setupDPadInput(this.rightButton, Direction.Right);
  }

  private createDPadButton(x: number, y: number, label: string): Phaser.GameObjects.Graphics {
    const button = this.add.graphics();
    button.setPosition(x, y);
    
    // Draw button background
    button.fillStyle(0x333333, 0.7);
    button.fillCircle(0, 0, 30);
    button.lineStyle(2, 0xffffff, 0.8);
    button.strokeCircle(0, 0, 30);
    
    // Add label
    this.add.text(x, y, label, {
      fontSize: '20px',
      color: '#ffffff'
    }).setOrigin(0.5, 0.5);
    
    // Make interactive
    button.setInteractive(new Phaser.Geom.Circle(0, 0, 30), Phaser.Geom.Circle.Contains);
    
    return button;
  }

  private setupDPadInput(button: Phaser.GameObjects.Graphics, direction: Direction): void {
    button.on('pointerdown', () => {
      // Visual feedback
      button.clear();
      button.fillStyle(0x666666, 0.9);
      button.fillCircle(0, 0, 30);
      button.lineStyle(2, 0xffffff, 1);
      button.strokeCircle(0, 0, 30);
      
      // Send input
      if (this.onDirectionInput) {
        this.onDirectionInput(direction);
      }
    });

    button.on('pointerup', () => {
      // Reset visual state
      button.clear();
      button.fillStyle(0x333333, 0.7);
      button.fillCircle(0, 0, 30);
      button.lineStyle(2, 0xffffff, 0.8);
      button.strokeCircle(0, 0, 30);
    });
  }

  private setupEventListeners(): void {
    // Listen for window resize
    this.scale.on('resize', this.handleResize, this);
    
    // Listen for visibility change (tab switching)
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.scene.pause();
      } else {
        this.scene.resume();
      }
    });
  }

  private handleResize(): void {
    const { width, height } = this.cameras.main;
    
    // Reposition UI elements
    this.roundText.setPosition(width / 2, 20);
    this.timeText.setPosition(width / 2, 50);
    this.phaseText.setPosition(width / 2, 80);
    this.connectionStatusText.setPosition(width - 20, 20);
    this.leaderboardText.setPosition(width - 20, 120);
    
    if (this.dpadContainer) {
      this.dpadContainer.setPosition(100, height - 100);
    }
  }

  private updateUI(): void {
    // Update time display with color coding
    const minutes = Math.floor(this.timeRemaining / 60);
    const seconds = this.timeRemaining % 60;
    const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    
    this.timeText.setText(`Time: ${timeString}`);
    
    // Color code based on remaining time
    if (this.timeRemaining <= 10) {
      this.timeText.setColor('#ff0000'); // Red for last 10 seconds
    } else if (this.timeRemaining <= 30) {
      this.timeText.setColor('#ffff00'); // Yellow for last 30 seconds
    } else {
      this.timeText.setColor('#ffffff'); // White normally
    }
    
    // Update phase text
    let phaseString = '';
    switch (this.currentPhase) {
      case GamePhase.Waiting:
        phaseString = 'Waiting for players...';
        this.phaseText.setColor('#ffff00');
        break;
      case GamePhase.Playing:
        phaseString = 'Game in progress';
        this.phaseText.setColor('#00ff00');
        break;
      case GamePhase.Ending:
        phaseString = 'Round ending...';
        this.phaseText.setColor('#ff8800');
        break;
      case GamePhase.Resetting:
        phaseString = 'Preparing next round...';
        this.phaseText.setColor('#8888ff');
        break;
    }
    this.phaseText.setText(phaseString);
  }

  // Public methods to update UI state
  public updateScore(score: number): void {
    this.scoreText.setText(`Score: ${score}`);
  }

  public updateGameState(round: number, phase: GamePhase, timeRemaining: number): void {
    this.currentPhase = phase;
    this.timeRemaining = timeRemaining;
    
    this.roundText.setText(`Round: ${round}`);
  }

  public updateLeaderboard(leaderboard: LeaderboardEntry[]): void {
    let leaderboardString = 'Leaderboard:\n';
    
    leaderboard.slice(0, 5).forEach((entry, index) => {
      const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
      leaderboardString += `${medal} ${entry.playerId.substring(0, 8)}: ${entry.score}\n`;
    });
    
    this.leaderboardText.setText(leaderboardString);
  }

  public updateConnectionStatus(connected: boolean): void {
    this.isConnected = connected;
    const status = this.isConnected ? 'Connected' : 'Disconnected';
    const color = this.isConnected ? '#00ff00' : '#ff0000';
    const icon = this.isConnected ? '🟢' : '🔴';
    
    this.connectionStatusText.setText(`${icon} ${status}`);
    this.connectionStatusText.setColor(color);
  }

  public setDirectionInputCallback(callback: (direction: Direction) => void): void {
    this.onDirectionInput = callback;
  }

  public showGameOverScreen(finalScore: number, rank: number, totalPlayers: number): void {
    const { width, height } = this.cameras.main;
    
    // Create semi-transparent overlay
    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.8);
    overlay.fillRect(0, 0, width, height);
    
    // Game over text
    const gameOverText = this.add.text(width / 2, height / 2 - 80, 'Game Over!', {
      fontSize: '48px',
      color: '#ff0000',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5);
    
    // Final score
    const scoreText = this.add.text(width / 2, height / 2 - 20, `Final Score: ${finalScore}`, {
      fontSize: '24px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5);
    
    // Rank
    const rankText = this.add.text(width / 2, height / 2 + 20, `Rank: ${rank} / ${totalPlayers}`, {
      fontSize: '20px',
      color: '#ffff00',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5);
    
    // Next round countdown
    let countdown = 10;
    const countdownText = this.add.text(width / 2, height / 2 + 60, `Next round in: ${countdown}s`, {
      fontSize: '18px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5);
    
    this.time.addEvent({
      delay: 1000,
      callback: () => {
        countdown--;
        countdownText.setText(`Next round in: ${countdown}s`);
        if (countdown <= 0) {
          overlay.destroy();
          gameOverText.destroy();
          scoreText.destroy();
          rankText.destroy();
          countdownText.destroy();
        }
      },
      repeat: 9
    });
  }

  public showConnectionLost(): void {
    const { width, height } = this.cameras.main;
    
    const reconnectText = this.add.text(width / 2, height / 2, 'Connection lost...\nReconnecting...', {
      fontSize: '24px',
      color: '#ffff00',
      stroke: '#000000',
      strokeThickness: 3,
      align: 'center'
    }).setOrigin(0.5);
    
    // Pulse animation
    this.tweens.add({
      targets: reconnectText,
      alpha: 0.5,
      duration: 1000,
      yoyo: true,
      repeat: -1
    });
    
    // Remove after 5 seconds or when reconnected
    this.time.delayedCall(5000, () => {
      if (reconnectText) {
        reconnectText.destroy();
      }
    });
  }
}
