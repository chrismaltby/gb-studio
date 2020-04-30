const JS_KEY_ALT = 18;
const JS_KEY_CTRL = 17;

const DEADZONE = 0.1;

var defaultKeys = {
  up: ["ArrowUp", "w", "W"],
  down: ["ArrowDown", "s", "S"],
  left: ["ArrowLeft", "a", "A"],
  right: ["ArrowRight", "d", "D"],
  a: ["Alt", "z", "j", "Z", "J"],
  b: ["Control", "k", "x", "K", "X"],
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
    keyBindings[String(keys[i]).toLowerCase()] = key;
    keyBindings[String(keys[i]).toUpperCase()] = key;
  }
}

var isTouchEnabled = "ontouchstart" in document.documentElement;

var controller = document.getElementById("controller");
var btnA = document.getElementById("controller_a");
var btnB = document.getElementById("controller_b");
var btnStart = document.getElementById("controller_start");
var btnSelect = document.getElementById("controller_select");
var dpad = document.getElementById("controller_dpad");


// HTML Gamepad API support
// Poll for gamepad input about ~4 times per gameboy frame (~240 times second)
const GAMEPAD_POLLING_INTERVAL = 1000 / 60 / 4;
const GAMEPAD_KEYMAP_STANDARD_STR = "standard"

// When gamepad.mapping reports "standard"
const GAMEPAD_KEYMAP_STANDARD = [
            {gb_key: "b",      gp_button: 0,  type: "button"},
            {gb_key: "a",      gp_button: 1,  type: "button"},
            {gb_key: "select", gp_button: 8,  type: "button"},
            {gb_key: "start",  gp_button: 9,  type: "button"},
            {gb_key: "up",     gp_button: 12, type: "button"},
            {gb_key: "down",   gp_button: 13, type: "button"},
            {gb_key: "left",   gp_button: 14, type: "button"},
            {gb_key: "right",  gp_button: 15, type: "button"}
            ];

const GAMEPAD_KEYMAP_DEFAULT = [
            {gb_key: "a",      gp_button: 0, type: "button"},
            {gb_key: "b",      gp_button: 1, type: "button"},
            {gb_key: "select", gp_button: 2, type: "button"},
            {gb_key: "start",  gp_button: 3, type: "button"},
            {gb_key: "up",     gp_button: 2, type: "axis"},
            {gb_key: "down",   gp_button: 3, type: "axis"},
            {gb_key: "left",   gp_button: 0, type: "axis"},
            {gb_key: "right",  gp_button: 1, type: "axis"}
            ];

// gamepad related vars
var gp = {
        apiID: undefined,
        timerID: undefined,
        keybinds: undefined,
        axes: {
            last: undefined,
            cur: [],
            changed: [] },
        buttons: {
            last: undefined,
            cur: [],
            changed: [] }
        };


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

function bindTouchRestore() {
  window.addEventListener("touchstart", function(e) {
    controller.style.display = "block";
    isTouchEnabled = true;
  })
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

function bindClick() {
  window.addEventListener("click", function(e) {
    initSound();
  })
}

if (isTouchEnabled) {
  controller.style.display = "block";
  bindButton(btnA, "a");
  bindButton(btnB, "b");
  bindButton(btnStart, "start");
  bindButton(btnSelect, "select");
  bindDpad(dpad);
  bindTouchRestore();
} else {
  controller.style.display = "none";
}
bindKeyboard();
bindClick();

function resetKeys() {
  for (var key in defaultKeys) {
    GameBoyKeyUp(key);
  }
}

window.addEventListener("focus", resetKeys);
window.addEventListener("blur", resetKeys);

// HTML Gamepad API Support

// Load a key map for gamepad-to-gameboy buttons
function gamepadBindKeys(strMapping) {

    // Try to use the w3c "standard" gamepad mapping if available
    // (Chrome/V8 seems to do that better than Firefox)
    //
    // Otherwise use a default mapping that assigns
    // A/B/Select/Start to the first four buttons,
    // and U/D/L/R to the first two axes.

    if (strMapping === GAMEPAD_KEYMAP_STANDARD_STR)
        gp.keybinds = GAMEPAD_KEYMAP_STANDARD;
    else
        gp.keybinds = GAMEPAD_KEYMAP_DEFAULT;
}


function gamepadCacheValues(gamepad) {

    // Read Buttons
    for(let k=0; k<gamepad.buttons.length; k++) {
        // .value is for analog, .pressed is for boolean buttons
        gp.buttons.cur[k] = (gamepad.buttons[k].value > 0 ||
                             gamepad.buttons[k].pressed == true);

        // Update state changed if not on first input pass
        if (gp.buttons.last !== undefined)
            gp.buttons.changed[k] = (gp.buttons.cur[k] != gp.buttons.last[k]);
    }

    // Read Axes
    for(let k=0; k<gamepad.axes.length; k++) {
        // Decode each dpad axis into two buttons, one for each direction
        gp.axes.cur[(k*2)  ] = (gamepad.axes[k] < 0);
        gp.axes.cur[(k*2)+1] = (gamepad.axes[k] > 0);

        // Update state changed if not on first input pass
        if (gp.axes.last !== undefined) {
            gp.axes.changed[(k*2)  ] = (gp.axes.cur[(k*2)  ] != gp.axes.last[(k*2)  ]);
            gp.axes.changed[(k*2)+1] = (gp.axes.cur[(k*2)+1] != gp.axes.last[(k*2)+1]);
        }
    }

    // Save current state for comparison on next input
    gp.axes.last = gp.axes.cur.slice(0);
    gp.buttons.last = gp.buttons.cur.slice(0);
}


function gamepadHandleButton(keyBind) {

    var buttonCache;

    // Select button / axis cache based on key bind type
    if (keyBind.type === "button")
        buttonCache = gp.buttons;
    else if (keyBind.type === "axis")
        buttonCache = gp.axes;

    // Make sure the button exists in the cache array
    if (keyBind.gp_button < buttonCache.changed.length) {

        // Send the button state if it's changed
        if (buttonCache.changed[keyBind.gp_button])
            if (buttonCache.cur[keyBind.gp_button])
                GameBoyKeyDown(keyBind.gb_key);
            else
                GameBoyKeyUp(keyBind.gb_key);
    }
}


function gamepadGetCurrent() {

    // Chrome requires retrieving a new gamepad object
    // every time button state is queried (the existing object
    // will have stale button state). Just do that for all browsers
    var gamepad = navigator.getGamepads()[gp.apiID];

    if (gamepad)
        if (gamepad.connected)
            return gamepad;

    return undefined;
}


function gamepadUpdate() {

    var gamepad = gamepadGetCurrent();

    if (gamepad !== undefined) {

        // Cache gamepad input values
        gamepadCacheValues(gamepad);

        // Loop through buttons and send changes if needed
        for (let i=0; i<gp.keybinds.length; i++)
            gamepadHandleButton(gp.keybinds[i]);
    }
    else {
        // Gamepad is no longer present, disconnect
        gamepadStop();
    }
}


function gamepadStart(gamepad) {

    // Make sure it has enough buttons and axes
    if ((gamepad.mapping === GAMEPAD_KEYMAP_STANDARD_STR) ||
        ((gamepad.axes.length >= 2) && (gamepad.buttons.length >= 4))) {

        // Save API index for polling (required by Chrome/V8)
        gp.apiID   = gamepad.index;

        // Assign gameboy keys to the gamepad
        gamepadBindKeys(gamepad.mapping);

        // Start polling the gamepad for input
        gp.timerID = setInterval( () => gamepadUpdate(), GAMEPAD_POLLING_INTERVAL);
    }
}


function gamepadStop() {

    // Stop polling the gamepad for input
    if (gp.timerID !== undefined)
        clearInterval(gp.timerID);

    // Clear previous button history and controller info
    gp.axes.last = undefined;
    gp.buttons.last = undefined;
    gp.keybinds = undefined;

    gp.apiID = undefined;
}


function initGamePad()
{
    // When a gamepad connects, start polling it for input
    window.addEventListener("gamepadconnected", (event) => {
        initSound();
        gamepadStart( navigator.getGamepads()[event.gamepad.index] );
    });

    // When a gamepad disconnects, shut down polling for input
    window.addEventListener("gamepaddisconnected", (event) => {
        gamepadStop();
    });
}


initGamePad();




