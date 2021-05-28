"use strict";

/**
 * Effects.js
 *
 * Holds all effects and handlers that process a given effect. The structure is as follows:
 * representations: an array of textual effect representations within the tracker per ModType.
 * handler: a function that implements the given effect using its params and changes player registers.
 *
 * Author:  		Maarten Janssen
 * Date:    		2013-06-21
 * Last updated:	2015-07-23
 */
var Effects = {
  NONE: {
    representation: ".",
    handler: function (registers, param, tick, channel, player) {},
  },

  // Arpeggio varies the frequency of a note every tick depending on the parameters.
  ARPEGGIO: {
    representation: "0",
    handler: function (registers, param, tick, channel, player) {
      // Calculate periods to add depening on arpeggio parameters
      var arpeggio;
      if (tick % 3 === 0) {
        arpeggio = 0;
      } else if (tick % 3 === 1) {
        arpeggio = (param & 0xf0) >> 4;
      } else if (tick % 3 === 2) {
        arpeggio = param & 0x0f;
      }

      // Calculate new frequency.
      var freq =
        (131072 * 1.8) /
        (2048 - player.notePeriodsGB[registers.note + 1 + arpeggio]);
      //var freq = 8363 * Math.pow(2, (4608 - registers.period + arpeggio) / 768);
      registers.sample.step = freq / player.sampleStepping;
    },
  },

  // Note porta up. The rate at which the period of the note is being slid up is quadruppled.
  PORTA_UP: {
    representation: "1",
    handler: function (registers, param, tick, channel, player) {
      if (tick === 0) {
        // && param !== 0 00 use last not supported
        registers.porta.step = param;
      } else if (tick > 0) {
        registers.period = Math.min(
          2047,
          registers.period + registers.porta.step
        );
        var freq = (131072 * 1.8) / (2048 - registers.period);
        registers.sample.step = Math.min(64, freq / player.sampleStepping);
        //console.log(registers.sample.step);
      }
    },
  },

  // Note porta down. The porta rate is being quadruppled? clamp min
  PORTA_DOWN: {
    representation: "2",
    handler: function (registers, param, tick, channel, player) {
      if (tick === 0) {
        // && param !== 0 00 use last not supported
        registers.porta.step = param;
      } else if (tick > 0) {
        registers.period = Math.max(2, registers.period - registers.porta.step);
        var freq = (131072 * 1.8) / (2048 - registers.period);
        registers.sample.step = freq / player.sampleStepping;
      }
    },
  },

  // Porta to the given note with the given porta speed on each tick. Once the target period is reached stop
  // the porta effect. Porta speed is quadruppled.
  TONE_PORTA: {
    representation: "3",
    handler: function (registers, param, tick, channel, player) {
      if (!registers.sample.sample) return;

      // Set porta speed if param is present.
      if (tick === 0 && param !== 0) {
        registers.porta.step = param;
      }

      // Set note to porta to if present.
      if (tick === 0 && player.getCurrentNote(channel) !== 0) {
        registers.porta.notePeriod =
          7680 -
          (player.getCurrentNote(channel) -
            26 -
            registers.sample.sample.basePeriod) *
            64 -
          registers.sample.sample.fineTune / 2;
      }

      // Porta up or down depending on current note period and target period.
      if (registers.period < registers.porta.notePeriod) {
        registers.period += registers.porta.step * player.ticksPerRow;

        // When the target period is reached stop porta.
        if (registers.period > registers.porta.notePeriod) {
          registers.period = registers.porta.notePeriod;
        }
      } else if (registers.period > registers.porta.notePeriod) {
        registers.period -= registers.porta.step * player.ticksPerRow;

        // When the target period is reached stop porta.
        if (registers.period < registers.porta.notePeriod) {
          registers.period = registers.porta.notePeriod;
        }
      }

      // Calculate new sample step.
      var freq = 8363 * Math.pow(2, (4608 - registers.period) / 768);
      registers.sample.step = freq / player.sampleStepping;
    },
  },

  // Note vibrato using a sine function with an amplitude of a given number of finetunes and a given speed.
  VIBRATO: {
    representation: "4",
    handler: function (registers, param, tick, channel, player) {
      // At tick 0 and non zero parameter reset vibrato sine and set new parameters.
      if (tick === 0 && param !== 0) {
        // Set vibrato step if parameter non zero.
        if ((param & 0xf0) !== 0) {
          registers.vibrato.step =
            (2 * Math.PI * (((param & 0xf0) >> 4) * player.ticksPerRow)) / 64.0;
        }

        // Set vibrato amplitude if parameter non zero.
        if ((param & 0x0f) !== 0) {
          registers.vibrato.amplitude = (param & 0x0f) * 2;
        }

        registers.vibrato.position = 0;
      }

      //  Calculate new note frequency and advance vibrato sine pos.
      var vibrato =
        Math.sin(registers.vibrato.position) * registers.vibrato.amplitude;
      var freq = 8363 * Math.pow(2, (4608 - registers.period + vibrato) / 768);

      registers.sample.step = freq / player.sampleStepping;
      registers.vibrato.position += registers.vibrato.step;
    },
  },

  // Slide the volume up or down on every tick except the first and porta to the note that was set by the
  // tone porta effect. Parameter values > 127 will slide up, lower values slide down.
  TONE_PORTA_VOL_SLIDE: {
    representation: "5",
    handler: function (registers, param, tick, channel, player) {
      if (!registers.sample.sample) return;

      // Set note to porta to if present.
      if (tick === 0 && player.getCurrentNote(channel) != 0) {
        registers.porta.notePeriod =
          7680 -
          (player.getCurrentNote(channel) -
            26 -
            registers.sample.sample.basePeriod) *
            64 -
          registers.sample.sample.fineTune / 2;
      }

      // Porta up or down depending on current note period and target period.
      if (registers.period < registers.porta.notePeriod) {
        registers.period += registers.porta.step;

        // When the target period is reached stop porta.
        if (registers.period > registers.porta.notePeriod) {
          registers.period = registers.porta.notePeriod;
        }
      } else if (registers.period > registers.porta.notePeriod) {
        registers.period -= registers.porta.step;

        // When the target period is reached stop porta.
        if (registers.period < registers.porta.notePeriod) {
          registers.period = registers.porta.notePeriod;
        }
      }

      // Calculate new sample step and set volume.
      var freq = 8363 * Math.pow(2, (4608 - registers.period) / 768);
      registers.sample.step = freq / player.sampleStepping;

      var slide =
        ((param & 0xf0) != 0 ? (param & 0xf0) >> 4 : -(param & 0x0f)) / 64.0;
      registers.volume.channelVolume = Math.max(
        0.0,
        Math.min(registers.volume.channelVolume + slide, 1.0)
      );
    },
  },

  // Note vibrato using previous vibrato parameters and do a volume slide using current parameter.
  VIBRATO_VOL_SLIDE: {
    representation: "6",
    handler: function (registers, param, tick, channel, player) {
      // On tick 0 copy volume slide parameter if set.
      if (tick === 0 && param !== 0) {
        registers.volume.channelVolumeSlide = param;
      }

      //  Calculate new note frequency and advance vibrato sine pos.
      var vibrato =
        Math.sin(registers.vibrato.position) * registers.vibrato.amplitude;
      var freq = 8363 * Math.pow(2, (4608 - registers.period + vibrato) / 768);
      registers.sample.step = freq / player.sampleStepping;

      registers.vibrato.position += registers.vibrato.step;

      // Set sample volume.
      var slide =
        ((registers.volume.channelVolumeSlide & 0xf0) != 0
          ? (registers.volume.channelVolumeSlide & 0xf0) >> 4
          : -(registers.volume.channelVolumeSlide & 0x0f)) / 64.0;
      registers.volume.channelVolume = Math.max(
        0.0,
        Math.min(registers.volume.channelVolume + slide, 1.0)
      );
    },
  },

  // Tremolo vibrates the volume up and down.
  TREMOLO: {
    representation: "7",
    handler: function (registers, param, tick, channel, player) {
      // At tick 0 and non zero parameter reset tremolo sine and set new parameters.
      if (tick === 0 && param !== 0) {
        // Set tremolo step if parameter non zero.
        if ((param & 0xf0) !== 0) {
          registers.tremolo.step =
            (2 * Math.PI * (((param & 0xf0) >> 4) * player.ticksPerRow)) / 64.0;
        }

        // Set tremolo amplitude if parameter non zero.
        if ((param & 0x0f) !== 0) {
          registers.tremolo.amplitude = (param & 0x0f) / 30;
        }

        registers.tremolo.position = 0;
      }

      //  Calculate new volume delta and advance vibrato sine pos.
      registers.tremolo.volume =
        1.0 -
        Math.sin(registers.tremolo.position) * registers.tremolo.amplitude;
      registers.tremolo.position += registers.tremolo.step;
    },
  },

  // Set panning for this channel. 0x00 - left, 0x40 - middle, 0x80 - right. Anything greater than 0x80
  // causes surround sound on the current channel.
  SET_PAN: {
    representation: "8",
    handler: function (registers, param, tick, channel, player) {
      if (tick === 0) {
        registers.panning.pan = 1 - param / 128.0;
      }
    },
  },

  // Set sample offset in words. 9xx 9ve
  SET_VOLUME_AND_SLIDE: {
    // was SAMPLE_OFFSET
    representation: "9",
    handler: function (registers, param, tick, channel, player) {
      // Direct hardware accsess, NRx2 VVVV APPP Volume, Add mode, wait Period.
      if (tick === 0) {
        //&& channel !== 2
        var vol = (param & 0xf0) >> 4;
        var slide = param & 0x7;
        switch (slide) {
          default:
          case 0:
            slide = 0;
            break; // Disable 1/0
          case 1:
            slide = 16;
            break; // fastest 1/1 FLIPED!!!
          case 2:
            slide = 8;
            break; // 1/2
          case 3:
            slide = 5.3;
            break; // 1/3
          case 4:
            slide = 4;
            break; // 1/4
          case 5:
            slide = 3.2;
            break; // 1/5
          case 6:
            slide = 2.6;
            break; // 1/6
          case 7:
            slide = 2.28;
            break; // Slow 1/7
        }
        if ((param & 0x08) === 0x08) {
          // Volume envelope add Up!
          slide = slide;
        } else {
          // Volume envelope Down!
          slide = 0 - slide;
        }
        // Set slide
        registers.volume.channelVolumeSlideSet = slide;
        // Set Volume
        registers.volume.channelVolumeSet = Math.max(
          0.0,
          Math.min(vol / 16.0, 1.0)
        );
        registers.volume.sampleVolume = registers.volume.channelVolume; //Patch for GBT envelopes
        // If we have a note this row, use volume and slide immediately
        if (registers.rowNote !== 0) {
          registers.volume.channelVolumeSlide =
            registers.volume.channelVolumeSlideSet;
          registers.volume.channelVolume = registers.volume.channelVolumeSet;
        }
        //console.log("ch " + channel + " param " + param + " slide " + slide + " vol " + vol);
      }
    },
  },

  // Slide the volume up or down on every tick except the first.
  // Parameter values > 127 will slide up, lower values slide down.
  //	Depricated from GBT! Ignore this effect!
  VOLUME_SLIDE: {
    representation: "A",
    handler: function (registers, param, tick, channel, player) {
      // On tick 0 copy parameter if set.
      if (tick === 0) {
        //removed so 0 resets, had && param !== 0
        if (param > 0xf) {
          // Volume envelope Up!
          var slide = (param & 0xf0) >> 4;
        } else {
          // Volume envelope Down!
          var slide = param & 0xf;
        }
        // On gameboy, this is a timer to +-1/16th every tick, to every 7 ticks
        // 64 tick / 50 hz tick mult 1.28
        // 16, 8, 5.3, 4, 3.2, 2.6, 2.28
        switch (slide) {
          default:
          case 0:
            slide = 0;
            break; // Disable 1/0
          case 1:
          case 2:
            slide = 2.28;
            break; // Slow 1/7
          case 3:
            slide = 2.6;
            break; // 1/6
          case 4:
            slide = 3.2;
            break; // 1/5
          case 5:
            slide = 4;
            break; // 1/4
          case 6:
            slide = 5.3;
            break; // 1/3
          case 7:
          case 8:
            slide = 8;
            break; // 1/2
          case 9:
          case 10:
          case 11:
          case 12:
          case 13:
          case 14:
          case 15:
            slide = 16;
            break; // fastest 1/1
        }
        if (param > 0xf) {
          // Volume envelope Up!
          param = slide;
        } else {
          // Volume envelope Down!
          param = 0 - slide;
        }
        registers.volume.channelVolumeSlideSet = param;
        //console.log("Channel:",channel,"Slide:",registers.volume.channelVolumeSlide);
      }

      /*	if (tick > 0 && registers.volume.channelVolumeSlide !== 0) {
				if ((registers.volume.channelVolumeSlide & 0xF0) === 0xF0 && (registers.volume.channelVolumeSlide & 0x0F) !== 0x00) {
					// Fine volume slide down only on tick 1.
					if (tick === 1) {
						var slide = (registers.volume.channelVolumeSlide & 0x0F) / 64.0;
						registers.volume.channelVolume = Math.max(0.0, registers.volume.channelVolume - slide);
					}
				} else if ((registers.volume.channelVolumeSlide & 0x0F) === 0x0F && (registers.volume.channelVolumeSlide & 0xF0) !== 0x00) {
					// Fine volume slide up.
					if (tick === 1) {
						var slide = ((registers.volume.channelVolumeSlide & 0xF0) >> 4) / 64.0;
						registers.volume.channelVolume = Math.min(1.0, registers.volume.channelVolume + slide);
					}
				} else {
					// Normal volume slide.
					var slide = (((registers.volume.channelVolumeSlide & 0xF0) != 0) ? (registers.volume.channelVolumeSlide & 0xF0) >> 4 : -(registers.volume.channelVolumeSlide & 0x0F)) / 64.0;
					registers.volume.channelVolume = Math.max(0.0, Math.min(registers.volume.channelVolume + slide, 1.0));
				}
			}
		*/
    },
  },

  // After this row jump to row 1 of the given order.
  POSITION_JUMP: {
    representation: "B",
    handler: function (registers, param, tick, channel, player) {
      if (tick === 0) {
        player.orderJump = param;
      }
    },
  },

  // Set the volume of a channel on the first tick according to the given parameter.
  SET_VOLUME: {
    representation: "C",
    handler: function (registers, param, tick, channel, player) {
      if (tick === 0) {
        if (channel === 2) {
          registers.volume.channelVolumeSet = Math.max(
            0.0,
            Math.min(Math.round(param / 16.0) / 4.0, 1.0)
          );
        } else {
          registers.volume.channelVolumeSet = Math.max(
            0.0,
            Math.min(Math.round(param / 4.0) / 16.0, 1.0)
          );
        }
        registers.volume.channelVolume = registers.volume.channelVolumeSet; //GBT Take max volume from set vol
        registers.volume.sampleVolume = registers.volume.channelVolume; // causes a trigger for GBT envelopes
        registers.volume.channelVolumeSlide =
          registers.volume.channelVolumeSlideSet;
      }
    },
  },

  // At the end of this row jump to the next order and start playing at the row given in the parameter.
  PATTERN_BREAK: {
    representation: "D",
    handler: function (registers, param, tick, channel, player) {
      if (tick === 0) {
        player.breakPattern = ((param & 0xf0) >> 4) * 10 + (param & 0x0f);
      }
    },
  },

  SET_FILTER: {
    representation: "E",
    handler: function (registers, param, tick, channel, player) {
      if (tick === 0) {
        console.log("Effect not supported: SET_FILTER");
      }
    },
  },

  // Slide note pitch up only on the first tick.
  FINE_PORTA_UP: {
    representation: "E",
    handler: function (registers, param, tick, channel, player) {
      if (tick === 0) {
        // If param value present change porta step.
        if (param & (0x0f !== 0)) {
          registers.porta.step = param & 0x0f;
        }

        // Slide pitch up.
        registers.period -= registers.porta.step * player.ticksPerRow;
        var freq = 8363 * Math.pow(2, (4608 - registers.period) / 768);
        registers.sample.step = freq / player.sampleStepping;
      }
    },
  },

  // Slide note pitch down only on the first tick.
  FINE_PORTA_DOWN: {
    representation: "E",
    handler: function (registers, param, tick, channel, player) {
      if (tick === 0) {
        // If param value present change porta step.
        if (param & (0x0f !== 0)) {
          registers.porta.step = param & 0x0f;
        }

        // Slide pitch down.
        registers.period += registers.porta.step * player.ticksPerRow;
        var freq = 8363 * Math.pow(2, (4608 - registers.period) / 768);
        registers.sample.step = freq / player.sampleStepping;
      }
    },
  },

  SET_GLISANDO: {
    representation: "E",
    handler: function (registers, param, tick, channel, player) {
      if (tick === 0) {
        console.log("Effect not supported: SET_GLISANDO");
      }
    },
  },

  SET_VIBRATO: {
    representation: "E",
    handler: function (registers, param, tick, channel, player) {
      if (tick === 0) {
        console.log("Effect not supported: SET_VIBRATO");
      }
    },
  },

  // Set the finetune of the sample playing on the current channel.
  SET_FINETUNE: {
    representation: "E",
    handler: function (registers, param, tick, channel, player) {
      if (tick === 0 && registers.sample.sample !== null) {
        registers.sample.sample.fineTune = param & 0x0f;
      }
    },
  },

  // Pattern section loop.
  SET_LOOP: {
    representation: "E",
    handler: function (registers, param, tick, channel, player) {
      if (tick === 0) {
        if ((param & 0x0f) === 0) {
          registers.loopMark = player.currentRow;
        } else {
          if (registers.loopCount == 0) {
            registers.loopCount = param & 0x0f;
          } else {
            registers.loopCount--;
          }

          if (registers.loopCount > 0) {
            player.rowJump = registers.loopMark;
          }
        }
      }
    },
  },

  SET_TREMOLO: {
    representation: "E",
    handler: function (registers, param, tick, channel, player) {
      if (tick === 0) {
        console.log("Effect not supported: SET_TREMOLO");
      }
    },
  },

  // Set panning for this channel. 0x00 - left --> 0x0F - right.
  SET_PAN_16: {
    representation: "E",
    handler: function (registers, param, tick, channel, player) {
      if (tick === 0) {
        // registers.panning.pan = (param & 0x0F) / 15.0; // Replaced with MOD2GBT Code
        switch (param & 0x0f) {
          case 0:
          case 1:
          case 2:
          case 3:
            registers.panning.pan = 0;
            break;

          default:
          case 4:
          case 5:
          case 6:
          case 7:
          case 8:
          case 9:
          case 10:
          case 11:
            registers.panning.pan = 0.5;
            break;

          case 12:
          case 13:
          case 14:
          case 15:
            registers.panning.pan = 1;
            break;
        }
      }
    },
  },

  // Retrigger the note every param ticks.
  RETRIGGER: {
    representation: "E",
    handler: function (registers, param, tick, channel, player) {
      if (tick % (param & 0x0f) === 0 && registers.sample.sample) {
        registers.sample.remain =
          registers.sample.sample.sampleLength - registers.sample.restart;
        registers.sample.position = registers.sample.restart;
        player.dispatchEvent(
          ScripTracker.Events.instrument,
          player,
          channel,
          registers.instrument,
          registers.note,
          Effects.RETRIGGER,
          param
        );
      }
    },
  },

  // At the first tick of the row add x to the volume.
  FINE_VOL_SLIDE_UP: {
    representation: "E",
    handler: function (registers, param, tick, channel, player) {
      if (tick === 0) {
        registers.volume.channelVolume = Math.min(
          registers.volume.channelVolume + (param & 0x0f) / 15.0,
          1.0
        );
      }
    },
  },

  // At the first tick of the row subtract x from the volume.
  FINE_VOL_SLIDE_DOWN: {
    representation: "E",
    handler: function (registers, param, tick, channel, player) {
      if (tick === 0) {
        registers.volume.channelVolume = Math.max(
          0.0,
          registers.volume.channelVolume - (param & 0x0f) / 15.0
        );
      }
    },
  },

  // Cut the volume of the note to 0 if the current tick equals the parameter value.
  CUT_NOTE: {
    representation: "E",
    handler: function (registers, param, tick, channel, player) {
      if (tick === (param & 0x0f)) {
        registers.volume.channelVolume = 0.0;
      }
    },
  },

  // Set the number of ticks to wait before starting the note.
  DELAY_NOTE: {
    representation: "E",
    handler: function (registers, param, tick, channel, player) {
      if (tick === 0) {
        registers.noteDelay = param & 0x0f;
      }
    },
  },

  // Keep the player at the current row for the time equivalent to param * rowDelay. Notes are not retriggered, but
  // effects remain active.
  DELAY_PATTERN: {
    representation: "E",
    handler: function (registers, param, tick, channel, player) {
      if (registers.patternDelay === 0) {
        registers.patternDelay = (param & 0x0f) + 1;
      }
    },
  },

  // Set BMP or tempo on the first tick according to the parameter of the effect. A value greater than 32 will
  // change the BPM, other values change the tempo.
  SET_TEMPO_BPM: {
    representation: "F",
    handler: function (registers, param, tick, channel, player) {
      if (tick === 0) {
        if (param <= 32) {
          if (player.speedConversion) {
            param = Math.floor((param * 60) / 50);
          }
          Effects.SET_SPEED.handler(registers, param, tick, channel, player);
        } else {
          //Effects.SET_TEMPO.handler (registers, param, tick, channel, player);
        }
      }
    },
  },

  // Set speed as defined by the number of ticks per row.
  SET_SPEED: {
    representation: "F",
    handler: function (registers, param, tick, channel, player) {
      if (tick === 0) {
        if (param !== 0) {
          player.ticksPerRow = param;

          var rpm = (24 * player.bpm) / player.ticksPerRow;
          var tpm = rpm * player.ticksPerRow;
          player.samplesPerTick = Math.round(player.sampleRate / (tpm / 60));
        } else {
          player.stop();
          player.resetPlayback();
        }
      }
    },
  },

  // Set tempo as the number of beats per minute.
  SET_TEMPO: {
    representation: "F",
    handler: function (registers, param, tick, channel, player) {
      if (tick === 0) {
        player.bpm = param;

        var rpm = (24 * player.bpm) / player.ticksPerRow;
        var tpm = rpm * player.ticksPerRow;
        player.samplesPerTick = Math.round(player.sampleRate / (tpm / 60));
      }
    },
  },

  // Retrigger note if the current tick is equal to param Y and perform a volume slide using param X.
  RETRIG_VOL_SLIDE: {
    representation: "R",
    handler: function (registers, param, tick, channel, player) {
      if (tick % (param & 0x0f) === 0 && registers.sample.sample) {
        registers.sample.remain =
          registers.sample.sample.sampleLength - registers.sample.restart;
        registers.sample.position = registers.sample.restart;
      }

      if (tick === 0 && (param & 0xf0) !== 0) {
        registers.volume.channelVolumeSlide = (param & 0xf0) >> 4;
      } else if (tick > 0) {
        switch (registers.volume.channelVolumeSlide) {
          case 1:
            registers.volume.channelVolume -= 1 / 64;
            break;
          case 2:
            registers.volume.channelVolume -= 2 / 64;
            break;
          case 3:
            registers.volume.channelVolume -= 4 / 64;
            break;
          case 4:
            registers.volume.channelVolume -= 8 / 64;
            break;
          case 5:
            registers.volume.channelVolume -= 16 / 64;
            break;
          case 6:
            registers.volume.channelVolume *= 0.67;
            break;
          case 7:
            registers.volume.channelVolume *= 0.5;
            break;
          case 9:
            registers.volume.channelVolume += 1 / 64;
            break;
          case 10:
            registers.volume.channelVolume += 2 / 64;
            break;
          case 11:
            registers.volume.channelVolume += 4 / 64;
            break;
          case 12:
            registers.volume.channelVolume += 8 / 64;
            break;
          case 13:
            registers.volume.channelVolume += 16 / 64;
            break;
          case 14:
            registers.volume.channelVolume *= 1.5;
            break;
          case 15:
            registers.volume.channelVolume *= 2.0;
            break;
          default:
            break;
        }

        registers.volume.channelVolume = Math.max(
          0.0,
          Math.min(registers.volume.channelVolume, 1.0)
        );
      }
    },
  },

  // Set the global volume.
  SET_GLOBAL_VOLUME: {
    representation: "G",
    handler: function (registers, param, tick, channel, player) {
      if (tick === 0) {
        player.masterVolume = Math.max(0.0, Math.min(param / 64.0, 1.0));
      }
    },
  },

  // Slide global volume up or down.
  GLOBAL_VOLUME_SLIDE: {
    representation: "H",
    handler: function (registers, param, tick, channel, player) {
      // On tick 0 copy parameter if set.
      if (tick === 0 && param !== 0) {
        player.masterVolume =
          ((param & 0xf0) != 0 ? (param & 0xf0) >> 4 : -(param & 0x0f)) / 64.0;
      }

      // Slide volume on every tick > 0.
      if (tick > 0 && player.masterVolSlide !== 0) {
        player.masterVolume = Math.max(
          0.0,
          Math.min(player.getMasterVolume() + player.masterVolSlide, 1.0)
        );
      }
    },
  },

  // Set envelope position on current instrument.
  ENVELOPE_POSITION: {
    representation: "L",
    handler: function (registers, param, tick, channel, player) {
      if (tick === 0) {
        registers.envelopePosition = param;
      }
    },
  },

  // Slide panning of the channel left or right.
  PAN_SLIDE: {
    representation: "P",
    handler: function (registers, param, tick, channel, player) {
      // On tick 0 copy parameter if set.
      if (tick === 0 && param !== 0) {
        registers.panning.panSlide =
          ((param & 0xf0) > 0 ? (param & 0xf0) >> 4 : -(param & 0x0f)) / 64.0;
      }

      // Change channel panning.
      if (tick > 0) {
        registers.panning.pan = Math.max(
          0,
          Math.min(registers.panning.pan + registers.panning.panSlide, 1)
        );
      }
    },
  },

  // Tremor turns a note on for X tick and then switches it off for Y frames.
  TREMOR: {
    representation: "T",
    handler: function (registers, param, tick, channel, player) {
      if (tick === 0 && param !== 0) {
        registers.tremor.onCount = param & 0xf0;
        registers.tremor.offCount = param & 0x0f;
        registers.tremor.muted = false;
      } else {
        var tremorCount = registers.tremor.onCount + registers.tremor.offCount;
        registers.tremor.muted = tick % tremorCount >= registers.tremor.onCount;
      }
    },
  },

  // Fine vibrato is the same as regular vibrato, except that it only triggers every 4th tick.
  FINE_VIBRATO: {
    representation: "U",
    handler: function (registers, param, tick, channel, player) {
      // At tick 0 and non zero parameter reset vibrato sine and set new parameters.
      if (tick === 0 && param !== 0) {
        // Set vibrato step if parameter non zero.
        if ((param & 0xf0) != 0) {
          registers.vibrato.step =
            (2 * Math.PI * (((param & 0xf0) >> 4) * player.ticksPerRow)) / 64.0;
        }

        // Set vibrato amplitude if parameter non zero.
        if ((param & 0x0f) != 0) {
          registers.vibrato.amplitude = (param & 0x0f) * 8;
        }

        registers.vibrato.position = 0;
      }

      //  Calculate new note frequency and advance vibrato sine pos.
      if (tick % 4 == 0) {
        var vibrato =
          Math.sin(registers.vibrato.position) * registers.vibrato.amplitude;
        var freq =
          8363 * Math.pow(2, (4608 - registers.period + vibrato) / 768);

        registers.sample.step = freq / player.sampleStepping;
        registers.vibrato.position += registers.vibrato.step;
      }
    },
  },

  // Extra fine porta up 4 times finer than fine porta up.
  EXTRA_FINE_PORTA_UP: {
    representation: "X",
    handler: function (registers, param, tick, channel, player) {
      if (tick === 0) {
        // If param value present change porta step.
        if (param & (0x0f !== 0)) {
          registers.porta.step = param & 0x0f;
        }

        // Slide pitch up.
        registers.period -= registers.porta.step;
        var freq = 8363 * Math.pow(2, (4608 - registers.period) / 768);
        registers.sample.step = freq / player.sampleStepping;
      }
    },
  },

  // Extra fine porta down 4 times finer than fine porta down.
  EXTRA_FINE_PORTA_DOWN: {
    representation: "X",
    handler: function (registers, param, tick, channel, player) {
      if (tick === 0) {
        // If param value present change porta step.
        if (param & (0x0f !== 0)) {
          registers.porta.step = param & 0x0f;
        }

        // Slide pitch down.
        registers.period += registers.porta.step;
        var freq = 8363 * Math.pow(2, (4608 - registers.period) / 768);
        registers.sample.step = freq / player.sampleStepping;
      }
    },
  },

  // Parse effect parameter from volume column and handle the effect.
  VOLUME_EFFECT: {
    representation: "V",
    handler: function (registers, params, tick, channel, player) {
      var effect = (params & 0xf0) >> 4;
      var param = params & 0x0f;

      switch (effect) {
        // Volume slide down
        case 0x05:
          Effects.VOLUME_SLIDE.handler(registers, param, tick, channel, player);
          break;

        // Volume slide up.
        case 0x06:
          param = param << 4;
          Effects.VOLUME_SLIDE.handler(registers, param, tick, channel, player);
          break;

        // Fine volume slide down.
        case 0x07:
          param = 0xf0 + param;
          Effects.VOLUME_SLIDE.handler(registers, param, tick, channel, player);
          break;

        // Fine volume slide up.
        case 0x08:
          param = (param << 4) + 0x0f;
          Effects.VOLUME_SLIDE.handler(registers, param, tick, channel, player);
          break;

        // Vibrator with speed only param.
        case 0x09:
          param = param << 4;
          Effects.VIBRATO.handler(registers, param, tick, channel, player);
          break;

        // Vibrato with depth only param.
        case 0x0a:
          Effects.VIBRATO.handler(registers, param, tick, channel, player);
          break;

        // Set panning.
        case 0x0b:
          param = param * 2 + 11;
          Effects.SET_PAN.handler(registers, param, tick, channel, player);
          break;

        // Slide panning left.
        case 0x0c:
          Effects.PAN_SLIDE.handler(registers, param, tick, channel, player);
          break;

        // Slide panning right.
        case 0x0d:
          param = param << 4;
          Effects.PAN_SLIDE.handler(registers, param, tick, channel, player);
          break;

        // Porta to note.
        case 0x0e:
          param *= 4;
          Effects.TONE_PORTA.handler(registers, param, tick, channel, player);
          break;

        default:
          break;
      }
    },
  },
};

module.exports = Effects;
