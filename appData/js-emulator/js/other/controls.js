const JS_KEY_UP = 38;
const JS_KEY_LEFT = 37;
const JS_KEY_RIGHT = 39;
const JS_KEY_DOWN = 40;
const JS_KEY_ENTER = 13;
const JS_KEY_ALT = 18;
const JS_KEY_CTRL = 17;
const JS_KEY_SHIFT = 16;

const JS_KEY_W = 87;
const JS_KEY_A = 65;
const JS_KEY_S = 83;
const JS_KEY_D = 68;
const JS_KEY_J = 74;
const JS_KEY_K = 75;

const JS_KEY_Z = 90;
const JS_KEY_X = 88;

const DEADZONE = 0.1;

var isTouchEnabled = "ontouchstart" in document.documentElement;

var controller = document.getElementById("controller");
var btnA = document.getElementById("controller_a");
var btnB = document.getElementById("controller_b");
var btnStart = document.getElementById("controller_start");
var btnSelect = document.getElementById("controller_select");
var dpad = document.getElementById("controller_dpad");

function bindButton(el, code) {
  el.addEventListener("touchstart", function(e) {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.className = e.currentTarget.className + " btnPressed";
    GameBoyKeyDown(code);
  });

  el.addEventListener("touchend", function(e) {
    e.preventDefault();
    e.stopPropagation();
    initSound();
    e.currentTarget.className = e.currentTarget.className.replace(
      / btnPressed/,
      ""
    );
    GameBoyKeyUp(code);
  });
}

function bindDpad(el) {
  el.addEventListener("touchstart", function(e) {
    e.preventDefault();
    e.stopPropagation();
    var rect = e.currentTarget.getBoundingClientRect();
    var x = (2 * (e.targetTouches[0].clientX - rect.left)) / rect.width - 1;
    var y = (2 * (e.targetTouches[0].clientY - rect.top)) / rect.height - 1;
    move(x, y);
  });

  el.addEventListener("touchmove", function(e) {
    e.preventDefault();
    e.stopPropagation();
    var rect = e.currentTarget.getBoundingClientRect();
    var x = (2 * (e.targetTouches[0].clientX - rect.left)) / rect.width - 1;
    var y = (2 * (e.targetTouches[0].clientY - rect.top)) / rect.height - 1;
    move(x, y);
  });

  function move(x, y) {
    if (x < -DEADZONE || x > DEADZONE) {
      if (y > x && y < -x) {
        GameBoyKeyUp("right");
        GameBoyKeyDown("left");
      } else if (y > -x && y < x) {
        GameBoyKeyUp("left");
        GameBoyKeyDown("right");
      }

      if (y > -DEADZONE && y < DEADZONE) {
        GameBoyKeyUp("up");
        GameBoyKeyUp("down");
      }
    }

    if (y < -DEADZONE || y > DEADZONE) {
      if (x > y && x < -y) {
        GameBoyKeyUp("down");
        GameBoyKeyDown("up");
      } else if (x > -y && x < y) {
        GameBoyKeyUp("up");
        GameBoyKeyDown("down");
      }

      if (x > -DEADZONE && x < DEADZONE) {
        GameBoyKeyUp("left");
        GameBoyKeyUp("right");
      }
    }
  }

  el.addEventListener("touchend", function(e) {
    e.preventDefault();
    e.stopPropagation();
    initSound();
    GameBoyKeyUp("left");
    GameBoyKeyUp("right");
    GameBoyKeyUp("up");
    GameBoyKeyUp("down");
  });
}

function bindKeyboard() {
  window.onkeydown = function(e) {
    initSound();
    if (isTouchEnabled) {
      controller.style.display = "none";
      isTouchEnabled = false;
    }
    if (
      e.keyCode !== JS_KEY_CTRL &&
      e.keyCode !== JS_KEY_ALT &&
      (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey)
    ) {
      return;
    }
    if (e.keyCode === JS_KEY_LEFT || e.keyCode === JS_KEY_A) {
      GameBoyKeyDown("left");
    } else if (e.keyCode === JS_KEY_RIGHT || e.keyCode === JS_KEY_D) {
      GameBoyKeyDown("right");
    } else if (e.keyCode === JS_KEY_UP || e.keyCode === JS_KEY_W) {
      GameBoyKeyDown("up");
    } else if (e.keyCode === JS_KEY_DOWN || e.keyCode === JS_KEY_S) {
      GameBoyKeyDown("down");
    } else if (e.keyCode === JS_KEY_ENTER) {
      GameBoyKeyDown("start");
    } else if (
      e.keyCode === JS_KEY_ALT ||
      e.keyCode === JS_KEY_Z ||
      e.keyCode === JS_KEY_J
    ) {
      GameBoyKeyDown("a");
    } else if (
      e.keyCode === JS_KEY_CTRL ||
      e.keyCode === JS_KEY_K ||
      e.keyCode === JS_KEY_X
    ) {
      GameBoyKeyDown("b");
    } else if (e.keyCode === JS_KEY_SHIFT) {
      GameBoyKeyDown("select");
    }
    e.preventDefault();
  };

  window.onkeyup = function(e) {
    if (e.key === "Dead") {
      // Ipad keyboard fix :-/
      // Doesn't register which key was released, so release all of them
      ["right", "left", "up", "down", "a", "b", "select", "start"].forEach(
        key => {
          GameBoyKeyUp(key);
        }
      );
    }
    if (e.keyCode === JS_KEY_LEFT || e.keyCode === JS_KEY_A) {
      GameBoyKeyUp("left");
    } else if (e.keyCode === JS_KEY_RIGHT || e.keyCode === JS_KEY_D) {
      GameBoyKeyUp("right");
    } else if (e.keyCode === JS_KEY_UP || e.keyCode === JS_KEY_W) {
      GameBoyKeyUp("up");
    } else if (e.keyCode === JS_KEY_DOWN || e.keyCode === JS_KEY_S) {
      GameBoyKeyUp("down");
    } else if (e.keyCode === JS_KEY_ENTER) {
      GameBoyKeyUp("start");
    } else if (
      e.keyCode === JS_KEY_ALT ||
      e.keyCode === JS_KEY_Z ||
      e.keyCode === JS_KEY_J
    ) {
      GameBoyKeyUp("a");
    } else if (
      e.keyCode === JS_KEY_CTRL ||
      e.keyCode === JS_KEY_K ||
      e.keyCode === JS_KEY_X
    ) {
      GameBoyKeyUp("b");
    } else if (e.keyCode === JS_KEY_SHIFT) {
      GameBoyKeyUp("select");
    }
    e.preventDefault();
  };
}

if (isTouchEnabled) {
  bindButton(btnA, "a");
  bindButton(btnB, "b");
  bindButton(btnStart, "start");
  bindButton(btnSelect, "select");
  bindDpad(dpad);
} else {
  controller.style.display = "none";
}
bindKeyboard();
