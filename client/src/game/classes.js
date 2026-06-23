class Sprite {
  constructor({
    position,
    imageSrc,
    scale = 1,
    frameMax = 1,
    offset = { x: 0, y: 0 },
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
    this.frameHold = 10;
    this.offset = offset;
  }
  draw() {
    c.drawImage(
      this.image,
      this.frameCurrent * (this.image.width / this.frameMax),
      0,
      this.image.width / this.frameMax,
      this.image.height,
      this.position.x - this.offset.x,
      this.position.y - this.offset.y,
      (this.image.width / this.frameMax) * this.scale,
      this.image.height * this.scale
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
  }) {
    super({
      position,
      imageSrc,
      scale,
      frameMax,
      offset,
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
    this.isAttacking;
    this.Health = 100;
    this.frameCurrent = 0;
    this.frameElapsed = 0;
    this.frameHold = 10;
    this.dead = false;
    // this.namebox = {
    //   position: {
    //     x: this.position.attackbox - 200,
    //     y: this.position,
    //   },
    //   width: 100,
    //   height: 50,
    // };
    this.sprites = sprites;
    for (const sprite in this.sprites) {
      sprites[sprite].image = new Image();
      sprites[sprite].image.src = sprites[sprite].imageSrc;
    }
  }
  update() {
    this.draw();
    if (!this.dead) this.animateFrames();

    // attack boxes
    this.attackbox.position.x = this.position.x + this.attackbox.offset.x;
    this.attackbox.position.y = this.position.y + this.attackbox.offset.y;

    // draw
    // c.fillRect(
    //   this.attackbox.position.x,
    //   this.attackbox.position.y,
    //   this.attackbox.width,
    //   this.attackbox.height
    // );

    // this.position.y += gravity;
    this.position.x += this.velocity.x;
    this.position.y += this.velocity.y;
    if (this.position.y + this.height + this.velocity.y >= canvas.height - 30) {
      this.velocity.y = 0;
      this.position.y = 250;
    } else this.velocity.y += gravity;
    // console.log(this.position);
  }
  attack(num) {
    this.isAttacking = true;
    if (num === 1) this.switchSprites("attack1");
    else this.switchSprites("attack2");
    setTimeout(() => {
      this.isAttacking = false;
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
        }
        break;
      case "death":
        if (this.image !== this.sprites.death.image) {
          this.image = this.sprites.death.image;
          this.frameMax = this.sprites.death.frameMax;
          this.frameCurrent = 0;
        }
        break;
      case "idle":
        if (this.image !== this.sprites.idle.image) {
          this.image = this.sprites.idle.image;
          this.frameMax = this.sprites.idle.frameMax;
          this.frameCurrent = 0;
        }
        break;
      case "fall":
        if (this.image !== this.sprites.fall.image) {
          this.image = this.sprites.fall.image;
          this.frameMax = this.sprites.fall.frameMax;
          this.frameCurrent = 0;
        }
        break;
      case "jump":
        if (this.image !== this.sprites.jump.image) {
          this.image = this.sprites.jump.image;
          this.frameMax = this.sprites.jump.frameMax;
          this.frameCurrent = 0;
        }
        break;
      case "run":
        if (this.image !== this.sprites.run.image) {
          this.image = this.sprites.run.image;
          this.frameMax = this.sprites.run.frameMax;
          this.frameCurrent = 0;
        }
        break;
      case "attack1":
        if (this.image !== this.sprites.attack1.image) {
          this.image = this.sprites.attack1.image;
          this.frameMax = this.sprites.attack1.frameMax;
          this.frameCurrent = 0;
        }
        break;
      case "takehit":
        if (this.image !== this.sprites.takehit.image) {
          this.image = this.sprites.takehit.image;
          this.frameMax = this.sprites.takehit.frameMax;
          this.frameCurrent = 0;
        }
        break;
    }
  }
}
