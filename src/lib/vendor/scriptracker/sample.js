"use strict";

var Helpers = require("./helpers");

/**
 * Sample.js
 *
 * Sample defines a generic ScripTracker sample regardless of the module type. The various loaders should take care of
 * filling a sample with correct data so that it is usable by ScripTracker.
 *
 * Author:  		Maarten Janssen
 * Date:    		2013-02-14
 * Last updated:	2015-07-22
 */
var Sample = function () {
	this.sampleIndex = 0;				// Index of this sample used by the module
	this.name        = "";				// Name of this sample

	this.sampleLength = 0;				// Length of this sample
	this.loopStart    = 0;				// Start position for sample looping if enabled
	this.loopLength   = 0;				// Length of sample loop mesaured from start if enabled
	this.loopType     = Sample.LoopType.NONE;
	this.sampleBits   = Sample.Bits.FORMAT_8BIT;
	this.compression  = Sample.Compression.UNCOMPRESSED;

	this.volume  = 1.0;					// Default volume of this sample
	this.panning = 0.5;					// Default volume multiplication factor for channels

	this.basePeriod = 0;				// Base period of this sample
	this.fineTune   = 0;				// Finetune of this sample

	this.sample = [];					// Sample data stored a an array of floats [-1.0, 1.0]
};


/**
 * Load normal uncompressed sample data.
 */
Sample.prototype.loadSample = function(sampleData, signed) {
	this.sample = [];

	var is16Bit = this.sampleBits === Sample.Bits.FORMAT_16BIT;
	var val = 0.0;

	for (var i = 0; i < this.sampleLength; i ++) {
		if (!is16Bit) {
			var val8 = sampleData[i];

			if (signed) {
				val = (val8 < 128) ? val8 / 127 : -((val8 ^ 0xFF) + 1) / 128;
			} else {
				val = (val8 / 128.0) - 1.0;
			}
		} else {
			var val16 = Helpers.readWord(sampleData, i * 2);
			i ++;

			if (signed) {
				val = (val16 < 32768) ? val16 / 32767 : -((val16 ^ 0xFFFF) + 1) / 32768;
			} else {
				val = (val16 / 32768.0) - 1.0;
			}
		}

		this.sample.push (val);
	}
};


/**
 * Load a stereo sample and convert it to mono.
 */
Sample.prototype.loadStereoSample = function(sampleData, signed) {
	var is16Bit = this.sampleBits === Sample.Bits.FORMAT_16BIT;
	this.loadSample(sampledata.subarray(0, this.sampleLength * (is16Bit) ? 2 : 1), is16Bit, signed);
	var sampleL = this.sample;
	this.loadSample(sampledata.subarray(this.sampleLength * (is16Bit) ? 2 : 1), is16Bit, signed);
	var sampleR = this.sample;

	this.sample = [];
	for (var i = 0; i < this.sampleLength; i ++) {
		this.sample.push((sampleL[i] + sampleR[i]) / 2.0);
	}
};


/**
 * Load sample data from delta values.
 */
Sample.prototype.loadDeltaSample = function(sampleData) {
	this.sample = [];

	var is16Bit = this.sampleBits === Sample.Bits.FORMAT_16BIT;
	var val = 0;

	for (var i = 0; i < this.sampleLength; i ++) {
		if (!is16Bit) {
			val = (val + sampleData[i]) % 256;
			if (val > 127) {
				this.sample.push((256 - val) / -128);
			} else {
				this.sample.push(val / 128);
			}
		} else {
			val = (val + Helpers.readWord(sampleData, i ++)) % 65536;
			if (val > 32767) {
				this.sample.push(-(65536 - val) / 32768);
			} else {
				this.sample.push(val / 32768);
			}
		}
	}
};


/**
 * Decode an ADPCM sample to regular uncompressed sample data.
 */
Sample.prototype.loadAdpcmSample = function(sampleData) {
	this.sample = [];

	var is16Bit = this.sampleBits === Sample.Bits.FORMAT_16BIT;
	var compression = [];

	// Fill the compression table.
	for (var i = 0; i < 16; i ++) {
		if (!is16Bit) {
			var val8 = sampleData[i];
			compression[i] = (val8 < 128) ? val8 / 127 : -((val8 ^ 0xFF) + 1) / 128;
		} else {
			var val16 = Helpers.readWord(sampleData, i ++);
			compression[i] = (val16 < 32768) ? val16 / 32767 : -((val16 ^ 0xFFFF) + 1) / 32768;
		}
	}

	// Decode samples.
	var val = 0.0;
	for (var i = 0; i < Math.floor(this.sampleLength / 2); i ++) {
		val += compression[sampleData[i + (is16Bit) ? 32 : 16] & 0x0F];
		this.sample.push(val);
		val += compression[sampleData[i + (is16Bit) ? 32 : 16] >> 4];
		this.sample.push(val);
	}
};


Sample.LoopType = {
	NONE:     0,
	FORWARD:  1,
	PINGPONG: 2
};


Sample.Bits = {
	FORMAT_8BIT:  0,
	FORMAT_16BIT: 1
};


Sample.Compression = {
	UNCOMPRESSED: 0,
	DELTA:        1,
	ADPCM:        2
};


module.exports = Sample;
