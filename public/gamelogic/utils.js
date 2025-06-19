function RectangleCollision({ rectangle1, rectangle2 }) {
  return (
    rectangle1.attackbox.position.x + rectangle1.attackbox.width >=
      rectangle2.position.x &&
    rectangle1.attackbox.position.x <=
      rectangle2.position.x + rectangle2.width &&
    rectangle1.attackbox.position.y + rectangle1.attackbox.height >=
      rectangle2.position.y &&
    rectangle1.attackbox.position.y <= rectangle2.position.y + rectangle2.height
  );
}

function DetermineWiner({ player, enemy, timerId }) {
  clearTimeout(timerId);
  document.querySelector("#displayText").style.display = "flex";
  if (player.Health === enemy.Health) {
    document.querySelector("#displayText").innerHTML = "TIE";
  } else if (player.Health > enemy.Health) {
    document.querySelector("#displayText").innerHTML =
      "🎉🏆PLAYER 1 WINNER🏆🎉";
  } else {
    document.querySelector("#displayText").innerHTML =
      "🎉🏆PLAYER 2 WINNER🏆🎉";
  }
}
function animate() {
  window.requestAnimationFrame(animate);
  c.fillStyle = "black";
  c.fillRect(0, 0, canvas.width, canvas.height);
  background.update();
  shop.update();
  player.update();
  enemy.update();
  // wizard.update();

  player.flag = player.position.y <= 230 ? false : true;
  enemy.flag = enemy.position.y <= 230 ? false : true;

  {
    // player movement
    player.velocity.x = 0;
    if (
      keys.ArrowLeft.pressed &&
      player.lastKey === "ArrowLeft" &&
      player.position.x >= 10
    ) {
      player.velocity.x = -10;
      player.switchSprites("run");
    } else if (
      keys.ArrowRight.pressed &&
      player.lastKey === "ArrowRight" &&
      player.position.x <= canvas.width - 120
    ) {
      player.velocity.x = 10;
      player.switchSprites("run");
    } else {
      player.switchSprites("idle");
    }
    // player Jumping
    if (player.velocity.y < 0) {
      player.switchSprites("jump");
    } else if (player.velocity.y > 0) {
      player.switchSprites("fall");
    }
  }
  {
    // enemy movement
    enemy.velocity.x = 0;
    if (
      keys.ArrowLeft.pressed &&
      enemy.lastKey === "ArrowLeft" &&
      enemy.position.x >= 0
    ) {
      enemy.velocity.x = -10;
      enemy.switchSprites("run");
    } else if (
      keys.ArrowRight.pressed &&
      enemy.lastKey === "ArrowRight" &&
      enemy.position.x <= canvas.width - 120
    ) {
      enemy.velocity.x = 10;
      enemy.switchSprites("run");
    } else {
      enemy.switchSprites("idle");
    }
    // enemy jumping
    if (enemy.velocity.y < 0) {
      enemy.switchSprites("jump");
    } else if (enemy.velocity.y > 0) {
      enemy.switchSprites("fall");
    }
  }
  // detech collision

  // player attack
  // console.log(RectangleCollision({ rectangle1: player, rectangle2: enemy }));
  if (
    RectangleCollision({ rectangle1: player, rectangle2: enemy }) &&
    player.isAttacking &&
    player.frameCurrent === 2
  ) {
    player.isAttacking = false;
    enemy.takehit();
    // document.querySelector("#enemyHealth").style.width = enemy.Health + "%";
    gsap.to("#enemyHealth", {
      width: enemy.Health + "%",
    });
    console.log("GO");
  }
  // if player misses
  if (player.isAttacking && player.frameCurrent === 3)
    player.isAttacking = false;

  // enemy attack
  if (
    RectangleCollision({ rectangle1: enemy, rectangle2: player }) &&
    enemy.isAttacking &&
    enemy.frameCurrent === 2
  ) {
    enemy.isAttacking = false;
    player.takehit();
    // document.querySelector("#playerHealth").style.width = player.Health + "%";
    gsap.to("#playerHealth", {
      width: player.Health + "%",
    });
    console.log("GONE");
  }
  // if enemy misses
  if (enemy.isAttacking && enemy.frameCurrent === 2) enemy.isAttacking = false;

  if (player.Health <= 0 || enemy.Health <= 0) {
    DetermineWiner({ player, enemy, timerId });
  }
}

let timer = 180;
let timerId;
function decreaseTimer() {
  if (timer > 0) {
    timerId = setTimeout(decreaseTimer, 1000);
    const minutes = Math.floor(timer / 60);
    const seconds = timer % 60;
    const display = `${String(minutes).padStart(2, "0")}:${String(
      seconds
    ).padStart(2, "0")}`;
    timer--;
    document.querySelector("#timer").innerHTML = display;
  }
  if (timer == 0) {
    DetermineWiner({ player, enemy });
  }
}
const player = new Fighter({
  position: {
    x: 250,
    y: 0,
  },
  velocity: {
    x: 0,
    y: 10,
  },
  offset: {
    x: 0,
    y: 0,
  },
  scale: 3,
  offset: {
    x: 215,
    y: 162,
  },
  imageSrc: "./img/king/idle.png",
  frameMax: 8,
  sprites: {
    attack1: {
      imageSrc: "./img/king/Attack1.png",
      frameMax: 4,
    },
    attack2: {
      imageSrc: "./img/king/Attack2.png",
      frameMax: 4,
    },
    death: {
      imageSrc: "./img/king/Death.png",
      frameMax: 6,
    },
    fall: {
      imageSrc: "./img/king/Fall.png",
      frameMax: 2,
    },
    idle: {
      imageSrc: "./img/king/Idle.png",
      frameMax: 8,
    },
    jump: {
      imageSrc: "./img/king/Jump.png",
      frameMax: 2,
    },
    run: {
      imageSrc: "./img/king/Run.png",
      frameMax: 8,
      image: new Image(),
    },
    takehit: {
      imageSrc: "./img/king/TakeHit.png",
      frameMax: 4,
    },
  },
  attackbox: {
    offset: {
      x: 60,
      y: 50,
    },
    width: 150,
    height: 50,
  },
});
const enemy = new Fighter({
  position: {
    x: 650,
    y: 0,
  },
  velocity: {
    x: 0,
    y: 10,
  },
  offset: {
    x: -50,
    y: 0,
  },
  imageSrc: "./img/kenji/idle.png",
  frameMax: 4,
  scale: 3,
  offset: {
    x: 215,
    y: 231,
  },
  sprites: {
    attack1: {
      imageSrc: "./img/kenji/Attack1.png",
      frameMax: 4,
    },
    attack2: {
      imageSrc: "./img/kenji/Attack2.png",
      frameMax: 4,
    },
    death: {
      imageSrc: "./img/kenji/Death.png",
      frameMax: 7,
    },
    fall: {
      imageSrc: "./img/kenji/Fall.png",
      frameMax: 2,
    },
    idle: {
      imageSrc: "./img/kenji/Idle.png",
      frameMax: 4,
    },
    jump: {
      imageSrc: "./img/kenji/Jump.png",
      frameMax: 2,
    },
    run: {
      imageSrc: "./img/kenji/Run.png",
      frameMax: 8,
      image: new Image(),
    },
    takehit: {
      imageSrc: "./img/kenji/TakeHit.png",
      frameMax: 3,
    },
  },
  attackbox: {
    offset: {
      x: -120,
      y: 50,
    },
    width: 150,
    height: 50,
  },
});
