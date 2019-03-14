"use strict";

var Envelope = require("./envelope");

/**
 * Instrument.js
 *
 * Instrument holds all instrument data such as samples and envelopes.
 *
 * Author:  		Maarten Janssen
 * Date:    		2013-05-16
 * Last updated:	2015-07-22
 */
var Instrument = function () {
	this.name       = "";							// Name of the instrument (not used, player uses sample names).
	this.type       = 0;							// Instrument type (?).
	this.numSamples = 0;							// Number of samples in this instrument.
	
	this.sampleKeyMap = [];							// Note --> sample index mapping.
	this.samples      = [];							// List of samples used in this Instrument.
	
	this.volumeEnvelope  = new Envelope();			// Default empty volume envelope.
	this.panningEnvelope = new Envelope();			// Default empty panning envelope.
	
	// Assign sample[0] to each note.
	for (var i = 0; i < 96; i ++) {
		this.sampleKeyMap.push(0);
	}
}


module.exports = Instrument;
