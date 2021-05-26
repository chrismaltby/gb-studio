/*
 * Copyright (C) 2017 Ben Smith
 *
 * This software may be modified and distributed under the terms
 * of the MIT license.  See the LICENSE file for details.
 */
"use strict";

const RESULT_OK = 0;
const RESULT_ERROR = 1;
const SCREEN_WIDTH = 160;
const SCREEN_HEIGHT = 144;
const SGB_SCREEN_WIDTH = 256;
const SGB_SCREEN_HEIGHT = 224;
const SGB_SCREEN_LEFT = (SGB_SCREEN_WIDTH - SCREEN_WIDTH) >> 1;
const SGB_SCREEN_RIGHT = (SGB_SCREEN_WIDTH + SCREEN_WIDTH) >> 1;
const SGB_SCREEN_TOP = (SGB_SCREEN_HEIGHT - SCREEN_HEIGHT) >> 1;
const SGB_SCREEN_BOTTOM = (SGB_SCREEN_HEIGHT + SCREEN_HEIGHT) >> 1;
const AUDIO_FRAMES = 4096;
const AUDIO_LATENCY_SEC = 0.1;
const MAX_UPDATE_SEC = 5 / 60;
const CPU_TICKS_PER_SECOND = 4194304;
const EVENT_NEW_FRAME = 1;
const EVENT_AUDIO_BUFFER_FULL = 2;
const EVENT_UNTIL_TICKS = 4;
const REWIND_FRAMES_PER_BASE_STATE = 45;
const REWIND_BUFFER_CAPACITY = 4 * 1024 * 1024;
const REWIND_FACTOR = 1.5;
const REWIND_UPDATE_MS = 16;
const BUILTIN_PALETTES = 83;  // See builtin-palettes.def.
const GAMEPAD_POLLING_INTERVAL = 1000 / 60 / 4; // When activated, poll for gamepad input about ~4 times per gameboy frame (~240 times second)
const GAMEPAD_KEYMAP_STANDARD_STR = "standard"; // Try to use "standard" HTML5 mapping config if available

const $ = document.querySelector.bind(document);
let emulator = null;

const binjgbPromise = Binjgb();

// Extract stuff from the vue.js implementation in demo.js.
class VM {
  constructor() {
    this.ticks = 0;
    this.extRamUpdated = false;
    this.paused_ = false;
    this.volume = 0.5;
    this.pal = 0;
    this.canvas = {
      show: true,
      useSgbBorder: true,
      scale: 3,
    };
    this.rewind = {
      minTicks: 0,
      maxTicks: 0,
    };
    setInterval(() => {
      if (this.extRamUpdated) {
        this.updateExtRam();
        this.extRamUpdated = false;
      }
    }, 1000);
  }

  get paused() { return this.paused_; }
  set paused(newPaused) {
    let oldPaused = this.paused_;
    this.paused_ = newPaused;
    if (!emulator) return;
    if (newPaused == oldPaused) return;
    if (newPaused) {
      emulator.pause();
      this.ticks = emulator.ticks;
      this.rewind.minTicks = emulator.rewind.oldestTicks;
      this.rewind.maxTicks = emulator.rewind.newestTicks;
    } else {
      emulator.resume();
    }
  }

  togglePause() {
    this.paused = !this.paused;
  }

  updateExtRam() {
    if (!emulator) return;
    const extram = emulator.getExtRam();
    localStorage.setItem('extram', JSON.stringify(Array.from(extram)));
  }
};

const vm = new VM();

// Load a ROM.
(async function go() {
  let response = await fetch('rom/game.gb');
  let romBuffer = await response.arrayBuffer();
  const extRam = new Uint8Array(JSON.parse(localStorage.getItem('extram')));
  Emulator.start(await binjgbPromise, romBuffer, extRam);
  emulator.setBuiltinPalette(vm.pal);
})();

function makeWasmBuffer(module, ptr, size) {
  return new Uint8Array(module.HEAP8.buffer, ptr, size);
}

class Emulator {
  static start(module, romBuffer, extRamBuffer) {
    Emulator.stop();
    emulator = new Emulator(module, romBuffer, extRamBuffer);
    emulator.run();
  }

  static stop() {
    if (emulator) {
      emulator.destroy();
      emulator = null;
    }
  }

  constructor(module, romBuffer, extRamBuffer) {
    this.module = module;
    this.romDataPtr = this.module._malloc(romBuffer.byteLength);
    makeWasmBuffer(this.module, this.romDataPtr, romBuffer.byteLength)
        .set(new Uint8Array(romBuffer));
    this.e = this.module._emulator_new_simple(
        this.romDataPtr, romBuffer.byteLength, Audio.ctx.sampleRate,
        AUDIO_FRAMES);
    if (this.e == 0) {
      throw new Error('Invalid ROM.');
    }

    this.gamepad = new Gamepad(module, this.e);
    this.audio = new Audio(module, this.e);
    this.video = new Video(module, this.e, $('canvas'));
    this.rewind = new Rewind(module, this.e);
    this.rewindIntervalId = 0;

    this.lastRafSec = 0;
    this.leftoverTicks = 0;
    this.fps = 60;

    if (extRamBuffer) {
      this.loadExtRam(extRamBuffer);
    }

    this.bindKeys();
    this.gamepad.init();
  }

  destroy() {
    this.unbindKeys();
    this.gamepad.shutdown();
    this.cancelAnimationFrame();
    clearInterval(this.rewindIntervalId);
    this.rewind.destroy();
    this.module._emulator_delete(this.e);
    this.module._free(this.romDataPtr);
  }

  withNewFileData(cb) {
    const fileDataPtr = this.module._ext_ram_file_data_new(this.e);
    const buffer = makeWasmBuffer(
        this.module, this.module._get_file_data_ptr(fileDataPtr),
        this.module._get_file_data_size(fileDataPtr));
    const result = cb(fileDataPtr, buffer);
    this.module._file_data_delete(fileDataPtr);
    return result;
  }

  loadExtRam(extRamBuffer) {
    this.withNewFileData((fileDataPtr, buffer) => {
      if (buffer.byteLength === extRamBuffer.byteLength) {
        buffer.set(new Uint8Array(extRamBuffer));
        this.module._emulator_read_ext_ram(this.e, fileDataPtr);
      }
    });
  }

  getExtRam() {
    return this.withNewFileData((fileDataPtr, buffer) => {
      this.module._emulator_write_ext_ram(this.e, fileDataPtr);
      return new Uint8Array(buffer);
    });
  }

  get isPaused() {
    return this.rafCancelToken === null;
  }

  pause() {
    if (!this.isPaused) {
      this.cancelAnimationFrame();
      this.audio.pause();
      this.beginRewind();
    }
  }

  resume() {
    if (this.isPaused) {
      this.endRewind();
      this.requestAnimationFrame();
      this.audio.resume();
    }
  }

  setBuiltinPalette(pal) {
    this.module._emulator_set_builtin_palette(this.e, pal);
  }

  get isRewinding() {
    return this.rewind.isRewinding;
  }

  beginRewind() {
    this.rewind.beginRewind();
  }

  rewindToTicks(ticks) {
    if (this.rewind.rewindToTicks(ticks)) {
      this.runUntil(ticks);
      this.video.renderTexture();
    }
  }

  endRewind() {
    this.rewind.endRewind();
    this.lastRafSec = 0;
    this.leftoverTicks = 0;
    this.audio.startSec = 0;
  }

  set autoRewind(enabled) {
    if (enabled) {
      this.rewindIntervalId = setInterval(() => {
        const oldest = this.rewind.oldestTicks;
        const start = this.ticks;
        const delta =
            REWIND_FACTOR * REWIND_UPDATE_MS / 1000 * CPU_TICKS_PER_SECOND;
        const rewindTo = Math.max(oldest, start - delta);
        this.rewindToTicks(rewindTo);
        vm.ticks = emulator.ticks;
      }, REWIND_UPDATE_MS);
    } else {
      clearInterval(this.rewindIntervalId);
      this.rewindIntervalId = 0;
    }
  }

  requestAnimationFrame() {
    this.rafCancelToken = requestAnimationFrame(this.rafCallback.bind(this));
  }

  cancelAnimationFrame() {
    cancelAnimationFrame(this.rafCancelToken);
    this.rafCancelToken = null;
  }

  run() {
    this.requestAnimationFrame();
  }

  get ticks() {
    return this.module._emulator_get_ticks_f64(this.e);
  }

  runUntil(ticks) {
    while (true) {
      const event = this.module._emulator_run_until_f64(this.e, ticks);
      if (event & EVENT_NEW_FRAME) {
        this.rewind.pushBuffer();
        this.video.uploadTexture();
      }
      if ((event & EVENT_AUDIO_BUFFER_FULL) && !this.isRewinding) {
        this.audio.pushBuffer();
      }
      if (event & EVENT_UNTIL_TICKS) {
        break;
      }
    }
    if (this.module._emulator_was_ext_ram_updated(this.e)) {
      vm.extRamUpdated = true;
    }
  }

  rafCallback(startMs) {
    this.requestAnimationFrame();
    let deltaSec = 0;
    if (!this.isRewinding) {
      const startSec = startMs / 1000;
      deltaSec = Math.max(startSec - (this.lastRafSec || startSec), 0);
      const startTicks = this.ticks;
      const deltaTicks =
          Math.min(deltaSec, MAX_UPDATE_SEC) * CPU_TICKS_PER_SECOND;
      const runUntilTicks = (startTicks + deltaTicks - this.leftoverTicks);
      this.runUntil(runUntilTicks);
      this.leftoverTicks = (this.ticks - runUntilTicks) | 0;
      this.lastRafSec = startSec;
    }
    const lerp = (from, to, alpha) => (alpha * from) + (1 - alpha) * to;
    this.fps = lerp(this.fps, Math.min(1 / deltaSec, 10000), 0.3);
    this.video.renderTexture();
  }

  bindKeys() {
    this.keyFuncs = {
      'ArrowDown': this.module._set_joyp_down.bind(null, this.e),
      'ArrowLeft': this.module._set_joyp_left.bind(null, this.e),
      'ArrowRight': this.module._set_joyp_right.bind(null, this.e),
      'ArrowUp': this.module._set_joyp_up.bind(null, this.e),
      'KeyZ': this.module._set_joyp_B.bind(null, this.e),
      'KeyX': this.module._set_joyp_A.bind(null, this.e),
      'Enter': this.module._set_joyp_start.bind(null, this.e),
      'Tab': this.module._set_joyp_select.bind(null, this.e),
      'Backspace': this.keyRewind.bind(this),
      'Space': this.keyPause.bind(this),
    };
    this.boundKeyDown = this.keyDown.bind(this);
    this.boundKeyUp = this.keyUp.bind(this);

    window.addEventListener('keydown', this.boundKeyDown);
    window.addEventListener('keyup', this.boundKeyUp);
  }

  unbindKeys() {
    window.removeEventListener('keydown', this.boundKeyDown);
    window.removeEventListener('keyup', this.boundKeyUp);
  }

  keyDown(event) {
    if (event.code in this.keyFuncs) {
      this.keyFuncs[event.code](true);
      event.preventDefault();
    }
  }

  keyUp(event) {
    if (event.code in this.keyFuncs) {
      this.keyFuncs[event.code](false);
      event.preventDefault();
    }
  }

  keyRewind(isKeyDown) {
    if (this.isRewinding !== isKeyDown) {
      if (isKeyDown) {
        vm.paused = true;
        this.autoRewind = true;
      } else {
        this.autoRewind = false;
        vm.paused = false;
      }
    }
  }

  keyPause(isKeyDown) {
    if (isKeyDown) vm.togglePause();
  }
}

class Gamepad {
  constructor(module, e) {
    this.module = module;
    this.e = e;
  }

  // Load a key map for gamepad-to-gameboy buttons
  bindKeys(strMapping) {
    this.GAMEPAD_KEYMAP_STANDARD = [
      {gb_key: "b",      gp_button: 0,  type: "button", gp_bind:this.module._set_joyp_B.bind(null, this.e)      },
      {gb_key: "a",      gp_button: 1,  type: "button", gp_bind:this.module._set_joyp_A.bind(null, this.e)      },
      {gb_key: "select", gp_button: 8,  type: "button", gp_bind:this.module._set_joyp_select.bind(null, this.e) },
      {gb_key: "start",  gp_button: 9,  type: "button", gp_bind:this.module._set_joyp_start.bind(null, this.e)  },
      {gb_key: "up",     gp_button: 12, type: "button", gp_bind:this.module._set_joyp_up.bind(null, this.e)     },
      {gb_key: "down",   gp_button: 13, type: "button", gp_bind:this.module._set_joyp_down.bind(null, this.e)   },
      {gb_key: "left",   gp_button: 14, type: "button", gp_bind:this.module._set_joyp_left.bind(null, this.e)   },
      {gb_key: "right",  gp_button: 15, type: "button", gp_bind:this.module._set_joyp_right.bind(null, this.e)  }
    ];

    this.GAMEPAD_KEYMAP_DEFAULT = [
      {gb_key: "a",      gp_button: 0, type: "button", gp_bind:this.module._set_joyp_A.bind(null, this.e) },
      {gb_key: "b",      gp_button: 1, type: "button", gp_bind:this.module._set_joyp_B.bind(null, this.e) },
      {gb_key: "select", gp_button: 2, type: "button", gp_bind:this.module._set_joyp_select.bind(null, this.e) },
      {gb_key: "start",  gp_button: 3, type: "button", gp_bind:this.module._set_joyp_start.bind(null, this.e) },
      {gb_key: "up",     gp_button: 2, type: "axis",   gp_bind:this.module._set_joyp_up.bind(null, this.e) },
      {gb_key: "down",   gp_button: 3, type: "axis",   gp_bind:this.module._set_joyp_down.bind(null, this.e) },
      {gb_key: "left",   gp_button: 0, type: "axis",   gp_bind:this.module._set_joyp_left.bind(null, this.e) },
      {gb_key: "right",  gp_button: 1, type: "axis",   gp_bind:this.module._set_joyp_right.bind(null, this.e) }
    ];

    // Try to use the w3c "standard" gamepad mapping if available
    // (Chrome/V8 seems to do that better than Firefox)
    //
    // Otherwise use a default mapping that assigns
    // A/B/Select/Start to the first four buttons,
    // and U/D/L/R to the first two axes.
    if (strMapping === GAMEPAD_KEYMAP_STANDARD_STR) {
      this.gp.keybinds = this.GAMEPAD_KEYMAP_STANDARD;
    } else {
      this.gp.keybinds = this.GAMEPAD_KEYMAP_DEFAULT;
    }
  }

  cacheValues(gamepad) {
    // Read Buttons
    for (let k = 0; k < gamepad.buttons.length; k++) {
      // .value is for analog, .pressed is for boolean buttons
      this.gp.buttons.cur[k] =
          (gamepad.buttons[k].value > 0 || gamepad.buttons[k].pressed == true);

      // Update state changed if not on first input pass
      if (this.gp.buttons.last !== undefined) {
        this.gp.buttons.changed[k] =
            (this.gp.buttons.cur[k] != this.gp.buttons.last[k]);
      }
    }

    // Read Axes
    for (let k = 0; k < gamepad.axes.length; k++) {
      // Decode each dpad axis into two buttons, one for each direction
      this.gp.axes.cur[(k * 2)] = (gamepad.axes[k] < 0);
      this.gp.axes.cur[(k * 2) + 1] = (gamepad.axes[k] > 0);

      // Update state changed if not on first input pass
      if (this.gp.axes.last !== undefined) {
        this.gp.axes.changed[(k * 2)] =
            (this.gp.axes.cur[(k * 2)] != this.gp.axes.last[(k * 2)]);
        this.gp.axes.changed[(k * 2) + 1] =
            (this.gp.axes.cur[(k * 2) + 1] != this.gp.axes.last[(k * 2) + 1]);
      }
    }

    // Save current state for comparison on next input
    this.gp.axes.last = this.gp.axes.cur.slice(0);
    this.gp.buttons.last = this.gp.buttons.cur.slice(0);
  }

  handleButton(keyBind) {
    let buttonCache;

    // Select button / axis cache based on key bind type
    if (keyBind.type === "button") {
      buttonCache = this.gp.buttons;
    } else if (keyBind.type === "axis") {
      buttonCache = this.gp.axes;
    }

    // Make sure the button exists in the cache array
    if (keyBind.gp_button < buttonCache.changed.length) {
      // Send the button state if it's changed
      if (buttonCache.changed[keyBind.gp_button]) {
        if (buttonCache.cur[keyBind.gp_button]) {
          // Gamepad Button Down
          keyBind.gp_bind(true);
        } else {
          // Gamepad Button Up
          keyBind.gp_bind(false);
        }
      }
    }
  }

  getCurrent() {
    // Chrome requires retrieving a new gamepad object
    // every time button state is queried (the existing object
    // will have stale button state). Just do that for all browsers
    let gamepad = navigator.getGamepads()[this.gp.apiID];

    if (gamepad) {
      if (gamepad.connected) {
        return gamepad;
      }
    }

    return undefined;
  }

  update() {
    let gamepad = this.getCurrent();

    if (gamepad !== undefined) {
      // Cache gamepad input values
      this.cacheValues(gamepad);

      // Loop through buttons and send changes if needed
      for (let i = 0; i < this.gp.keybinds.length; i++) {
        this.handleButton(this.gp.keybinds[i]);
      }
    } else {
      // Gamepad is no longer present, disconnect
      this.releaseGamepad();
    }
  }

  startGamepad(gamepad) {
    // Make sure it has enough buttons and axes
    if ((gamepad.mapping === GAMEPAD_KEYMAP_STANDARD_STR) ||
        ((gamepad.axes.length >= 2) && (gamepad.buttons.length >= 4))) {
      // Save API index for polling (required by Chrome/V8)
      this.gp.apiID = gamepad.index;

      // Assign gameboy keys to the gamepad
      this.bindKeys(gamepad.mapping);

      // Start polling the gamepad for input
      this.gp.timerID =
          setInterval(() => this.update(), GAMEPAD_POLLING_INTERVAL);
    }
  }

  releaseGamepad() {
    // Stop polling the gamepad for input
    if (this.gp.timerID !== undefined) {
      clearInterval(this.gp.timerID);
    }

    // Clear previous button history and controller info
    this.gp.axes.last = undefined;
    this.gp.buttons.last = undefined;
    this.gp.keybinds = undefined;

    this.gp.apiID = undefined;
  }

  // If a gamepad was already connected on this page
  // and released, it won't fire another connect event.
  // So try to find any that might be present
  checkAlreadyConnected() {
    let gamepads = navigator.getGamepads();

    // If any gamepads are already attached to the page,
    // use the first one that is connected
    for (let idx = 0; idx < gamepads.length; idx++) {
      if ((gamepads[idx] !== undefined) && (gamepads[idx] !== null)) {
        if (gamepads[idx].connected === true) {
          this.startGamepad(gamepads[idx]);
        }
      }
    }
  }

  // Event handler for when a gamepad is connected
  eventConnected(event) {
    this.startGamepad(navigator.getGamepads()[event.gamepad.index]);
  }

  // Event handler for when a gamepad is disconnected
  eventDisconnected(event) {
    this.releaseGamepad();
  }

  // Register event connection handlers for gamepads
  init() {
    // gamepad related vars
    this.gp = {
      apiID: undefined,
      timerID: undefined,
      keybinds: undefined,
      axes: {last: undefined, cur: [], changed: []},
      buttons: {last: undefined, cur: [], changed: []}
    };

    // Check for previously attached gamepads that might
    // not emit a gamepadconnected() event
    this.checkAlreadyConnected();

    this.boundGamepadConnected = this.eventConnected.bind(this);
    this.boundGamepadDisconnected = this.eventDisconnected.bind(this);

    // When a gamepad connects, start polling it for input
    window.addEventListener('gamepadconnected', this.boundGamepadConnected);

    // When a gamepad disconnects, shut down polling for input
    window.addEventListener(
        'gamepaddisconnected', this.boundGamepadDisconnected);
  }

  // Release event connection handlers and settings
  shutdown() {
    this.releaseGamepad();
    window.removeEventListener('gamepadconnected', this.boundGamepadConnected);
    window.removeEventListener(
        'gamepaddisconnected', this.boundGamepadDisconnected);
  }
}

class Audio {
  constructor(module, e) {
    this.module = module;
    this.buffer = makeWasmBuffer(
        this.module, this.module._get_audio_buffer_ptr(e),
        this.module._get_audio_buffer_capacity(e));
    this.startSec = 0;
    this.resume();
  }

  get sampleRate() { return Audio.ctx.sampleRate; }

  pushBuffer() {
    const nowSec = Audio.ctx.currentTime;
    const nowPlusLatency = nowSec + AUDIO_LATENCY_SEC;
    const volume = vm.volume;
    this.startSec = (this.startSec || nowPlusLatency);
    if (this.startSec >= nowSec) {
      const buffer = Audio.ctx.createBuffer(2, AUDIO_FRAMES, this.sampleRate);
      const channel0 = buffer.getChannelData(0);
      const channel1 = buffer.getChannelData(1);
      for (let i = 0; i < AUDIO_FRAMES; i++) {
        channel0[i] = this.buffer[2 * i] * volume / 255;
        channel1[i] = this.buffer[2 * i + 1] * volume / 255;
      }
      const bufferSource = Audio.ctx.createBufferSource();
      bufferSource.buffer = buffer;
      bufferSource.connect(Audio.ctx.destination);
      bufferSource.start(this.startSec);
      const bufferSec = AUDIO_FRAMES / this.sampleRate;
      this.startSec += bufferSec;
    } else {
      console.log(
          'Resetting audio (' + this.startSec.toFixed(2) + ' < ' +
          nowSec.toFixed(2) + ')');
      this.startSec = nowPlusLatency;
    }
  }

  pause() {
    Audio.ctx.suspend();
  }

  resume() {
    Audio.ctx.resume();
  }
}

Audio.ctx = new AudioContext;

class Video {
  constructor(module, e, el) {
    this.module = module;
    try {
      this.renderer = new WebGLRenderer(el);
    } catch (error) {
      console.log(`Error creating WebGLRenderer: ${error}`);
      this.renderer = new Canvas2DRenderer(el);
    }
    this.buffer = makeWasmBuffer(
        this.module, this.module._get_frame_buffer_ptr(e),
        this.module._get_frame_buffer_size(e));
    this.sgbBuffer = makeWasmBuffer(
        this.module, this.module._get_sgb_frame_buffer_ptr(e),
        this.module._get_sgb_frame_buffer_size(e));
  }

  uploadTexture() {
    this.renderer.uploadTextures(this.buffer, this.sgbBuffer);
  }

  renderTexture() {
    this.renderer.renderTextures();
  }
}

class Canvas2DRenderer {
  constructor(el) {
    this.ctx = el.getContext('2d');
    this.imageData = this.ctx.createImageData(SCREEN_WIDTH, SCREEN_HEIGHT);
    this.sgbImageData =
        this.ctx.createImageData(SGB_SCREEN_WIDTH, SGB_SCREEN_HEIGHT);

    this.overlayCanvas = document.createElement('canvas');
    this.overlayCanvas.width = SGB_SCREEN_WIDTH;
    this.overlayCanvas.height = SGB_SCREEN_HEIGHT;
    this.overlayCtx = this.overlayCanvas.getContext('2d');
  }

  uploadTextures(buffer, sgbBuffer) {
    this.imageData.data.set(buffer);
    this.sgbImageData.data.set(sgbBuffer);
  }

  renderTextures() {
    if (vm.canvas.useSgbBorder) {
      this.ctx.putImageData(this.imageData, SGB_SCREEN_LEFT, SGB_SCREEN_TOP);
      this.overlayCtx.putImageData(this.sgbImageData, 0, 0);
      this.ctx.drawImage(this.overlayCanvas, 0, 0);
    } else {
      this.ctx.putImageData(this.imageData, 0, 0);
    }
  }
}

class WebGLRenderer {
  constructor(el) {
    const gl = this.gl = el.getContext('webgl', {preserveDrawingBuffer: true});
    if (gl === null) {
      throw new Error('unable to create webgl context');
    }

    function compileShader(type, source) {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        throw new Error(`compileShader failed: ${gl.getShaderInfoLog(shader)}`);
      }
      return shader;
    }

    const vertexShader = compileShader(gl.VERTEX_SHADER,
       `attribute vec2 aPos;
        attribute vec2 aTexCoord;
        varying highp vec2 vTexCoord;
        void main(void) {
          gl_Position = vec4(aPos, 0.0, 1.0);
          vTexCoord = aTexCoord;
        }`);
    const fragmentShader = compileShader(gl.FRAGMENT_SHADER,
       `varying highp vec2 vTexCoord;
        uniform sampler2D uSampler;
        void main(void) {
          gl_FragColor = texture2D(uSampler, vTexCoord);
        }`);

    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      throw new Error(`program link failed: ${gl.getProgramInfoLog(program)}`);
    }
    gl.useProgram(program);

    this.aPos = gl.getAttribLocation(program, 'aPos');
    this.aTexCoord = gl.getAttribLocation(program, 'aTexCoord');
    this.uSampler = gl.getUniformLocation(program, 'uSampler');

    this.fbTexture = this.createTexture();
    this.sgbFbTexture = this.createTexture();

    const invLerpClipSpace = (x, max) => 2 * (x / max) - 1;
    const l = invLerpClipSpace(SGB_SCREEN_LEFT, SGB_SCREEN_WIDTH);
    const r = invLerpClipSpace(SGB_SCREEN_RIGHT, SGB_SCREEN_WIDTH);
    const t = -invLerpClipSpace(SGB_SCREEN_TOP, SGB_SCREEN_HEIGHT);
    const b = -invLerpClipSpace(SGB_SCREEN_BOTTOM, SGB_SCREEN_HEIGHT);
    const w = SCREEN_WIDTH / 256, sw = SGB_SCREEN_WIDTH / 256;
    const h = SCREEN_HEIGHT / 256, sh = SGB_SCREEN_HEIGHT / 256;

    const verts = new Float32Array([
      // fb only
      -1, -1,  0, h,
      +1, -1,  w, h,
      -1, +1,  0, 0,
      +1, +1,  w, 0,

      // sgb fb
      l, b,  0, h,
      r, b,  w, h,
      l, t,  0, 0,
      r, t,  w, 0,

      // sgb border
      -1, -1,  0,  sh,
      +1, -1,  sw, sh,
      -1, +1,  0,  0,
      +1, +1,  sw, 0,
    ]);

    const buffer = gl.createBuffer();
    this.gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STATIC_DRAW);

    gl.enableVertexAttribArray(this.aPos);
    gl.enableVertexAttribArray(this.aTexCoord);
    gl.vertexAttribPointer(this.aPos, 2, gl.FLOAT, gl.FALSE, 16, 0);
    gl.vertexAttribPointer(this.aTexCoord, 2, gl.FLOAT, gl.FALSE, 16, 8);
    gl.uniform1i(this.uSampler, 0);
  }

  createTexture() {
    const gl = this.gl;
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(
        gl.TEXTURE_2D, 0, gl.RGBA, 256, 256, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    return texture;
  }

  uploadTextures(buffer, sgbBuffer) {
    const gl = this.gl;
    gl.bindTexture(gl.TEXTURE_2D, this.fbTexture);
    gl.texSubImage2D(
        gl.TEXTURE_2D, 0, 0, 0, SCREEN_WIDTH, SCREEN_HEIGHT, gl.RGBA,
        gl.UNSIGNED_BYTE, buffer);

    gl.bindTexture(gl.TEXTURE_2D, this.sgbFbTexture);
    gl.texSubImage2D(
        gl.TEXTURE_2D, 0, 0, 0, SGB_SCREEN_WIDTH, SGB_SCREEN_HEIGHT, gl.RGBA,
        gl.UNSIGNED_BYTE, sgbBuffer);
  }

  renderTextures() {
    const gl = this.gl;
    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
    gl.clearColor(0.5, 0.5, 0.5, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    if (vm.canvas.useSgbBorder) {
      gl.bindTexture(gl.TEXTURE_2D, this.fbTexture);
      gl.drawArrays(gl.TRIANGLE_STRIP, 4, 4);

      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      gl.bindTexture(gl.TEXTURE_2D, this.sgbFbTexture);
      gl.drawArrays(gl.TRIANGLE_STRIP, 8, 4);
      gl.disable(gl.BLEND);
    } else {
      gl.bindTexture(gl.TEXTURE_2D, this.fbTexture);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }
  }
}

class Rewind {
  constructor(module, e) {
    this.module = module;
    this.e = e;
    this.joypadBufferPtr = this.module._joypad_new();
    this.statePtr = 0;
    this.bufferPtr = this.module._rewind_new_simple(
        e, REWIND_FRAMES_PER_BASE_STATE, REWIND_BUFFER_CAPACITY);
    this.module._emulator_set_default_joypad_callback(e, this.joypadBufferPtr);
  }

  destroy() {
    this.module._rewind_delete(this.bufferPtr);
    this.module._joypad_delete(this.joypadBufferPtr);
  }

  get oldestTicks() {
    return this.module._rewind_get_oldest_ticks_f64(this.bufferPtr);
  }

  get newestTicks() {
    return this.module._rewind_get_newest_ticks_f64(this.bufferPtr);
  }

  pushBuffer() {
    if (!this.isRewinding) {
      this.module._rewind_append(this.bufferPtr, this.e);
    }
  }

  get isRewinding() {
    return this.statePtr !== 0;
  }

  beginRewind() {
    if (this.isRewinding) return;
    this.statePtr =
        this.module._rewind_begin(this.e, this.bufferPtr, this.joypadBufferPtr);
  }

  rewindToTicks(ticks) {
    if (!this.isRewinding) return;
    return this.module._rewind_to_ticks_wrapper(this.statePtr, ticks) ===
        RESULT_OK;
  }

  endRewind() {
    if (!this.isRewinding) return;
    this.module._emulator_set_default_joypad_callback(
        this.e, this.joypadBufferPtr);
    this.module._rewind_end(this.statePtr);
    this.statePtr = 0;
  }
}
