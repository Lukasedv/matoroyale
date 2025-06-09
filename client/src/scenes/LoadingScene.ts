import * as Phaser from 'phaser';

export class LoadingScene extends Phaser.Scene {
  private loadingText!: Phaser.GameObjects.Text;
  private progressBar!: Phaser.GameObjects.Graphics;
  private progressBox!: Phaser.GameObjects.Graphics;

  constructor() {
    super({ key: 'LoadingScene' });
  }

  preload(): void {
    // Create loading UI
    this.createLoadingUI();

    // Set loading event listeners
    this.load.on('progress', this.updateProgress, this);
    this.load.on('complete', this.loadComplete, this);

    // Load game assets (minimal for snake game)
    this.load.image('pellet', 'data:image/svg+xml;base64,' + btoa(`
      <svg width="10" height="10" xmlns="http://www.w3.org/2000/svg">
        <circle cx="5" cy="5" r="4" fill="#4ECDC4" stroke="#ffffff" stroke-width="1"/>
      </svg>
    `));

    this.load.image('powerup-speed', 'data:image/svg+xml;base64,' + btoa(`
      <svg width="12" height="12" xmlns="http://www.w3.org/2000/svg">
        <circle cx="6" cy="6" r="5" fill="#FF6B6B" stroke="#ffffff" stroke-width="1"/>
        <text x="6" y="9" text-anchor="middle" fill="white" font-size="8" font-weight="bold">⚡</text>
      </svg>
    `));

    this.load.image('powerup-growth', 'data:image/svg+xml;base64,' + btoa(`
      <svg width="12" height="12" xmlns="http://www.w3.org/2000/svg">
        <circle cx="6" cy="6" r="5" fill="#96CEB4" stroke="#ffffff" stroke-width="1"/>
        <text x="6" y="9" text-anchor="middle" fill="white" font-size="8" font-weight="bold">+</text>
      </svg>
    `));

    this.load.image('mine', 'data:image/svg+xml;base64,' + btoa(`
      <svg width="10" height="10" xmlns="http://www.w3.org/2000/svg">
        <circle cx="5" cy="5" r="4" fill="#FF4757" stroke="#2f1b14" stroke-width="1"/>
        <circle cx="5" cy="5" r="2" fill="#2f1b14"/>
      </svg>
    `));

    // Simulate loading delay for demo
    for (let i = 0; i < 20; i++) {
      this.load.image(`dummy${i}`, 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7');
    }
  }

  private createLoadingUI(): void {
    const centerX = this.cameras.main.worldView.x + this.cameras.main.width / 2;
    const centerY = this.cameras.main.worldView.y + this.cameras.main.height / 2;

    // Progress bar background
    this.progressBox = this.add.graphics();
    this.progressBox.fillStyle(0x222222);
    this.progressBox.fillRoundedRect(centerX - 160, centerY - 25, 320, 50, 10);

    // Progress bar
    this.progressBar = this.add.graphics();

    // Loading text
    this.loadingText = this.add.text(centerX, centerY - 60, 'Loading Mato Royale...', {
      font: '24px Inter',
      color: '#4ECDC4',
    }).setOrigin(0.5);

    // Subtitle
    this.add.text(centerX, centerY + 40, 'Preparing the arena...', {
      font: '16px Inter',
      color: '#ffffff',
    }).setOrigin(0.5).setAlpha(0.7);
  }

  private updateProgress(value: number): void {
    // Update progress bar
    this.progressBar.clear();
    this.progressBar.fillStyle(0x4ECDC4);
    this.progressBar.fillRoundedRect(
      this.cameras.main.worldView.x + this.cameras.main.width / 2 - 150,
      this.cameras.main.worldView.y + this.cameras.main.height / 2 - 15,
      300 * value,
      30,
      5
    );

    // Update loading text
    const percentage = Math.round(value * 100);
    this.loadingText.setText(`Loading... ${percentage}%`);
  }

  private loadComplete(): void {
    console.log('🎮 Assets loaded, starting game...');
    
    // Hide HTML loading screen
    const loadingElement = document.getElementById('loading');
    if (loadingElement) {
      loadingElement.style.display = 'none';
    }

    // Transition to game scene
    this.time.delayedCall(500, () => {
      this.scene.start('GameScene');
      this.scene.start('UIScene');
    });
  }
}
