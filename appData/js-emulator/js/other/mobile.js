var romPath = "rom/game.gb";
var mainCanvas = null;
var soundReady = false;

var cout = console.log.bind(console);
function startGame(blob) {
  var binaryHandle = new FileReader();
  binaryHandle.onload = function() {
    if (this.readyState === 2) {
      try {
        start(mainCanvas, this.result);
      } catch (e) {
        alert(e.message);
      }
    }
  };
  binaryHandle.readAsBinaryString(blob);
}

function loadViaXHR() {
  var xhr = new XMLHttpRequest();
  xhr.open("GET", romPath);
  xhr.responseType = "blob";
  xhr.onload = function() {
    startGame(new Blob([this.response], { type: "text/plain" }));
  };
  xhr.send();
}

function windowingInitialize() {
  cout("windowingInitialize() called.", 0);
  mainCanvas = document.getElementById("mainCanvas");
  window.onunload = autoSave;
  loadViaXHR();
}

//Wrapper for localStorage getItem, so that data can be retrieved in various types.
function findValue(key) {
  try {
    if (window.localStorage.getItem(key) != null) {
      return JSON.parse(window.localStorage.getItem(key));
    }
  } catch (error) {
    //An older Gecko 1.8.1/1.9.0 method of storage (Deprecated due to the obvious security hole):
    if (window.globalStorage[location.hostname].getItem(key) != null) {
      return JSON.parse(window.globalStorage[location.hostname].getItem(key));
    }
  }
  return null;
}
//Wrapper for localStorage setItem, so that data can be set in various types.
function setValue(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    //An older Gecko 1.8.1/1.9.0 method of storage (Deprecated due to the obvious security hole):
    window.globalStorage[location.hostname].setItem(key, JSON.stringify(value));
  }
}
//Wrapper for localStorage removeItem, so that data can be set in various types.
function deleteValue(key) {
  try {
    window.localStorage.removeItem(key);
  } catch (error) {
    //An older Gecko 1.8.1/1.9.0 method of storage (Deprecated due to the obvious security hole):
    window.globalStorage[location.hostname].removeItem(key);
  }
}

// Allow Audio context to be created in places which require
// user input first. Hook this up to keyboard and touch inputs
function initSound() {
  if (!soundReady && !settings[0] && GameBoyEmulatorInitialized()) {
    window.AudioContext = window.AudioContext || window.webkitAudioContext;
    window.audioContext = new AudioContext();
    if (window.audioContext) {
      // Create empty buffer
      var buffer = window.audioContext.createBuffer(1, 1, 22050);
      var source = window.audioContext.createBufferSource();
      source.buffer = buffer;
      // Connect to output (speakers)
      source.connect(window.audioContext.destination);
      // Play sound
      if (source.start) {
        source.start(0);
      } else if (source.play) {
        source.play(0);
      } else if (source.noteOn) {
        source.noteOn(0);
      }
      window.audioContext.resume().then(() => {
        settings[0] = true;
        gameboy.initSound();
        soundReady = true;
      });
    }
  }
}

var soundInitTimer = setInterval(function() {
  if (GameBoyEmulatorInitialized()) {
    initSound();
    clearTimeout(soundInitTimer);
  }
}, 16);

window.addEventListener("DOMContentLoaded", windowingInitialize);
