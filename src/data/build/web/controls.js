const J_LEFT = 0x02;
const J_RIGHT = 0x01;
const J_UP = 0x04;
const J_DOWN = 0x08;
const J_START = 0x80;
const J_SELECT = 0x40;
const J_A = 0x10;
const J_B = 0x20;

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

var joy = 0;

var btnA = document.getElementById("controller_a");
var btnStart = document.getElementById("controller_start");
var dpad = document.getElementById("controller_dpad");

function bindButton(el, code) {
  el.addEventListener("touchstart", function(e) {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.className = "btn_pressed";
    joy = joy |= code;
    g.set_joypad(joy);
  });

  el.addEventListener("touchend", function(e) {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.className = "";
    joy &= ~code;
    g.set_joypad(joy);
  });
}

function bindDpad(el) {
  el.addEventListener("touchstart", function(e) {
    e.preventDefault();
    e.stopPropagation();
    var rect = e.currentTarget.getBoundingClientRect();
    var x = e.touches[0].clientX - rect.left;
    var y = e.touches[0].clientY - rect.top;
    move(x, y);
  });

  el.addEventListener("touchmove", function(e) {
    e.preventDefault();
    e.stopPropagation();
    var rect = e.currentTarget.getBoundingClientRect();
    var x = e.touches[0].clientX - rect.left;
    var y = e.touches[0].clientY - rect.top;
    move(x, y);
  });

  function move(x, y) {
    if (y > 80 && y < 120) {
      if (x < 80) {
        joy &= ~J_UP;
        joy &= ~J_DOWN;
        joy &= ~J_RIGHT;
        joy = joy |= J_LEFT;
      } else if (x > 120) {
        joy &= ~J_UP;
        joy &= ~J_DOWN;
        joy &= ~J_LEFT;
        joy = joy |= J_RIGHT;
      }
    }

    if (x > 80 && x < 120) {
      if (y < 80) {
        joy &= ~J_DOWN;
        joy &= ~J_LEFT;
        joy &= ~J_RIGHT;
        joy = joy |= J_UP;
      } else if (y > 120) {
        joy &= ~J_UP;
        joy &= ~J_LEFT;
        joy &= ~J_RIGHT;
        joy = joy |= J_DOWN;
      }
    }
    g.set_joypad(joy);
  }

  el.addEventListener("touchend", function(e) {
    e.preventDefault();
    e.stopPropagation();
    joy &= ~J_UP;
    joy &= ~J_DOWN;
    joy &= ~J_LEFT;
    joy &= ~J_RIGHT;
    g.set_joypad(joy);
  });
}

function bindKeyboard() {
  window.onkeydown = function(e) {
    if (e.keyCode === JS_KEY_LEFT || e.keyCode === JS_KEY_A) {
      joy |= J_LEFT;
    } else if (e.keyCode === JS_KEY_RIGHT || e.keyCode === JS_KEY_D) {
      joy |= J_RIGHT;
    } else if (e.keyCode === JS_KEY_UP || e.keyCode === JS_KEY_W) {
      joy |= J_UP;
    } else if (e.keyCode === JS_KEY_DOWN || e.keyCode === JS_KEY_S) {
      joy |= J_DOWN;
    } else if (
      e.keyCode === JS_KEY_ENTER ||
      e.keyCode === JS_KEY_K ||
      e.keyCode === JS_KEY_X
    ) {
      joy |= J_START;
    } else if (
      e.keyCode === JS_KEY_ALT ||
      e.keyCode === JS_KEY_Z ||
      e.keyCode === JS_KEY_J
    ) {
      joy |= J_A;
    } else if (e.keyCode === JS_KEY_CTRL) {
      joy |= J_B;
    } else if (e.keyCode === JS_KEY_SHIFT) {
      joy |= J_SELECT;
    }
    g.set_joypad(joy);
    e.preventDefault();
  };

  window.onkeyup = function(e) {
    if (e.keyCode === JS_KEY_LEFT || e.keyCode === JS_KEY_A) {
      joy &= ~J_LEFT;
    } else if (e.keyCode === JS_KEY_RIGHT || e.keyCode === JS_KEY_D) {
      joy &= ~J_RIGHT;
    } else if (e.keyCode === JS_KEY_UP || e.keyCode === JS_KEY_W) {
      joy &= ~J_UP;
    } else if (e.keyCode === JS_KEY_DOWN || e.keyCode === JS_KEY_S) {
      joy &= ~J_DOWN;
    } else if (
      e.keyCode === JS_KEY_ENTER ||
      e.keyCode === JS_KEY_K ||
      e.keyCode === JS_KEY_X
    ) {
      joy &= ~J_START;
    } else if (
      e.keyCode === JS_KEY_ALT ||
      e.keyCode === JS_KEY_Z ||
      e.keyCode === JS_KEY_J
    ) {
      joy &= ~J_A;
    } else if (e.keyCode === JS_KEY_CTRL) {
      joy &= ~J_B;
    } else if (e.keyCode === JS_KEY_SHIFT) {
      joy &= ~J_SELECT;
    }
    g.set_joypad(joy);
    e.preventDefault();
  };
}

bindButton(btnA, J_A);
bindButton(btnStart, J_START);
bindDpad(dpad);
bindKeyboard();
