import { Sprite, Fighter } from "./classes";

/**
 * GameEngine - Manages the game state and rendering
 * Decouples the game logic from the canvas rendering
 * Allows React to control game flow and sync state
 */
export class GameEngine {
  constructor(canvas, options = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.canvas.width = 1024;
    this.canvas.height = 430;

    this.gravity = 0.7;
    this._resolveAsset = (relativePath) =>
      new URL(relativePath, import.meta.url).href;
    this.isRunning = false;
    this.gameOver = false;
    this.remoteSync = {
      player1: { targetPosition: null, lastServerAt: 0 },
      player2: { targetPosition: null, lastServerAt: 0 },
    };

    // Ownership flag - determines which fighter the local input controls
    // If true, local input controls `player` (player1). If false, local input controls `enemy` (player2).
    this.localIsPlayer1 = options.localIsPlayer1 !== false;

    // Callbacks for React integration
    this.onDamage = options.onDamage || (() => {});
    this.onGameOver = options.onGameOver || (() => {});
    this.onAction = options.onAction || (() => {});
    this.onTimerUpdate = options.onTimerUpdate || (() => {});

    // Initialize game objects
    this._initializeSprites();
    this._initializeFighters();
    this._setupKeyHandling();

    this.keys = {
      ArrowLeft: { pressed: false },
      ArrowRight: { pressed: false },
      ArrowUp: { pressed: false },
    };

    this.timer = 300; // 5 minutes
    this.timerId = null;
  }

  /**
   * Initialize background and environmental sprites
   */
  _initializeSprites() {
    this.background = new Sprite({
      position: { x: 0, y: 0 },
      imageSrc: this._resolveAsset("./assets/img/backgroundresize.png"),
      ctx: this.ctx,
    });

    this.shop = new Sprite({
      position: { x: 600, y: 50 },
      imageSrc: this._resolveAsset("./assets/img/shop.png"),
      scale: 2.75,
      frameMax: 6,
      ctx: this.ctx,
    });
  }

  /**
   * Initialize player and enemy fighters
   * Character assignments:
   * - Player 1 (local): King Arthur
   * - Player 2 (opponent): Shadow Ninja (Kenji)
   */
  _initializeFighters() {
    // Player 1: King Arthur
    this.player = new Fighter({
      position: { x: 250, y: 0 },
      velocity: { x: 0, y: 0 },
      scale: 3,
      offset: { x: 215, y: 162 },
      imageSrc: this._resolveAsset("./assets/img/king/Idle.png"),
      frameMax: 8,
      ctx: this.ctx,
      sprites: {
        attack1: {
          imageSrc: this._resolveAsset("./assets/img/king/Attack1.png"),
          frameMax: 4,
        },
        attack2: {
          imageSrc: this._resolveAsset("./assets/img/king/Attack2.png"),
          frameMax: 4,
        },
        death: {
          imageSrc: this._resolveAsset("./assets/img/king/Death.png"),
          frameMax: 6,
        },
        fall: {
          imageSrc: this._resolveAsset("./assets/img/king/Fall.png"),
          frameMax: 2,
        },
        idle: {
          imageSrc: this._resolveAsset("./assets/img/king/Idle.png"),
          frameMax: 8,
        },
        jump: {
          imageSrc: this._resolveAsset("./assets/img/king/Jump.png"),
          frameMax: 2,
        },
        run: {
          imageSrc: this._resolveAsset("./assets/img/king/Run.png"),
          frameMax: 8,
        },
        takehit: {
          imageSrc: this._resolveAsset("./assets/img/king/TakeHit.png"),
          frameMax: 4,
        },
      },
      attackbox: {
        offset: { x: 60, y: 50 },
        width: 150,
        height: 50,
      },
    });

    // Player 2: Shadow Ninja (Kenji)
    this.enemy = new Fighter({
      position: { x: 650, y: 0 },
      velocity: { x: 0, y: 0 },
      scale: 3,
      offset: { x: 215, y: 231 },
      imageSrc: this._resolveAsset("./assets/img/kenji/Idle.png"),
      frameMax: 4,
      ctx: this.ctx,
      sprites: {
        attack1: {
          imageSrc: this._resolveAsset("./assets/img/kenji/Attack1.png"),
          frameMax: 4,
        },
        attack2: {
          imageSrc: this._resolveAsset("./assets/img/kenji/Attack2.png"),
          frameMax: 4,
        },
        death: {
          imageSrc: this._resolveAsset("./assets/img/kenji/Death.png"),
          frameMax: 7,
        },
        fall: {
          imageSrc: this._resolveAsset("./assets/img/kenji/Fall.png"),
          frameMax: 2,
        },
        idle: {
          imageSrc: this._resolveAsset("./assets/img/kenji/Idle.png"),
          frameMax: 4,
        },
        jump: {
          imageSrc: this._resolveAsset("./assets/img/kenji/Jump.png"),
          frameMax: 2,
        },
        run: {
          imageSrc: this._resolveAsset("./assets/img/kenji/Run.png"),
          frameMax: 8,
        },
        takehit: {
          imageSrc: this._resolveAsset("./assets/img/kenji/TakeHit.png"),
          frameMax: 3,
        },
      },
      attackbox: {
        offset: { x: -120, y: 50 },
        width: 150,
        height: 50,
      },
    });

    // Set context for all sprites
    Object.values(this.player.sprites).forEach((sprite) => {
      sprite.ctx = this.ctx;
    });
    Object.values(this.enemy.sprites).forEach((sprite) => {
      sprite.ctx = this.ctx;
    });
  }

  /**
   * Setup keyboard event handlers
   */
  _setupKeyHandling() {
    this._boundKeyDown = (e) => this._handleKeyDown(e);
    this._boundKeyUp = (e) => this._handleKeyUp(e);
    document.addEventListener("keydown", this._boundKeyDown);
    document.addEventListener("keyup", this._boundKeyUp);
  }

  /**
   * Handle keyboard input
   */
  _handleKeyDown(e) {
    if (this.gameOver || !this.isRunning) return;

    const { key, repeat } = e;
    // Determine which fighter is controlled locally
    const localFighter = this.localIsPlayer1 ? this.player : this.enemy;

    if (!localFighter.dead) {
      switch (key) {
        case "ArrowLeft":
          if (!this.keys.ArrowLeft.pressed) {
            this.keys.ArrowLeft.pressed = true;
            localFighter.lastKey = "ArrowLeft";
            this.onAction("move-left");
          }
          break;
        case "ArrowRight":
          if (!this.keys.ArrowRight.pressed) {
            this.keys.ArrowRight.pressed = true;
            localFighter.lastKey = "ArrowRight";
            this.onAction("move-right");
          }
          break;
        case "ArrowUp":
          if (!repeat && localFighter.flag) {
            localFighter.velocity.y = -18;
            this.onAction("jump");
          }
          break;
        case "a":
        case "A":
          if (!repeat) {
            localFighter.attack(0); // Basic attack
            this.onAction("attack-basic");
          }
          break;
        case "d":
        case "D":
          if (!repeat) {
            localFighter.attack(1); // Special attack
            this.onAction("attack-special");
          }
          break;
      }
    }
  }

  /**
   * Handle keyboard key release
   */
  _handleKeyUp(e) {
    const { key } = e;

    const localFighter = this.localIsPlayer1 ? this.player : this.enemy;

    switch (key) {
      case "ArrowLeft":
        this.keys.ArrowLeft.pressed = false;
        if (localFighter.lastKey === "ArrowLeft") {
          localFighter.lastKey = null;
          this.onAction("move-stop");
        }
        break;
      case "ArrowRight":
        this.keys.ArrowRight.pressed = false;
        if (localFighter.lastKey === "ArrowRight") {
          localFighter.lastKey = null;
          this.onAction("move-stop");
        }
        break;
    }
  }

  /**
   * Check for collision between two fighters
   */
  _checkCollision(rect1, rect2) {
    return (
      rect1.attackbox.position.x + rect1.attackbox.width >= rect2.position.x &&
      rect1.attackbox.position.x <= rect2.position.x + rect2.width &&
      rect1.attackbox.position.y + rect1.attackbox.height >= rect2.position.y &&
      rect1.attackbox.position.y <= rect2.position.y + rect2.height
    );
  }

  /**
   * Apply damage to a fighter
   * @param {Fighter} attacker - Fighter doing the attacking
   * @param {Fighter} defender - Fighter taking damage
   */
  _applyDamage(attacker, defender) {
    const attackerIsLocal =
      (this.localIsPlayer1 && attacker === this.player) ||
      (!this.localIsPlayer1 && attacker === this.enemy);

    if (!attackerIsLocal) return;
    if (defender.dead) return;
    if (!this._checkCollision(attacker, defender) || !attacker.isAttacking)
      return;
    if (attacker.attackHitRegistered || attacker.frameCurrent !== 2) return;

    attacker.attackHitRegistered = true;
    attacker.isAttacking = false;

    // Only apply hit on the local attacker side; server will sync health
    const defenderKey = defender === this.enemy ? "player2" : "player1";
    defender.takehit();

    this.onDamage({
      defender: defenderKey,
      damage: 3,
      newHealth: defender.Health,
    });

    if (defender.Health <= 0) {
      this.gameOver = true;
      this.onGameOver({
        winner: defenderKey === "player2" ? "player1" : "player2",
        player1Health: this.player.Health,
        player2Health: this.enemy.Health,
      });
    }
  }

  /**
   * Update player movement based on keys pressed
   */
  _updatePlayerMovement() {
    // Update the fighter controlled by the local client
    const localFighter = this.localIsPlayer1 ? this.player : this.enemy;
    localFighter.velocity.x = 0;

    // normalized speed (px per frame at 60fps baseline)
    const moveSpeed = 4; // lower value to reduce excessive speed

    if (
      this.keys.ArrowLeft.pressed &&
      localFighter.lastKey === "ArrowLeft" &&
      localFighter.position.x > this._getFighterBounds(localFighter).minX
    ) {
      localFighter.velocity.x = -moveSpeed;
      localFighter.switchSprites("run");
    } else if (
      this.keys.ArrowRight.pressed &&
      localFighter.lastKey === "ArrowRight" &&
      localFighter.position.x < this._getFighterBounds(localFighter).maxX
    ) {
      localFighter.velocity.x = moveSpeed;
      localFighter.switchSprites("run");
    } else {
      localFighter.velocity.x = 0;
      localFighter.switchSprites("idle");
    }

    // Handle vertical movement for local fighter
    if (localFighter.velocity.y < 0) {
      localFighter.switchSprites("jump");
    } else if (localFighter.velocity.y > 0) {
      localFighter.switchSprites("fall");
    }
  }

  /**
   * Update enemy movement based on keys pressed
   */
  _updateEnemyMovement() {
    // Update the remote fighter (the one not controlled locally)
    const remoteFighter = this.localIsPlayer1 ? this.enemy : this.player;

    // Remote movement is rendered from server targets. Avoid adding local
    // horizontal velocity here, because it fights correction packets and jitters.
    remoteFighter.velocity.x = 0;
    this._smoothRemoteFighter(remoteFighter);

    const syncKey = remoteFighter === this.player ? "player1" : "player2";
    const targetPosition = this.remoteSync[syncKey]?.targetPosition;
    const targetDeltaX = targetPosition
      ? targetPosition.x - remoteFighter.position.x
      : 0;

    if (
      Math.abs(targetDeltaX) > 1 ||
      remoteFighter.lastKey === "ArrowLeft" ||
      remoteFighter.lastKey === "ArrowRight"
    ) {
      remoteFighter.switchSprites("run");
    } else {
      remoteFighter.switchSprites("idle");
    }

    // Handle vertical movement for remote fighter
    if (remoteFighter.velocity.y < 0) {
      remoteFighter.switchSprites("jump");
    } else if (remoteFighter.velocity.y > 0) {
      remoteFighter.switchSprites("fall");
    }
  }

  /**
   * Ease remote fighters toward their last authoritative server position.
   */
  _smoothRemoteFighter(fighter) {
    const syncKey = fighter === this.player ? "player1" : "player2";
    const targetPosition = this.remoteSync[syncKey]?.targetPosition;
    if (!targetPosition) return;

    const dx = targetPosition.x - fighter.position.x;
    const dy = targetPosition.y - fighter.position.y;
    const distance = Math.hypot(dx, dy);

    if (distance > 180) {
      fighter.position.x = targetPosition.x;
      fighter.position.y = targetPosition.y;
      fighter.velocity.x = 0;
      fighter.velocity.y = 0;
      return;
    }

    const alpha = 0.22;
    fighter.position.x += dx * alpha;
    fighter.position.y += dy * alpha;

    if (Math.abs(dx) < 0.5) fighter.position.x = targetPosition.x;
    if (Math.abs(dy) < 0.5) fighter.position.y = targetPosition.y;

    fighter.velocity.y = 0;
    this._clampFighterToArena(fighter);
  }

  _getFighterBounds(fighter) {
    return {
      minX: 0,
      maxX: this.canvas.width - fighter.width,
    };
  }

  _clampFighterToArena(fighter) {
    const { minX, maxX } = this._getFighterBounds(fighter);
    fighter.position.x = Math.min(maxX, Math.max(minX, fighter.position.x));

    if (
      (fighter.position.x === minX && fighter.velocity.x < 0) ||
      (fighter.position.x === maxX && fighter.velocity.x > 0)
    ) {
      fighter.velocity.x = 0;
    }
  }

  /**
   * Main game animation loop
   */
  _animate = () => {
    if (!this.isRunning) return;
    requestAnimationFrame(this._animate);

    // Clear canvas
    this.ctx.fillStyle = "black";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Update movement first (set velocities based on input/lastKey)
    this._updatePlayerMovement();
    this._updateEnemyMovement();

    // Draw/update sprites
    this.background.update();
    this.shop.update();

    // Update fighters (apply velocity to position once per frame)
    this.player.update();
    this.enemy.update();
    this._clampFighterToArena(this.player);
    this._clampFighterToArena(this.enemy);

    // Update ground collision detection
    this.player.flag = this.player.position.y <= 230 ? false : true;
    this.enemy.flag = this.enemy.position.y <= 230 ? false : true;

    // Check collisions and apply damage
    this._applyDamage(this.player, this.enemy);
    this._applyDamage(this.enemy, this.player);
  };

  /**
   * Start the game
   */
  start() {
    this.isRunning = true;
    this.gameOver = false;
    this._animate();
    this._startTimer();
  }

  /**
   * Stop the game
   */
  stop() {
    this.isRunning = false;
    if (this.timerId) clearTimeout(this.timerId);
  }

  /**
   * Start game timer countdown
   */
  _startTimer() {
    const tick = () => {
      this.onTimerUpdate(this.timer);

      if (this.timer > 0 && !this.gameOver) {
        this.timer--;
        this.timerId = setTimeout(tick, 1000);
      } else if (this.timer <= 0 && !this.gameOver) {
        // Time's up - determine winner by health
        this.gameOver = true;
        this.onGameOver({
          winner:
            this.player.Health > this.enemy.Health ? "player1" : "player2",
          player1Health: this.player.Health,
          player2Health: this.enemy.Health,
        });
      }
    };
    tick();
  }

  /**
   * Apply incoming action from opponent
   */
  /**
   * Apply action for a specific player (actor) based on playerKey
   * @param {string} playerKey - 'player1' or 'player2'
   * @param {string} action
   */
  applyOpponentAction(playerKey, action, data = {}) {
    const target = playerKey === "player1" ? this.player : this.enemy;
    if (!target || target.dead || this.gameOver) return;

    switch (action) {
      case "attack-basic":
        target.attack(0);
        break;
      case "attack-special":
        target.attack(1);
        break;
      case "move-left":
        target.lastKey = "ArrowLeft";
        break;
      case "move-right":
        target.lastKey = "ArrowRight";
        break;
      case "move-stop":
        target.lastKey = null;
        break;
      case "jump":
        if (target.flag) {
          target.velocity.y = -18;
        }
        break;
      case "idle":
        target.lastKey = null;
        break;
    }
  }

  /**
   * Apply damage to a fighter by player key
   */
  applyDamage(defender, damage, newHealth = null, options = {}) {
    const { suppressGameOver = false } = options;
    if (this.gameOver) return;

    const target = defender === "player2" ? this.enemy : this.player;
    if (target.dead) return;

    target.Health =
      typeof newHealth === "number"
        ? Math.max(0, newHealth)
        : Math.max(0, target.Health - damage);

    if (target.Health > 0) {
      target.switchSprites("takehit");
    } else {
      target.switchSprites("death");
      target.dead = true;
    }

    if (target.Health <= 0 && !this.gameOver && !suppressGameOver) {
      this.gameOver = true;
      this.onGameOver({
        winner: defender === "player2" ? "player1" : "player2",
        player1Health: this.player.Health,
        player2Health: this.enemy.Health,
      });
    }
  }

  /**
   * Get current game state
   */
  getState() {
    return {
      player1: {
        health: this.player.Health,
        position: { ...this.player.position },
        isDead: this.player.dead,
        animation: this.player.currentAnimation,
        direction:
          this.player.lastKey === "ArrowLeft"
            ? "left"
            : this.player.lastKey === "ArrowRight"
              ? "right"
              : null,
        velocity: { ...this.player.velocity },
        isAttacking: !!this.player.isAttacking,
      },
      player2: {
        health: this.enemy.Health,
        position: { ...this.enemy.position },
        isDead: this.enemy.dead,
        animation: this.enemy.currentAnimation,
        direction:
          this.enemy.lastKey === "ArrowLeft"
            ? "left"
            : this.enemy.lastKey === "ArrowRight"
              ? "right"
              : null,
        velocity: { ...this.enemy.velocity },
        isAttacking: !!this.enemy.isAttacking,
      },
      timeRemaining: this.timer,
      gameOver: this.gameOver,
    };
  }

  /**
   * Apply authoritative server state to local engine
   * @param {object} state - server-sent room state with player1/player2
   */
  applyServerState(state = {}) {
    if (!state) return;
    const applyToFighter = (fighter, playerKey, s) => {
      if (!s) return;
      const isLocalFighter =
        (fighter === this.player && this.localIsPlayer1) ||
        (fighter === this.enemy && !this.localIsPlayer1);

      if (s.position) {
        const { minX, maxX } = this._getFighterBounds(fighter);
        const sx = Math.min(
          maxX,
          Math.max(minX, s.position.x ?? fighter.position.x),
        );
        const sy = s.position.y ?? fighter.position.y;

        if (isLocalFighter) {
          const dx = sx - fighter.position.x;
          const dy = sy - fighter.position.y;
          if (Math.hypot(dx, dy) > 120) {
            fighter.position.x = sx;
            fighter.position.y = sy;
          } else {
            fighter.position.x += dx * 0.04;
            fighter.position.y += dy * 0.04;
          }
        } else {
          this.remoteSync[playerKey] = {
            targetPosition: { x: sx, y: sy },
            lastServerAt: performance.now(),
          };
        }
      }

      if (typeof s.health === "number") fighter.Health = s.health;
      if (s.animation) fighter.switchSprites(s.animation);
      if (!isLocalFighter && typeof s.isAttacking === "boolean")
        fighter.isAttacking = s.isAttacking;
      if (typeof s.isDead === "boolean") fighter.dead = s.isDead;
      // Only override lastKey/direction for remote fighter to avoid stomping local input
      if (!isLocalFighter) {
        if (s.direction === "left") fighter.lastKey = "ArrowLeft";
        else if (s.direction === "right") fighter.lastKey = "ArrowRight";
        else fighter.lastKey = null;
      }
    };

    applyToFighter(this.player, "player1", state.player1);
    applyToFighter(this.enemy, "player2", state.player2);

    if (state.gameOver) this.gameOver = true;
  }

  /**
   * Reset game for next round
   */
  reset() {
    this.player.Health = 100;
    this.player.dead = false;
    this.player.position = { x: 250, y: 0 };
    this.player.velocity = { x: 0, y: 10 };

    this.enemy.Health = 100;
    this.enemy.dead = false;
    this.enemy.position = { x: 650, y: 0 };
    this.enemy.velocity = { x: 0, y: 10 };

    this.timer = 300;
    this.gameOver = false;
    this.keys = {
      ArrowLeft: { pressed: false },
      ArrowRight: { pressed: false },
      ArrowUp: { pressed: false },
    };

    if (this.timerId) clearTimeout(this.timerId);
  }

  /**
   * Cleanup resources
   */
  destroy() {
    this.stop();
    document.removeEventListener("keydown", this._boundKeyDown);
    document.removeEventListener("keyup", this._boundKeyUp);
  }
}

export default GameEngine;
