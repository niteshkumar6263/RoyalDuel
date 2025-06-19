const canvas = document.querySelector("canvas");
const c = canvas.getContext("2d");
canvas.width = 1024;
canvas.height = 430;
c.fillRect(0, 0, canvas.width, canvas.height);

const gravity = 0.7;
const background = new Sprite({
  position: {
    x: 0,
    y: 0,
  },
  imageSrc: "./img/backgroundresize.png",
});
const shop = new Sprite({
  position: {
    x: 600,
    y: 50,
  },
  imageSrc: "./img/shop.png",
  scale: 2.75,
  frameMax: 6,
});
const keys = {
  a: {
    pressed: false,
  },
  d: {
    pressed: false,
  },
  w: {
    pressed: false,
  },
  ArrowRight: {
    pressed: false,
  },
  ArrowLeft: {
    pressed: false,
  },
  ArrowUp: {
    pressed: false,
  },
};

// decreaseTimer();
decreaseTimer();

animate();
// console.log(player);

/*
window.addEventListener(
  "keydown",
  (event) => {
    if (!player.dead) {
      switch (event.key) {
        // player
        case "a":
          keys.a.pressed = true;
          player.lastKey = "a";
          break;
        case "d":
          keys.d.pressed = true;
          player.lastKey = "d";
          break;
        case "w":
          if (player.flag) player.velocity.y = -18;
          lastKey = "w";
          break;
        case " ":
          player.attack(1);
          player.switchSprites("attack1");
          break;
        case "s":
          player.attack(0);
          player.switchSprites("attack2");
          break;
      }
    }
    // enemy
    if (!enemy.dead) {
      switch (event.key) {
        case "ArrowLeft":
          keys.ArrowLeft.pressed = true;
          enemy.lastKey = "ArrowLeft";
          break;
        case "ArrowRight":
          keys.ArrowRight.pressed = true;
          enemy.lastKey = "ArrowRight";
          break;
        case "ArrowUp":
          if (enemy.flag) enemy.velocity.y = -18;
          enemy.lastKey = "ArrowUp";
          break;
        case "ArrowDown":
          enemy.attack(1);
          break;
        case "0":
          enemy.attack(0);
          break;
      }
    }
  }
  // console.log(event.key);
);

window.addEventListener("keyup", (event) => {
  switch (event.key) {
    // player
    case "a":
      keys.a.pressed = false;
      break;
    case "d":
      keys.d.pressed = false;
      break;
    case "w":
      keys.w.pressed = false;
      break;

    //enemy
    case "ArrowLeft":
      keys.ArrowLeft.pressed = false;
      break;
    case "ArrowRight":
      keys.ArrowRight.pressed = false;
      break;
    case "ArrowUp":
      keys.ArrowUp.pressed = false;
      break;
  }
  // console.log(event);
});
*/
function handlekeydown(key, role) {
  if (role === "player" && !player.dead) {
    console.log(key);
    switch (key) {
      case "ArrowLeft":
        keys.ArrowLeft.pressed = true;
        player.lastKey = "ArrowLeft";
        break;
      case "ArrowRight":
        keys.ArrowRight.pressed = true;
        player.lastKey = "ArrowRight";
        break;
      case "ArrowUp":
        if (player.flag) player.velocity.y = -18;
        player.lastKey = "ArrowUp";
        break;
      case "ArrowDown":
        player.attack(1);
        break;
      case " ":
        player.attack(0);
        break;
    }
  } else if (role === "enemy" && !enemy.dead) {
    console.log(key);
    switch (key) {
      case "ArrowLeft":
        keys.ArrowLeft.pressed = true;
        enemy.lastKey = "ArrowLeft";
        break;
      case "ArrowRight":
        keys.ArrowRight.pressed = true;
        enemy.lastKey = "ArrowRight";
        break;
      case "ArrowUp":
        if (enemy.flag) enemy.velocity.y = -18;
        enemy.lastKey = "ArrowUp";
        break;
      case "ArrowDown":
        enemy.attack(1);
        break;
      case " ":
        enemy.attack(0);
        break;
    }
  }
}
function handlekeyup(key, role) {
  console.log(key);
  switch (key) {
    case "ArrowLeft":
      keys.ArrowLeft.pressed = false;
      break;
    case "ArrowRight":
      keys.ArrowRight.pressed = false;
      break;
    case "ArrowUp":
      keys.ArrowUp.pressed = false;
      break;
  }
}
