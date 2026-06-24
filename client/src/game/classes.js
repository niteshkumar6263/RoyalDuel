class Sprite {
  constructor({
    position,
    imageSrc,
    scale = 1,
    frameMax = 1,
    offset = { x: 0, y: 0 },
    ctx = null,
  }) {
    this.position = position;
    this.image = new Image();
    this.image.src = imageSrc;
    this.width = 50;
    this.height = 150;
    this.scale = scale;
    this.frameMax = frameMax;
    this.frameCurrent = 0;
    this.frameElapsed = 0;
    this.frameHold = 14;
    this.offset = offset;
    this.ctx = ctx; // Canvas context - will be set by GameEngine
  }

  setContext(ctx) {
    this.ctx = ctx;
  }

  draw() {
    if (!this.ctx || !this.image.complete || this.image.naturalWidth === 0)
      return;

    const frameWidth = this.image.width / this.frameMax;
    const frameHeight = this.image.height;

    if (frameWidth <= 0 || frameHeight <= 0) return;

    this.ctx.drawImage(
      this.image,
      this.frameCurrent * frameWidth,
      0,
      frameWidth,
      frameHeight,
      this.position.x - this.offset.x,
      this.position.y - this.offset.y,
      frameWidth * this.scale,
      frameHeight * this.scale,
    );
  }
  animateFrames() {
    this.frameElapsed++;
    if (this.frameElapsed % this.frameHold === 0) {
      if (this.frameCurrent < this.frameMax - 1) {
        this.frameCurrent++;
      } else this.frameCurrent = 0;
    }
  }
  update() {
    this.draw();
    this.animateFrames();
  }
}
class Fighter extends Sprite {
  constructor({
    position,
    velocity,
    color,
    imageSrc,
    scale = 1,
    frameMax = 1,
    offset = { x: 0, y: 0 },
    sprites,
    attackbox = { offset: {}, width: undefined, height: undefined },
    ctx = null,
    gravity = 0.7,
  }) {
    super({
      position,
      imageSrc,
      scale,
      frameMax,
      offset,
      ctx,
    });
    this.velocity = velocity;
    this.width = 50;
    this.height = 150;
    this.lastKey;
    this.flag = true;
    this.attackbox = {
      position: {
        x: this.position.x,
        y: this.position.y,
      },
      offset: attackbox.offset,
      width: attackbox.width,
      height: attackbox.height,
    };
    this.color = color;
    this.check = [true, true];
    this.isAttacking = false;
    this.attackHitRegistered = false;
    this.attackTimeoutId = null;
    this.Health = 100;
    this.gravity = gravity;
    this.frameCurrent = 0;
    this.frameElapsed = 0;
    this.frameHold = 14;
    this.dead = false;
    this.currentAnimation = "idle";
    this.sprites = sprites;
    for (const sprite in this.sprites) {
      sprites[sprite].image = new Image();
      sprites[sprite].image.src = sprites[sprite].imageSrc;
      sprites[sprite].ctx = ctx; // Set context for each sprite animation
    }
  }
  update() {
    this.draw();

    if (!this.dead) {
      if (
        (this.currentAnimation === "attack1" ||
          this.currentAnimation === "attack2") &&
        this.frameCurrent >= this.frameMax - 1
      ) {
        this.isAttacking = false;
        this.attackHitRegistered = true;
        this.switchSprites("idle");
      }

      if (
        this.currentAnimation === "takehit" &&
        this.frameCurrent >= this.frameMax - 1
      ) {
        this.switchSprites("idle");
      }

      this.animateFrames();
    }

    // attack boxes
    this.attackbox.position.x = this.position.x + this.attackbox.offset.x;
    this.attackbox.position.y = this.position.y + this.attackbox.offset.y;

    this.position.x += this.velocity.x;
    this.position.y += this.velocity.y;

    const groundHeight = this.ctx?.canvas?.height ?? 0;
    if (this.position.y + this.height + this.velocity.y >= groundHeight - 30) {
      this.velocity.y = 0;
      this.position.y = 250;
    } else {
      this.velocity.y += this.gravity;
    }
  }
  attack(num) {
    if (this.dead || this.isAttacking) return;
    this.isAttacking = true;
    this.attackHitRegistered = false;
    if (num === 1) this.switchSprites("attack1");
    else this.switchSprites("attack2");
    if (this.attackTimeoutId) {
      clearTimeout(this.attackTimeoutId);
    }
    this.attackTimeoutId = setTimeout(() => {
      this.isAttacking = false;
      this.attackHitRegistered = true;
      this.attackTimeoutId = null;
    }, 1000);
  }
  takehit() {
    this.Health -= 3;
    if (this.Health < 0) {
      this.switchSprites("death");
    } else {
      this.switchSprites("takehit");
    }
  }
  switchSprites(sprite) {
    if (
      this.image === this.sprites.attack1.image &&
      this.frameCurrent < this.sprites.attack1.frameMax - 1
    )
      return;
    if (
      this.image === this.sprites.attack2.image &&
      this.frameCurrent < this.sprites.attack2.frameMax - 1
    )
      return;
    if (
      this.image === this.sprites.takehit.image &&
      this.frameCurrent < this.sprites.takehit.frameMax - 1
    )
      return;
    if (this.image === this.sprites.death.image) {
      if (this.frameCurrent >= this.sprites.death.frameMax - 1)
        this.dead = true;
      return;
    }
    switch (sprite) {
      case "attack2":
        if (this.image !== this.sprites.attack2.image) {
          this.image = this.sprites.attack2.image;
          this.frameMax = this.sprites.attack2.frameMax;
          this.frameCurrent = 0;
          this.currentAnimation = "attack2";
        }
        break;
      case "death":
        if (this.image !== this.sprites.death.image) {
          this.image = this.sprites.death.image;
          this.frameMax = this.sprites.death.frameMax;
          this.frameCurrent = 0;
          this.currentAnimation = "death";
        }
        break;
      case "idle":
        if (this.image !== this.sprites.idle.image) {
          this.image = this.sprites.idle.image;
          this.frameMax = this.sprites.idle.frameMax;
          this.frameCurrent = 0;
          this.currentAnimation = "idle";
        }
        break;
      case "fall":
        if (this.image !== this.sprites.fall.image) {
          this.image = this.sprites.fall.image;
          this.frameMax = this.sprites.fall.frameMax;
          this.frameCurrent = 0;
          this.currentAnimation = "fall";
        }
        break;
      case "jump":
        if (this.image !== this.sprites.jump.image) {
          this.image = this.sprites.jump.image;
          this.frameMax = this.sprites.jump.frameMax;
          this.frameCurrent = 0;
          this.currentAnimation = "jump";
        }
        break;
      case "run":
        if (this.image !== this.sprites.run.image) {
          this.image = this.sprites.run.image;
          this.frameMax = this.sprites.run.frameMax;
          this.frameCurrent = 0;
          this.currentAnimation = "run";
        }
        break;
      case "attack1":
        if (this.image !== this.sprites.attack1.image) {
          this.image = this.sprites.attack1.image;
          this.frameMax = this.sprites.attack1.frameMax;
          this.frameCurrent = 0;
          this.currentAnimation = "attack1";
        }
        break;
      case "takehit":
        if (this.image !== this.sprites.takehit.image) {
          this.image = this.sprites.takehit.image;
          this.frameMax = this.sprites.takehit.frameMax;
          this.frameCurrent = 0;
          this.currentAnimation = "takehit";
        }
        break;
    }
  }
}

export { Sprite, Fighter };
