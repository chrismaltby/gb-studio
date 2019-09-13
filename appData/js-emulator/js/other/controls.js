const JS_KEY_ALT = 18;
const JS_KEY_CTRL = 17;

const DEADZONE = 0.1;

var defaultKeys = {
  up: ["ArrowUp", "w"],
  down: ["ArrowDown", "s"],
  left: ["ArrowLeft", "a"],
  right: ["ArrowRight", "d"],
  a: ["Alt", "z", "j"],
  b: ["Control", "k", "x"],
  start: ["Enter"],
  select: ["Shift"]
};

// Build keybindings object using
// value from customControls if defined or defaultKeys if not
var keyBindings = {};
for (var key in defaultKeys) {
  var keys = customControls[key] ? customControls[key] : defaultKeys[key];
  for (var i = 0; i < keys.length; i++) {
    keyBindings[keys[i]] = key;
  }
}

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
      (e.altKey || e.ctrlKey || e.metaKey)
    ) {
      return;
    }
    if (keyBindings[e.key]) {
      GameBoyKeyDown(keyBindings[e.key]);
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
    if (keyBindings[e.key]) {
      GameBoyKeyUp(keyBindings[e.key]);
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
