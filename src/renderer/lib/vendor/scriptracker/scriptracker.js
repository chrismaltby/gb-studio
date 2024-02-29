"use strict";

var Channel = require("./channel");
var ModModule = require("./mod_module");
var S3mModule = require("./s3m_module");
var XmModule = require("./xm_module");
var Sample = require("./sample");
var Effects = require("./effects");

/**
 * ScripTracker.js
 *
 * ScripTracker is a JavaScript mod player that can play MOD, S3M and XM music in a modern browser using the Audio API.
 *
 * Author:			Maarten Janssen
 * Version:			1.1.0
 * Date:			2013-02-14
 * Last updated:	2016-01-25
 */
var ScripTracker = function () {
  this.module = null; // Module file that is playing.
  this.pattern = null; // The current pattern being played.
  this.orderIndex = 0; // Index in the order table of the module.
  this.currentRow = 0; // Current row in pattern.
  this.currentTick = 0; // Current tick in row.

  this.sampleRate = 0; // Playback sample rate defined by the audioContext.
  this.bpm = 0; // Current BPM.
  this.speedConversion = true; // Default convert 50/60hz ticks per second.
  this.ticksPerRow = 0; // Current number of ticks in one row (tempo).
  this.samplesPerTick = 0; // Number of samples to process for the current tick.
  this.sampleCount = 0; // Number of samples processed for the current tick.
  this.sampleStepping = 0; // Base sample step based on 125 / 6.
  this.isPlaying = false; // Is the player currently playing?
  this.notePeriodsGB = [
    44,
    156,
    262,
    363,
    457,
    547,
    631,
    710,
    786,
    854,
    923,
    986, // C3 to B3
    1046,
    1102,
    1155,
    1205,
    1253,
    1297,
    1339,
    1379,
    1417,
    1452,
    1486,
    1517, // C4 to B4
    1546,
    1575,
    1602,
    1627,
    1650,
    1673,
    1694,
    1714,
    1732,
    1750,
    1767,
    1783, // C5 to B5
    1798,
    1812,
    1825,
    1837,
    1849,
    1860,
    1871,
    1881,
    1890,
    1899,
    1907,
    1915, // C6 to B6
    1923,
    1930,
    1936,
    1943,
    1949,
    1954,
    1959,
    1964,
    1969,
    1974,
    1978,
    1982, // C7 to B7
    1985,
    1988,
    1992,
    1995,
    1998,
    2001,
    2004,
    2006,
    2009,
    2011,
    2013,
    2015,
  ]; // C8 to B8

  this.masterVolume = 0.6; // The master volume multiplier.
  this.masterVolSlide = 0; // Master volume delta per tick.
  this.breakPattern = -1; // Pattern break row to restart next order.
  this.orderJump = -1; // Order jump index of next order.
  this.rowJump = -1; // Row to jump to when looping
  this.patternDelay = 0; // Pattern delay will keep the player at the current row until 0.
  this.patternLoop = false; // Do not jump to next order, but repeat current.
  this.channelRegisters = []; // Channel registers containing the player data for each channel.

  this.audioContext = null; // AudioContext for output.
  this.audioSource = null; // Source object for audio.
  this.audioScriptNode = null; // Audio processing object.
  this.bufferSize = 2048; // Size of the audio buffer.

  this.eventHandlers = {
    SONG_LOADED: [],
    PLAY: [],
    STOP: [],
    SONG_END: [],
    NEW_ROW: [],
    NEW_ORDER: [],
    INSTRUMENT: [],
    EFFECT: [],
  };

  if (typeof AudioContext !== "undefined") {
    this.audioContext = new AudioContext(); // Create AudioContext.
  } else if (typeof webkitAudioContext !== "undefined") {
    this.audioContext = new webkitAudioContext(); // Create Webkit specific AudioContext.
  } else {
    // TODO: This event cannot be dispatched and caught!!!
    //this.dispatchEvent(ScripTracker.Events.error, this, "Unable to create AudioContext");
    console.error("Unable to create AudioContext");
    return;
  }

  this.audioSource = this.audioContext.createBufferSource();
  this.audioScriptNode = this.audioContext.createScriptProcessor(
    this.bufferSize,
    1,
    2
  );
  this.sampleRate = this.audioContext.sampleRate;
  this.sampleStepping = Math.round(this.sampleRate * 0.02) * 3;
  this.audioScriptNode.onaudioprocess = this.fillBuffer.bind(this);
  this.audioSource.start(0);
};

ScripTracker.prototype.fillBuffer = function (audioProcessingEvent) {
  if (!this.isPlaying || !this.module) return;

  var outputBuffer = audioProcessingEvent.outputBuffer;
  var samplesL = outputBuffer.getChannelData(0);
  var samplesR = outputBuffer.getChannelData(1);

  for (var sIndex = 0; sIndex < outputBuffer.length; sIndex++) {
    var sampleL = 0;
    var sampleR = 0;

    for (var c = 0; c < this.module.channels; c++) {
      var registers = this.channelRegisters[c];

      if (registers.sample.sample) {
        var sample =
          registers.sample.sample.sample[Math.floor(registers.sample.position)];

        var vEnvelopeValue = registers.volume.envelope.getValue(
          registers.envelopePos,
          registers.noteReleased,
          1.0
        );
        var pEnvelopeValue = registers.panning.envelope.getValue(
          registers.envelopePos,
          registers.noteReleased,
          0.5
        );
        var vol =
          vEnvelopeValue *
          registers.tremolo.volume *
          registers.volume.channelVolume; // registers.volume.sampleVolume *
        var pan = Math.max(
          0.0,
          Math.min(
            registers.panning.pan +
              (pEnvelopeValue - 0.5) *
                ((2 - Math.abs(registers.panning.pan - 2)) / 0.5),
            1.0
          )
        );
        registers.envelopePos += 1 / this.samplesPerTick;

        // Normal panning.
        if (!registers.isMuted && !registers.tremor.muted) {
          if (registers.panning.pan <= 1.0) {
            sampleL += sample * (1.0 - pan) * vol;
            sampleR += sample * pan * vol;

            // Surround sound.
          } else {
            sampleL += sample * 0.5 * vol;
            sampleR -= sample * 0.5 * vol;
          }
        }

        registers.sample.position += registers.sample.reversed
          ? -registers.sample.step
          : registers.sample.step;
        registers.sample.remain -= Math.abs(registers.sample.step);

        // Loop or stop the sample when we reach its end.
        if (registers.sample.remain <= 0) {
          if (registers.sample.sample.loopType === Sample.LoopType.FORWARD) {
            registers.sample.position =
              registers.sample.sample.loopStart - registers.sample.remain;
            registers.sample.remain =
              registers.sample.sample.loopLength + registers.sample.remain;
          } else if (
            registers.sample.sample.loopType === Sample.LoopType.PINGPONG
          ) {
            registers.sample.position = Math.max(
              registers.sample.sample.loopStart,
              registers.sample.position
            );
            registers.sample.position = Math.min(
              registers.sample.sample.loopStart +
                registers.sample.sample.loopLength -
                1,
              registers.sample.position
            );
            registers.sample.remain = registers.sample.sample.loopLength;
            registers.sample.reversed = !registers.sample.reversed;
          } else {
            registers.sample.position =
              registers.sample.sample.sampleLength - 1;
            registers.sample.step = 0;
          }
        }
      }
    }

    samplesL[sIndex] = sampleL * this.masterVolume;
    samplesR[sIndex] = sampleR * this.masterVolume;

    this.sampleCount++;
    if (this.sampleCount === this.samplesPerTick) {
      this.sampleCount = 0;
      this.currentTick++;
      if (this.currentTick === this.ticksPerRow) {
        this.processRowEnd();
      }
      this.processTick();
    }
  }
};

ScripTracker.prototype.processTick = function () {
  if (this.currentTick === 0) {
    if (this.currentRow === 0) {
      this.dispatchEvent(ScripTracker.Events.order, this);
    }
    this.dispatchEvent(ScripTracker.Events.row, this);
  }

  for (var c = 0; c < this.module.channels; c++) {
    var registers = this.channelRegisters[c];
    var note = this.pattern.note[this.currentRow][c];
    var instrIndex = this.pattern.instrument[this.currentRow][c];
    var volume = this.pattern.volume[this.currentRow][c];
    var effect = this.pattern.effect[this.currentRow][c];
    var effectParam = this.pattern.effectParam[this.currentRow][c];

    if (this.currentTick === 0) {
      // Change instrument and retrigger current note.
      // but only if the instrument changed or has a note
      if (
        instrIndex !== 0 &&
        (instrIndex != registers.instrument || note != 0 || c > 2)
      ) {
        registers.instrument = instrIndex;
        this.dispatchEvent(
          ScripTracker.Events.instrument,
          this,
          c,
          registers.instrument,
          note,
          effect,
          effectParam
        );
        var instrument = this.module.instruments[instrIndex - 1];
        if (instrument) {
          var sampleKey = Math.max(0, instrument.sampleKeyMap[note] - 1);

          // Set sample and envelope registers.
          if (instrument.samples[sampleKey]) {
            registers.sample.sample = instrument.samples[sampleKey]; // Set sample based on current note.
            registers.sample.remain = registers.sample.sample.sampleLength; // Remaining length of this sample.
            //registers.volume.sampleVolume = registers.sample.sample.volume; // Set base sample volume. Disabled for GBT
          }
          registers.sample.position = 0; // Restart sample.
          registers.sample.restart = 0; // Reset sample restart position.
          registers.sample.reversed = false; // Reset sample reverse playback.
          registers.volume.envelope = instrument.volumeEnvelope; // Get volume envelope.
          registers.panning.envelope = instrument.panningEnvelope; // Get panning envelope.
          registers.envelopePos = 0; // Reset volume envelope.
          registers.noteReleased = false; // Reset decay.

          // Set channel panning (for MOD use predefined panning). Removed for GBT.
          // if (this.module.type !== "mod" && registers.sample.sample) {
          //   registers.panning.pan = registers.sample.sample.panning;
          // }

          // Remove sample if it has no data.
          if (
            registers.sample.sample &&
            registers.sample.sample.sampleLength < 1
          ) {
            registers.sample.sample = null;
          }
        } else {
          registers.sample.sample = null; // Undefined instrument, so no sample!
        }
      }

      // Make the row note accessible from effects
      registers.rowNote = note;
      // This row contains a note and we are not doing a slide to note.
      if (
        note !== 0 &&
        effect !== Effects.TONE_PORTA &&
        effect !== Effects.TONE_PORTA_VOL_SLIDE
      ) {
        // On stop note start the release part of the envelope.
        if (note === 97) {
          registers.note = note;
          registers.noteReleased = true; // Start release portion of envelopes.
        } else {
          registers.note = note - 1;

          // Update sample frequency according to new note if we have a sample loaded.
          if (registers.sample.sample !== null) {
            registers.period = this.notePeriodsGB[note]; //replace with gb lookup
            var freq = (131072 * 1.8) / (2048 - registers.period); //131072/(2048

            registers.sample.position = registers.sample.restart; // Restart sample from restart position (can be changed by sample offset efect!).
            //registers.volume.sampleVolume = registers.sample.sample.volume; // Reset sample volume. Disabled for GBT
            registers.sample.remain =
              registers.sample.sample.sampleLength - registers.sample.restart; // Repeat length of this sample.
            registers.sample.step = freq / this.sampleStepping; // Samples per division.
            registers.sample.reversed = false; // Reset sample reverse playback.
            registers.noteDelay = 0; // Reset note delay.

            // Dispatch instrument event only if no new instrument was set.
            if (instrIndex === 0) {
              this.dispatchEvent(
                ScripTracker.Events.instrument,
                this,
                c,
                registers.instrument,
                note,
                effect,
                effectParam
              );
            }
          }
        }
      }

      registers.tremolo.volume = 1.0; // Reset tremolo on each row.
      registers.tremor.muted = false; // Reset tremor on each new row.
      if (volume >= 0 && volume <= 64) {
        // Change channel volume.
        //registers.volume.channelVolume = volume / 64;
        //registers.volume.sampleVolume = registers.volume.channelVolumeSet;
        console.log(
          registers.volume.channelVolume,
          registers.volume.channelVolumeSet
        );
      } else if (note < 97 && instrIndex !== 0) {
        //if (registers.volume.channelVolumeSlide !== 0) {
        registers.volume.channelVolumeSlide =
          registers.volume.channelVolumeSlideSet; // note = trigger
        registers.volume.channelVolume = registers.volume.channelVolumeSet;
        //registers.volume.sampleVolume = registers.volume.channelVolumeSet;
        //console.log("Channel:",c,"volSet:",registers.volume.channelVolumeSet);
        //Changed for GBT, Volume set to channelSet on new notes, even when using envelope.
        //}
      }

      if (effect !== Effects.NONE) {
        this.dispatchEvent(
          ScripTracker.Events.effect,
          this,
          c,
          registers.instrument,
          note,
          effect,
          effectParam
        );
      }
    }

    // Handle volume column effects and regular effects.
    if (volume > 64)
      Effects.VOLUME_EFFECT.handler(
        registers,
        volume,
        this.currentTick,
        c,
        this
      );
    effect.handler(registers, effectParam, this.currentTick, c, this);
    //Copy of Volume slide to process every tick, Compatability with GBT
    if (registers.volume.channelVolumeSlide !== 0) {
      // Normal volume slide.
      var slide = registers.volume.channelVolumeSlide / 256;
      registers.volume.channelVolume = Math.max(
        0.0,
        Math.min(registers.volume.channelVolume + slide, 1.0)
      );
    }
  }
};

ScripTracker.prototype.processRowEnd = function () {
  // If an order jump is encountered jump to row 1 of the order at the given index.
  if (this.orderJump !== -1 && !this.patternLoop) {
    this.currentRow = -1;
    this.orderIndex = Math.min(this.module.songLength - 1, this.orderJump);
    this.pattern = this.module.patterns[this.module.orders[this.orderIndex]];
  }

  // Handle pattern break if there is one.
  if (this.breakPattern !== -1) {
    this.currentRow = this.breakPattern - 1;

    // Only handle pattern break when not looping a pattern.
    if (!this.patternLoop && this.orderJump === -1) {
      this.orderIndex++;

      // Handle the skip order marker.
      while (
        this.module.orders[this.orderIndex] === 0xfe &&
        this.orderIndex < this.module.songLength
      ) {
        this.orderIndex++;
      }

      // When we reach the end of the song jump back to the restart position.
      if (
        this.orderIndex === this.module.songLength ||
        this.module.orders[this.orderIndex] == 0xff
      ) {
        this.orderIndex = this.module.restartPosition;
      }

      this.pattern = this.module.patterns[this.module.orders[this.orderIndex]];
    }
  }

  // Jump to a particular row in the current pattern;
  if (this.rowJump !== -1) {
    this.currentRow = this.rowJump - 1;
    this.rowJump = -1;
  }

  // Remain at the current row if pattern delay is active.
  if (this.patternDelay < 2) {
    this.orderJump = -1;
    this.breakPattern = -1;
    this.currentTick = 0;
    this.patternDelay = 0;
    this.currentRow++;
  } else {
    this.patternDelay--;
  }

  // Stop and reset if we no longer have a pattern to work with.
  if (!this.pattern) {
    this.dispatchEvent(ScripTracker.Events.songEnded, this);
    this.stop();
    this.rewind();
    this.resetPlayback();
    return;
  }

  // When we reach the end of our current pattern jump to the next one.
  if (this.currentRow === this.pattern.rows) {
    this.currentRow = 0;
    if (!this.patternLoop) this.orderIndex++;

    // Handle the skip order marker.
    while (
      this.module.orders[this.orderIndex] === 0xfe &&
      this.orderIndex < this.module.songLength
    ) {
      this.orderIndex++;
    }

    // When we reach the end of the song jump back to the restart position.
    if (
      this.orderIndex >= this.module.songLength ||
      this.module.orders[this.orderIndex] === 0xff
    ) {
      this.dispatchEvent(ScripTracker.Events.songEnded, this);
      this.orderIndex = this.module.restartPosition;
      this.resetPlayback();
    }

    this.pattern = this.module.patterns[this.module.orders[this.orderIndex]];
  }
};

ScripTracker.prototype.resetPlayback = function () {
  for (var c = 0; c < this.channelRegisters.length; c++) {
    this.channelRegisters[c].reset();
  }

  this.masterVolume = 0.6;
  this.masterVolSlide = 0;
  this.breakPattern = -1;
  this.orderJump = -1;
  this.rowJump = -1;
  this.patternDelay = 0;

  this.orderIndex = 0;
  this.currentRow = 0;
  this.currentTick = 0;
  this.sampleCount = 0;

  this.pattern = this.module.patterns[this.module.orders[this.orderIndex]];

  Effects.SET_TEMPO.handler(
    this.channelRegisters[0],
    this.module.defaultBPM,
    0,
    0,
    this
  );
  Effects.SET_SPEED.handler(
    this.channelRegisters[0],
    this.module.defaultTempo,
    0,
    0,
    this
  );
  //processTick ();
};

/**
 * Load the given ScripTracker Module object and start playback.
 *
 * mod - A ScripTracker Module object generated by any of the loaders (e.g. ModLoader, S3mLoader, XmLoader).
 */
ScripTracker.prototype.loadModule = function (url, disableSpeedConversion) {
  if (this.isPlaying) this.stop();
  this.module = null;

  this.speedConversion = !disableSpeedConversion;

  var fileExt = url.split(".").pop().toLowerCase().replace(/\?.*/, "");
  var req = new XMLHttpRequest();

  req.onload = function (loadEvent) {
    console.log("REQ LOAD", loadEvent);
    var data = req.response;
    if (data) {
      console.log("LOADING RAW");
      this.loadRaw(new Uint8Array(data), fileExt);
    }
  }.bind(this);

  req.open("get", url, true);
  req.responseType = "arraybuffer";
  req.send();
};

ScripTracker.prototype.loadRaw = function (data, fileExt) {
  console.log("fileExt:" + fileExt);
  switch (fileExt) {
    case "mod":
      this.module = new ModModule(data);
      break;
    case "s3m":
      this.module = new S3mModule(data);
      break;
    case "xm":
      this.module = new XmModule(data);
      break;
    default:
      return;
  }

  this.channelRegisters = [];
  for (var i = 0; i < this.module.channels; i++) {
    this.channelRegisters.push(new Channel());

    // TODO: This should be part of the MOD loader I guess. Removed for GBT.
    // if (this.module.type == "mod") {
    //  this.channelRegisters[i].panning.pan = i % 2 == 0 ? 0.7 : 0.3;
    // }
  }

  this.resetPlayback();
  this.dispatchEvent(ScripTracker.Events.playerReady, this);
};

/**
 * Start playback if player is stopped and a module is loaded.
 */
ScripTracker.prototype.play = function () {
  if (!this.isPlaying && this.module != null) {
    this.dispatchEvent(ScripTracker.Events.play, this);
    this.isPlaying = true;
    this.processTick();

    this.audioSource.connect(this.audioScriptNode);
    this.audioScriptNode.connect(this.audioContext.destination);
  }
};

/**
 * Stop playback after the current row has been processed.
 */
ScripTracker.prototype.stop = function () {
  this.audioScriptNode.disconnect(this.audioContext.destination);
  this.audioSource.disconnect(this.audioScriptNode);
  this.isPlaying = false;
  this.dispatchEvent(ScripTracker.Events.stop, this);
};

/**
 * Jump to the previous order.
 */
ScripTracker.prototype.prevOrder = function () {
  if (
    this.module != null &&
    this.orderIndex - 1 >= 0 &&
    this.module.orders[this.orderIndex] != 0xfe
  ) {
    this.orderIndex--;
    this.pattern = this.module.patterns[this.module.orders[this.orderIndex]];
    this.restartOrder();
  }
};

/**
 * Jump to the top of the next order.
 */
ScripTracker.prototype.nextOrder = function () {
  if (this.module != null && this.orderIndex < this.module.orders.length - 1) {
    this.orderIndex++;
    this.pattern = this.module.patterns[this.module.orders[this.orderIndex]];
    this.restartOrder();
  }
};

/**
 * Restart the current module.
 */
ScripTracker.prototype.rewind = function () {
  // Get first pattern if a module is loaded.
  if (this.module != null) {
    this.orderIndex = 0;
    this.pattern = this.module.patterns[this.module.orders[this.orderIndex]];
    this.restartOrder();
  }
};

/**
 * Restart the current order form row 0.
 */
ScripTracker.prototype.restartOrder = function () {
  if (this.module != null) {
    this.currentRow = 0;
    this.currentTick = 0;
    this.sampleCount = 0;

    for (var c = 0; c < this.module.channels; c++) {
      this.channelRegisters[c].reset();
    }

    this.processTick();
  }
};

/**
 * Is the given channel muted?
 *
 * channel - Index of the channel to check.
 */
ScripTracker.prototype.isMuted = function (channel) {
  if (channel < this.channelRegisters.length) {
    return this.channelRegisters[channel].isMuted;
  } else {
    return true;
  }
};

/**
 * Is pattern looping activated?
 */
ScripTracker.prototype.isPatternLoop = function () {
  return this.patternLoop;
};

/**
 * Set or reset the mute flag of the given channel.
 *
 * channel - Index of the channel to toggle mute.
 * mute    - Mate state of the given channel.
 */
ScripTracker.prototype.setMute = function (channel, mute) {
  if (channel < this.channelRegisters.length) {
    this.channelRegisters[channel].isMuted = mute;
  }
};

/**
 * Set the pattern loop flag.
 *
 * loop - Sets or clears the pattern loop.
 */
ScripTracker.prototype.setPatternLoop = function (loop) {
  this.patternLoop = loop;
};

/**
 * Get the name of the currently loaded module.
 */
ScripTracker.prototype.getSongName = function () {
  return this.module.name;
};

/**
 * Get the currently active order number .
 */
ScripTracker.prototype.getCurrentOrder = function () {
  return this.orderIndex + 1;
};

/**
 * Get the index of the currently active pattern.
 */
ScripTracker.prototype.getCurrentPattern = function () {
  return this.module.orders[this.orderIndex];
};

/**
 * Get the song length as the number of orders.
 */
ScripTracker.prototype.getSongLength = function () {
  return this.module.songLength;
};

/**
 * Get the current BPM of the song.
 */
ScripTracker.prototype.getCurrentBPM = function () {
  return this.bpm;
};

/**
 * Get the current number of ticks per row.
 */
ScripTracker.prototype.getCurrentTicks = function () {
  return this.ticksPerRow;
};

/**
 * Get the currently active row of the pattern.
 */
ScripTracker.prototype.getCurrentRow = function () {
  return this.currentRow;
};

/**
 * Get the number of rows in the current pattern.
 */
ScripTracker.prototype.getPatternRows = function () {
  return this.pattern.rows;
};

/**
 * Get the volume [0.0, 1.0] of the given channel.
 *
 * channel - Channel index to get the volume.
 */
ScripTracker.prototype.getChannelVolume = function (channel) {
  return (
    //this.channelRegisters[channel].volume.sampleVolume * // Disabled for GBT
    this.channelRegisters[channel].volume.channelVolume * this.masterVolume
  );
};

/**
 * Get the name of the instrument playing on the given channel. Actually returns the samples name, but this is the
 * same as the instrument name.
 *
 * channel - Channel index to get instrument name.
 */
ScripTracker.prototype.getChannelInstrument = function (channel) {
  var registers = this.channelRegisters[channel];
  if (registers.sample.sample && registers.sample.step > 0) {
    return registers.sample.sample.name;
  } else {
    return "";
  }
};

/**
 * Get note info text for the given channel and row. e.g. 'C-5 01 .. ...'.
 *
 * channel - Channel index
 * row     - Row number it get info of.
 */
ScripTracker.prototype.getNoteInfo = function (channel, row) {
  return this.pattern.toText(row, channel, this.module.type);
};

ScripTracker.prototype.getSampleRate = function () {
  return this.sampleRate;
};

ScripTracker.prototype.getCurrentNote = function (channel) {
  return this.pattern.note[this.currentRow][channel];
};

ScripTracker.prototype.getMasterVolume = function () {
  return this.masterVolume;
};

ScripTracker.prototype.setMasterVolume = function (value) {
  this.masterVolume = value;
};

ScripTracker.prototype.on = function (event, handler) {
  switch (event) {
    case ScripTracker.Events.instrument:
    case ScripTracker.Events.effect:
      this.eventHandlers[event].push({
        handler: arguments[2],
        param: arguments[1],
      });
      break;

    default:
      this.eventHandlers[event].push(handler);
      break;
  }
};

ScripTracker.prototype.off = function (event, handler) {
  var handlers = this.eventHandlers[event];

  switch (event) {
    case ScripTracker.Events.instrument:
    case ScripTracker.Events.effect:
      for (var i = 0; i < handlers.length; i++) {
        if (
          arguments.length === 1 ||
          (handlers[i].handler === arguments[2] &&
            handlers[i].param === arguments[1])
        ) {
          handlers.splice(i, 1);
          i--;
        }
      }
      break;

    default:
      for (var i = 0; i < handlers.length; i++) {
        if (!handler || handlers[i] === handler) {
          handlers.splice(i, 1);
          i--;
        }
      }
      break;
  }
};

ScripTracker.prototype.dispatchEvent = function (
  event,
  player,
  channel,
  instrument,
  note,
  effect,
  effectParam
) {
  var handlers = this.eventHandlers[event];

  switch (event) {
    case ScripTracker.Events.playerReady:
      for (var i = 0; i < handlers.length; i++) {
        handlers[i](player, player.getSongName(), player.getSongLength());
      }
      break;

    case ScripTracker.Events.order:
      for (var i = 0; i < handlers.length; i++) {
        handlers[i](
          player,
          player.getCurrentOrder(),
          player.getSongLength(),
          player.getCurrentPattern()
        );
      }
      break;

    case ScripTracker.Events.row:
      for (var i = 0; i < handlers.length; i++) {
        handlers[i](player, player.getCurrentRow(), player.getPatternRows());
      }
      break;

    case ScripTracker.Events.instrument:
      for (var i = 0; i < handlers.length; i++) {
        if (handlers[i].param === instrument)
          handlers[i].handler(
            player,
            instrument,
            channel,
            note,
            effect,
            effectParam
          );
      }
      break;

    case ScripTracker.Events.effect:
      for (var i = 0; i < handlers.length; i++) {
        if (handlers[i].param === effect)
          handlers[i].handler(
            player,
            effect,
            effectParam,
            channel,
            instrument,
            note
          );
      }
      break;

    case ScripTracker.Events.error:
      for (var i = 0; i < handlers.length; i++) {
        handlers[i].handler(player, channel);
      }
      break;

    default:
      for (var i = 0; i < handlers.length; i++) {
        handlers[i](player);
      }
      break;
  }
};

ScripTracker.Events = {
  playerReady: "SONG_LOADED",
  play: "PLAY",
  stop: "STOP",
  songEnded: "SONG_END",
  row: "NEW_ROW",
  order: "NEW_ORDER",
  instrument: "INSTRUMENT",
  effect: "EFFECT",
  error: "ERROR",
};

if (window) {
  window.ScripTracker = ScripTracker;
}

module.exports = ScripTracker;
