"use strict";

/**
 * Module.js
 *
 * Module defines a generic ScripTracker module regardless of the module type. The various loaders should take care of
 * filling a module with correct data so that it is usable by ScripTracker.
 *
 * Author:  		Maarten Janssen
 * Date:    		2013-02-14
 * Last updated:	2015-07-22
 */
var Module = function() {
	this.name = "";						// Name of this song
	this.type = null;					// Module type (mod, s3m, it, xm)

	this.songLength      = 0;			// Number of orders in the order table
	this.restartPosition = 0;			// Index in order table to jump to at song end
	this.orders          = [];			// Order table

	this.channels     = 0;				// Number of channels in this module
	this.patternCount = 0;				// Number of patterns in this module
	this.patterns     = [];				// Patterns used in this module

	this.instrumentCount = 0;			// Number of instruments in this module
	this.instruments     = [];			// Instruments used in this module
	this.signedSample    = true;		// Is sample data signed or unsigned

	this.defaultTempo  = 6;				// Default number of ticks per row
	this.defaultBPM    = 125;			// Default BPM
	this.defaultVolume = 1.0;			// Default global volume
};


Module.Types = {
	MOD: "mod",
	S3M: "s3m",
	IT:  "it",
	XM:  "xm"
};


module.exports = Module;
