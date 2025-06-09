import { Direction } from '../types/GameTypes';

export class InputManager {
  private scene: Phaser.Scene;
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys | null = null;
  private wasdKeys: { [key: string]: Phaser.Input.Keyboard.Key } = {};
  private lastDirection: Direction = Direction.Right;
  private onDirectionChange: ((direction: Direction) => void) | null = null;

  // Touch/Mobile controls
  private touchStartX = 0;
  private touchStartY = 0;
  private minSwipeDistance = 50;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.setupKeyboardInput();
    this.setupTouchInput();
  }

  private setupKeyboardInput(): void {
    if (this.scene.input.keyboard) {
      // Arrow keys
      this.cursors = this.scene.input.keyboard.createCursorKeys();

      // WASD keys
      this.wasdKeys = {
        W: this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
        A: this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
        S: this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
        D: this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      };

      // Prevent default browser behavior for these keys
      this.scene.input.keyboard.addCapture([
        Phaser.Input.Keyboard.KeyCodes.UP,
        Phaser.Input.Keyboard.KeyCodes.DOWN,
        Phaser.Input.Keyboard.KeyCodes.LEFT,
        Phaser.Input.Keyboard.KeyCodes.RIGHT,
        Phaser.Input.Keyboard.KeyCodes.W,
        Phaser.Input.Keyboard.KeyCodes.A,
        Phaser.Input.Keyboard.KeyCodes.S,
        Phaser.Input.Keyboard.KeyCodes.D,
      ]);
    }
  }

  private setupTouchInput(): void {
    // Touch events for mobile
    this.scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.touchStartX = pointer.x;
      this.touchStartY = pointer.y;
    });

    this.scene.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      const deltaX = pointer.x - this.touchStartX;
      const deltaY = pointer.y - this.touchStartY;
      
      // Check if swipe distance is sufficient
      if (Math.abs(deltaX) < this.minSwipeDistance && Math.abs(deltaY) < this.minSwipeDistance) {
        return;
      }

      // Determine swipe direction
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        // Horizontal swipe
        if (deltaX > 0) {
          this.handleDirectionInput(Direction.Right);
        } else {
          this.handleDirectionInput(Direction.Left);
        }
      } else {
        // Vertical swipe
        if (deltaY > 0) {
          this.handleDirectionInput(Direction.Down);
        } else {
          this.handleDirectionInput(Direction.Up);
        }
      }
    });
  }

  public setDirectionChangeCallback(callback: (direction: Direction) => void): void {
    this.onDirectionChange = callback;
  }

  public update(): void {
    if (!this.cursors && !this.wasdKeys.W) return;

    let newDirection: Direction | null = null;

    // Check keyboard input
    if (this.cursors) {
      if (this.cursors.up.isDown || this.wasdKeys.W?.isDown) {
        newDirection = Direction.Up;
      } else if (this.cursors.down.isDown || this.wasdKeys.S?.isDown) {
        newDirection = Direction.Down;
      } else if (this.cursors.left.isDown || this.wasdKeys.A?.isDown) {
        newDirection = Direction.Left;
      } else if (this.cursors.right.isDown || this.wasdKeys.D?.isDown) {
        newDirection = Direction.Right;
      }
    }

    if (newDirection !== null && newDirection !== this.lastDirection) {
      this.handleDirectionInput(newDirection);
    }
  }

  private handleDirectionInput(direction: Direction): void {
    // Prevent immediate reverse direction (snake can't go backward into itself)
    const oppositeDirection = this.getOppositeDirection(this.lastDirection);
    if (direction === oppositeDirection) {
      return;
    }

    this.lastDirection = direction;
    if (this.onDirectionChange) {
      this.onDirectionChange(direction);
    }
  }

  private getOppositeDirection(direction: Direction): Direction {
    switch (direction) {
      case Direction.Up:
        return Direction.Down;
      case Direction.Down:
        return Direction.Up;
      case Direction.Left:
        return Direction.Right;
      case Direction.Right:
        return Direction.Left;
    }
  }

  public handleDPadInput(direction: Direction): void {
    this.handleDirectionInput(direction);
  }

  public getCurrentDirection(): Direction {
    return this.lastDirection;
  }

  public destroy(): void {
    // Clean up input handlers
    this.scene.input.off('pointerdown');
    this.scene.input.off('pointerup');
    this.onDirectionChange = null;
  }
}
