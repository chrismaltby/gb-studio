"use strict";

var Module     = require("./module");
var Pattern    = require("./pattern");
var Instrument = require("./instrument");
var Sample     = require("./sample");
var Effects    = require("./effects");
var Helpers    = require("./helpers");

/**
 * ModModule.js
 *
 * Loader for MOD modules. Returns a generic ScripTracker Module object for playback.
 *
 * Author:  		Maarten Janssen
 * Date:    		2014-05-12
 * Last updated:	2015-07-22
 * Modified for GameBoy Tracker compatibility.
 */
var ModModule = function(fileData) {
	Module.call(this);
	this.type = Module.Types.MOD;

	// Note period lookup table.
	var notePeriods = [1712, 1616, 1524, 1440, 1356, 1280, 1208, 1140, 1076, 1016, 960, 906,
					   856 , 808 , 762 , 720 , 678 , 640 , 604 , 570 , 538 , 508 , 480, 453,
					   428 , 404 , 381 , 360 , 339 , 320 , 302 , 285 , 269 , 254 , 240, 226,
					   214 , 202 , 190 , 180 , 170 , 160 , 151 , 143 , 135 , 127 , 120, 113,
					   107 , 101 , 95  , 90  , 85  , 80  , 75  , 71  , 67  , 63  , 60 , 56 , 
					   53  ,  50 ,  47 ,  45 ,  42 ,  40 ,  37 ,  35 ,  33 ,  31 ,  30 , 28];

	// Find out the number of channels in this mod.
	switch (Helpers.readString(fileData, 1080, 4)) {
		case "6CHN":
			this.channels = 6;
			break;
		case "FLT8":
		case "8CHN":
		case "CD81":
		case "OKTA":
			this.channels = 8;
			break;
		case "16CN":
			this.channels = 16;
			break;
		case "32CN":
			this.channels = 32;
			break;
		default:
			this.channels = 4;
			break;
	}

	// Load general module info.
	this.name            = Helpers.readString(fileData, 0, 20);
	this.songLength      = fileData[950];
	this.restartPosition = fileData[951];

	// Create samples and add them to the module.
	for (var i = 0; i < 31; i ++) {
		var sampleHeader = fileData.subarray(20 + i * 30, 50 + i * 30);

		var instrument = new Instrument();
		var sample     = new Sample();
		sample.name         = Helpers.readString(sampleHeader, 0, 22);
		sample.sampleLength = Helpers.readWordBE(sampleHeader, 22) * 2;
		sample.fineTune     = sampleHeader[24] & 0x0F;
		sample.volume       = (Math.min(sampleHeader[25], 64.0)) / 64.0;
		sample.loopStart    = Helpers.readWordBE(sampleHeader, 26) * 2;
		sample.loopLength   = Helpers.readWordBE(sampleHeader, 28) * 2;
		sample.loopType     = (sample.loopLength > 1) ? Sample.LoopType.FORWARD : Sample.LoopType.NONE;

		if (sample.fineTune > 7) sample.fineTune -= 16;
		sample.fineTune *= 16;
		if (i == 27 ) sample.fineTune = 8000; //sample 28 faster noise
		
		instrument.name = sample.name;
		instrument.samples.push(sample);
		this.instruments.push(instrument);
	}

	// Fill the order table and get the number of patterns in this mod
	var patternCount = 0;
	for (var i = 0; i < 128; i ++) {
		this.orders[i] = fileData[952 + i];
		patternCount = Math.max(patternCount, this.orders[i] + 1);
	}

	// Load all patterns
	var patternLength = this.channels * 256;
	for (var i = 0; i < patternCount; i ++) {
		var patternHeader = fileData.subarray(1084 + i * patternLength, 1084 + i * patternLength + patternLength);

		// Create pattern and set number of rows and channels.
		var pattern = new Pattern(64, this.channels);

		// Load pattern data.
		for (var r = 0; r < 64; r ++) {
			for (var c = 0; c < this.channels; c ++) {
				var offset = r * this.channels * 4 + c * 4;
				var byte1 = patternHeader[offset];
				var byte2 = patternHeader[offset + 1];
				var byte3 = patternHeader[offset + 2];
				var byte4 = patternHeader[offset + 3];

				// Find the note number corresponding to the period.
				var period = ((byte1 & 0x0F) * 256) | byte2;
				if (c == 3) { // Noise force note to C5
					pattern.note[r][c] = 25;
				} else if (period == 0) {
					pattern.note[r][c] = 0;
				} else if (period > notePeriods[0]) {
					// Prevent notes that are too low.
					pattern.note[r][c] = 1;
				} else if (period <= notePeriods[notePeriods.length - 1]) {
					// Prevent notes that are too high.
					pattern.note[r][c] = 60;
				} else {
					// Find the note that closest matches the period.
					for (var p = 0; p < notePeriods.length - 1; p ++) {
						/*
						if (period <= notePeriods[p] && period > notePeriods[p + 1]) {
							var dLow = period - notePeriods[p];
							var dHi  = notePeriods[p + 1] - period;

							pattern.note[r][c] = (dLow <= dHi) ? p + 1 : p + 2;
							break;
						}
						*/
						if (period == notePeriods[p]) {
							pattern.note[r][c] = p + 1;
							break;
						}
					}
				}

				pattern.instrument[r][c] = (byte1 & 0xF0) | ((byte3 & 0xF0) / 16);
				// GBT Clamp instument ranges.
				if ( pattern.instrument[r][c] !== 0 ) {
					if (c == 2) { // Wave
						pattern.instrument[r][c] = ((pattern.instrument[r][c] - 8 & 7) + 8 );
					}
					else if (c == 3) { // Noise
						pattern.instrument[r][c] = ((pattern.instrument[r][c] - 16 & 15) + 16 );
					}
					else { // Pulse
						pattern.instrument[r][c] = ((pattern.instrument[r][c] - 1 & 3) + 1 );
					}
					//console.log(r + ' chan ' + c + ' inst ' + pattern.instrument[r][c]);
				}
				pattern.volume[r][c]     = -1;

				pattern.effectParam[r][c] = byte4;
				if ((byte3 & 0x0F) == 0 && byte4 != 0) {
					pattern.effect[r][c] = Effects.ARPEGGIO;
				} else if ((byte3 & 0x0F) == 1) {
					pattern.effect[r][c] = Effects.PORTA_UP;
				} else if ((byte3 & 0x0F) == 2) {
					pattern.effect[r][c] = Effects.PORTA_DOWN;
				} else if ((byte3 & 0x0F) == 3) {
					pattern.effect[r][c] = Effects.NONE;//Effects.TONE_PORTA;
				} else if ((byte3 & 0x0F) == 4) {
					pattern.effect[r][c] = Effects.NONE;//Effects.VIBRATO;
				} else if ((byte3 & 0x0F) == 5) {
					pattern.effect[r][c] = Effects.TONE_PORTA_VOL_SLIDE;
				} else if ((byte3 & 0x0F) == 6) {
					pattern.effect[r][c] = Effects.NONE;//Effects.VIBRATO_VOL_SLIDE;
				} else if ((byte3 & 0x0F) == 7) {
					pattern.effect[r][c] = Effects.NONE;//Effects.TREMOLO;
				} else if ((byte3 & 0x0F) == 8) {
					pattern.effect[r][c] = Effects.SET_PAN;
				} else if ((byte3 & 0x0F) == 9) {
					pattern.effect[r][c] = Effects.NONE;//Effects.SAMPLE_OFFSET;
				} else if ((byte3 & 0x0F) == 10) {
					pattern.effect[r][c] = Effects.VOLUME_SLIDE;
				} else if ((byte3 & 0x0F) == 11) {
					pattern.effect[r][c] = Effects.POSITION_JUMP;
				} else if ((byte3 & 0x0F) == 12) {
					pattern.effect[r][c] = Effects.SET_VOLUME;
				} else if ((byte3 & 0x0F) == 13) {
					pattern.effect[r][c] = Effects.PATTERN_BREAK;
				} else if ((byte3 & 0x0F) == 14) {
					switch ((byte4 & 0xF0) >> 4) {
						case 0:
							pattern.effect[r][c] = Effects.SET_FILTER;
							break;
						case 1:
							pattern.effect[r][c] = Effects.NONE;//Effects.FINE_PORTA_UP;
							break;
						case 2:
							pattern.effect[r][c] = Effects.NONE;//Effects.FINE_PORTA_DOWN;
							break;
						case 3:
							pattern.effect[r][c] = Effects.NONE;//Effects.SET_GLISANDO;
							break;
						case 4:
							pattern.effect[r][c] = Effects.NONE;//Effects.SET_VIBRATO;
							break;
						case 5:
							pattern.effect[r][c] = Effects.NONE;//Effects.SET_FINETUNE;
							break;
						case 6:
							pattern.effect[r][c] = Effects.SET_LOOP;
							break;
						case 7:
							pattern.effect[r][c] = Effects.NONE;//Effects.SET_TREMOLO;
							break;
						case 8:
							pattern.effect[r][c] = Effects.SET_PAN_16;
							break;
						case 9:
							pattern.effect[r][c] = Effects.RETRIGGER;
							break;
						case 10:
							pattern.effect[r][c] = Effects.FINE_VOL_SLIDE_UP;
							break;
						case 11:
							pattern.effect[r][c] = Effects.FINE_VOL_SLIDE_DOWN;
							break;
						case 12:
							pattern.effect[r][c] = Effects.CUT_NOTE;
							break;
						case 13:
							pattern.effect[r][c] = Effects.NONE;//Effects.DELAY_NOTE;
							break;
						case 14:
							pattern.effect[r][c] = Effects.DELAY_PATTERN;
							break;
						default:
							pattern.effect[r][c] = Effects.NONE;
							break;
					}
				} else if ((byte3 & 0x0F) == 15) {
					pattern.effect[r][c] = Effects.SET_TEMPO_BPM;
				} else {
					pattern.effect[r][c] = Effects.NONE;
				}
			}
		}

		this.patterns.push(pattern);
	}

	// Load sample data.
	var filePos = patternCount * patternLength + 1084;
	
	for (var i = 0; i < this.instruments.length; i ++) {
		if (i > 14) {
			this.instruments[i].samples[0].loadSample(fileData.subarray(filePos, filePos + this.instruments[i].samples[0].sampleLength), this.signedSample);
		}
		//this.instruments[i].samples[0].sample[0] = 0; // Was causing bad sample data, disabled.
		//console.log(this.instruments[i].samples[0]); // Log sample for hard storage.

		filePos += this.instruments[i].samples[0].sampleLength;
	}
	// Hard store samples for GBT
	this.instruments[0].samples[0] =	{
		"sampleIndex": 0,	"name": "Chans. 1&2 - 25% Duty\u0000",
		"sampleLength": 32,   "loopStart": 0,   "loopLength": 32,   "loopType": 1,   "sampleBits": 0,   "compression": 0,
		"volume": 1,	"panning": 0.5,	"basePeriod": 0,	"fineTune": 38,
		"sample": [
			0.085, 0.482, 0.397, 0.425, 0.355, 0.383, 0.326, 0.383, 0.156, -0.239, -0.183, -0.197, -0.169, -0.183, -0.169, -0.169, -0.155, -0.155, -0.14, -0.14, -0.127, -0.127, -0.112, -0.112, -0.112, -0.112, -0.098, -0.098, -0.085, -0.098, -0.07, -0.112		]
	  };
	  this.instruments[1].samples[0] =	{
		"sampleIndex": 0,	"name": "Chans. 1&2 - 50% Duty\u0000",
		"sampleLength": 32,   "loopStart": 0,   "loopLength": 32,   "loopType": 1,   "sampleBits": 0,   "compression": 0,
		"volume": 1,	"panning": 0.5,	"basePeriod": 0,	"fineTune": 38,
		"sample": [
			-0.248, 0.388, 0.401, 0.388, 0.373, 0.368, 0.364, 0.355, 0.345, 0.34, 0.34, 0.35, 0.34, 0.335, 0.335, 0.317, 0.307, -0.37, -0.37, -0.352, -0.333, -0.323, -0.319, -0.314, -0.3, -0.29, -0.272, -0.262, -0.258, -0.248, -0.239, -0.235		]
	  };
	  this.instruments[2].samples[0] =	{
		"sampleIndex": 0,	"name": "Chans. 1&2 - 75% Duty\u0000",
		"sampleLength": 32,   "loopStart": 0,   "loopLength": 32,   "loopType": 1,   "sampleBits": 0,   "compression": 0,
		"volume": 1,	"panning": 0.5,	"basePeriod": 0,	"fineTune": 38,
		"sample": [
			0.241, 0.17, 0.184, 0.156, 0.17, 0.156, 0.156, 0.142, 0.142, 0.128, 0.128, 0.113, 0.113, 0.099, 0.099, 0.085, 0.099, 0.085, 0.085, 0.071, 0.085, 0.056, 0.099, -0.098, -0.492, -0.408, -0.436, -0.365, -0.394, -0.337, -0.394, -0.169		]
	  };
	  this.instruments[3].samples[0] =	{
		"sampleIndex": 0,	"name": "Chans.1&2 - 12.5% Duty",
		"sampleLength": 32,   "loopStart": 0,   "loopLength": 32,   "loopType": 1,   "sampleBits": 0,   "compression": 0,
		"volume": 1,	"panning": 0.5,	"basePeriod": 0,	"fineTune": 38,
		"sample": [
			0.227, 0.539, 0.397, 0.496, 0.128, -0.155, -0.098, -0.112, -0.098, -0.098, -0.085, -0.098, -0.085, -0.085, -0.07, -0.085, -0.07, -0.07, -0.07, -0.07, -0.056, -0.056, -0.056, -0.056, -0.056, -0.056, -0.042, -0.056, -0.042, -0.056, -0.028, -0.085		]
	  };
	  for (var i = 4; i < 7; i ++)	{
		this.instruments[i].samples[0] = {
			"sampleIndex": 0,   "name": "[UNUSED]",
			"sampleLength": 0,   "loopStart": 0,   "loopLength": 2,   "loopType": 1,   "sampleBits": 0,   "compression": 0,
			"volume": 1,   "panning": 0.5,   "basePeriod": 0,   "fineTune": 0,   "sample": []
		};
	  }
	  this.instruments[7].samples[0] =	{
		"sampleIndex": 0,
		"name": "Channel 3 - Waveform 1",
		"sampleLength": 64,   "loopStart": 0,   "loopLength": 64,   "loopType": 1,   "sampleBits": 0,   "compression": 0,
		"volume": 1,		"panning": 0.5,		"basePeriod": 0,		"fineTune": 16,		"sample": [
		  0.142,  0.165,  0.213,  0.213,  0.047,  0.024,  0.071,  0.071,  -0.094,  -0.094,  -0.141,  -0.164,  -0.305,  -0.305,  -0.375,  -0.398,  -0.422,  -0.398,  0.236,  0.307,  0.213,  0.213,  0.142,  0.142,  0.283,  0.307,  0.331,  0.307,  -0.117,  -0.164,  -0.445,  -0.492,  -0.398,  -0.375,  0.142,  0.236,  0.236,  0.26,  0.118,  0.094,  -0.398,  -0.469,  -0.281,  -0.258,  0.047,  0.118,  -0.211,  -0.258,  0.118,  0.189,  -0.094,  -0.141,  0.283,  0.354,  0.024,  -0.047,  0.213,  0.26,  0.094,  0.047,  0.283,  0.354,  -0.305,  -0.445
		]
	  };
	  this.instruments[8].samples[0] =	{
		"sampleIndex": 0,
		"name": "Channel 3 - Waveform 2",
		"sampleLength": 64,   "loopStart": 0,   "loopLength": 64,   "loopType": 1,   "sampleBits": 0,   "compression": 0,
		"volume": 1,		"panning": 0.5,		"basePeriod": 0,		"fineTune": 16,		"sample": [
		  0,  0.024,  -0.07,  -0.094,  0.047,  0.094,  -0.094,  -0.164,  0.071,  0.165,  -0.117,  -0.234,  0.094,  0.236,  -0.141,  -0.305,  0.118,  0.307,  -0.164,  -0.375,  0.142,  0.378,  -0.187,  -0.445,  0.165,  0.449,  -0.187,  -0.539,  0.189,  0.496,  0.378,  0.472,  -0.211,  -0.562,  0.118,  0.425,  -0.187,  -0.492,  0.071,  0.378,  -0.141,  -0.422,  0.047,  0.307,  -0.117,  -0.328,  0.047,  0.236,  -0.094,  -0.258,  0.024,  0.165,  -0.07,  -0.187,  0,  0.094,  -0.047,  -0.117,  -0.023,  0.024,  -0.023,  -0.047,  -0.023,  -0.047
		]
	  };
	  this.instruments[9].samples[0] =	{
		"sampleIndex": 0,
		"name": "Channel 3 - Waveform 3",
		"sampleLength": 64,   "loopStart": 0,   "loopLength": 64,   "loopType": 1,   "sampleBits": 0,   "compression": 0,
		"volume": 1,		"panning": 0.5,		"basePeriod": 0,		"fineTune": 16,		"sample": [
		  0.378,  0.614,  0.425,  0.402,  0.402,  0.449,  0.307,  0.26,  0.307,  0.307,  0.189,  0.165,  0.189,  0.213,  0.118,  0.071,  0.118,  0.142,  0.024,  0,  0.047,  0.071,  -0.023,  -0.07,  -0.023,  0,  -0.094,  -0.117,  -0.07,  -0.047,  -0.117,  -0.164,  -0.117,  -0.094,  -0.023,  0.047,  -0.094,  -0.164,  -0.07,  0,  -0.141,  -0.211,  -0.094,  -0.047,  -0.164,  -0.234,  -0.141,  -0.07,  -0.211,  -0.281,  -0.164,  -0.117,  -0.234,  -0.305,  -0.187,  -0.141,  -0.234,  -0.328,  -0.211,  -0.164,  -0.258,  -0.352,  -0.187,  -0.234
		]
	  };
	  this.instruments[10].samples[0] =	{
		"sampleIndex": 0,
		"name": "Channel 3 - Waveform 4",
		"sampleLength": 64,   "loopStart": 0,   "loopLength": 64,   "loopType": 1,   "sampleBits": 0,   "compression": 0,
		"volume": 1,		"panning": 0.5,		"basePeriod": 0,		"fineTune": 16,		"sample": [
		  0.236,  0.52,  0.449,  0.496,  0.472,  0.52,  0.402,  0.402,  0.331,  0.307,  0.236,  0.213,  0.165,  0.142,  0.094,  0.071,  0.047,  0,  0.047,  0.071,  0.047,  0.071,  0.024,  0,  -0.047,  -0.07,  -0.094,  -0.117,  -0.094,  -0.117,  -0.094,  -0.094,  -0.07,  -0.023,  -0.047,  -0.023,  -0.047,  -0.023,  -0.07,  -0.094,  -0.117,  -0.141,  -0.164,  -0.187,  -0.164,  -0.164,  -0.117,  -0.094,  -0.117,  -0.141,  -0.164,  -0.187,  -0.211,  -0.234,  -0.234,  -0.281,  -0.281,  -0.328,  -0.305,  -0.375,  -0.258,  -0.281,  -0.187,  -0.234
		]
	  };
	  this.instruments[11].samples[0] =	{
		"sampleIndex": 0,
		"name": "Channel 3 - Waveform 5",
		"sampleLength": 64,   "loopStart": 0,   "loopLength": 64,   "loopType": 1,   "sampleBits": 0,   "compression": 0,
		"volume": 1,		"panning": 0.5,		"basePeriod": 0,		"fineTune": 16,		"sample": [
		  0.402,  0.26,  0.26,  0.189,  0.165,  0.118,  0.094,  0.071,  0.024,  0.047,  0.071,  0.094,  0.142,  0.142,  0.189,  0.189,  0.236,  0.213,  0.283,  0.213,  0.189,  0.118,  0.118,  0.047,  0.071,  -0.164,  -0.516,  -0.445,  -0.516,  -0.469,  -0.539,  -0.469,  -0.586,  -0.281,  0.118,  0.094,  0.142,  0.142,  0.189,  0.189,  0.236,  0.213,  0.26,  0.26,  0.307,  0.236,  0.213,  0.165,  0.142,  0.094,  0.071,  0.024,  0,  -0.023,  -0.023,  -0.234,  -0.68,  -0.539,  -0.539,  -0.445,  -0.445,  -0.352,  -0.375,  -0.117
		]
	  };
	  this.instruments[12].samples[0] =	{
		"sampleIndex": 0,
		"name": "Channel 3 - Waveform 6",
		"sampleLength": 64,   "loopStart": 0,   "loopLength": 64,   "loopType": 1,   "sampleBits": 0,   "compression": 0,
		"volume": 1,		"panning": 0.5,		"basePeriod": 0,		"fineTune": 16,		"sample": [
		  0.378,  0.661,  0.543,  0.567,  0.472,  0.449,  0.402,  0.425,  0.331,  0.307,  0.283,  0.283,  0.236,  0.213,  0.189,  0.189,  0.142,  0.118,  0.094,  0.118,  0.047,  0.024,  0.024,  0.047,  0,  -0.023,  -0.023,  -0.023,  -0.07,  -0.094,  -0.07,  -0.07,  -0.117,  -0.141,  -0.117,  -0.117,  -0.141,  -0.164,  -0.164,  -0.141,  -0.187,  -0.211,  -0.187,  -0.187,  -0.211,  -0.234,  -0.211,  -0.211,  -0.234,  -0.258,  -0.234,  -0.234,  -0.234,  -0.281,  -0.234,  -0.234,  -0.258,  -0.281,  -0.258,  -0.258,  -0.258,  -0.328,  -0.234,  -0.328
		]
	  };
	  this.instruments[13].samples[0] =	{
		"sampleIndex": 0,
		"name": "Channel 3 - Waveform 7",
		"sampleLength": 64,   "loopStart": 0,   "loopLength": 64,   "loopType": 1,   "sampleBits": 0,   "compression": 0,
		"volume": 1,		"panning": 0.5,		"basePeriod": 0,		"fineTune": 16,		"sample": [
		  0.425, 0.732, 0.591, 0.638, 0.567, 0.567, 0.52, 0.52, 0.472, 0.472, 0.425, 0.425, 0.402, 0.402, 0.354, 0.354, 0.331, 0.331, 0.307, 0.307, 0.283, 0.283, 0.236, 0.26, 0.213, 0.236, 0.189, 0.213, 0.165, 0.213, 0.142, 0.236, -0.398, -0.75, -0.609, -0.656, -0.586, -0.586, -0.539, -0.539, -0.492, -0.492, -0.445, -0.445, -0.422, -0.422, -0.375, -0.375, -0.352, -0.352, -0.328, -0.328, -0.281, -0.305, -0.258, -0.281, -0.234, -0.258, -0.211, -0.234, -0.187, -0.234, -0.164, -0.258
		]
	  };
	  this.instruments[14].samples[0] =	{
		"sampleIndex": 0,
		"name": "Channel 3 - Waveform 8",
		"sampleLength": 64,   "loopStart": 0,   "loopLength": 64,   "loopType": 1,   "sampleBits": 0,   "compression": 0,
		"volume": 1,		"panning": 0.5,		"basePeriod": 0,		"fineTune": 16,		"sample": [
		  0, 0.024, 0.094, 0.142, 0.189, 0.236, 0.283, 0.354, 0.331, 0.378, 0.354, 0.402, 0.378, 0.425, 0.378, 0.378, 0.378, 0.402, 0.378, 0.378, 0.331, 0.354, 0.283, 0.26, 0.213, 0.236, 0.189, 0.165, 0.118, 0.094, 0.047, 0.024, -0.047, -0.094, -0.141, -0.211, -0.234, -0.305, -0.305, -0.352, -0.328, -0.375, -0.375, -0.398, -0.398, -0.422, -0.398, -0.398, -0.375, -0.422, -0.375, -0.375, -0.352, -0.352, -0.305, -0.258, -0.234, -0.258, -0.187, -0.164, -0.117, -0.094, -0.07, -0.023
		]
	  };
};
ModModule.prototype = Object.create(Module.prototype);


module.exports = ModModule;
