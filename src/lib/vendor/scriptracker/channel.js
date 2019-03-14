"use strict";

/**
 * Channel.js
 *
 * Holds all channel registers used during playback.
 *
 * Author:  		Maarten Janssen
 * Date:    		2015-07-22
 * Last updated:	2015-07-22
 */
var Channel = function() {
	this.instrument = 0;			// Currently active instrument index.
	this.sample = {
		sample:   null,				// Sample object used on this channel.
		position: 0,				// Sample position.
		restart:  0,				// Sample restart position. Can be altered by sample offset effect.
		step:     0,				// Sample position delta.
		remain:   0,				// Amount af sample data remaining.
		reversed: false				// Sample playback is reversed.
	};
	this.volume = {
		channelVolume: 0,			// Current channel volume.
		sampleVolume:  0,			// Current volume of instrument sample.
		volumeSlide:   0,			// Volume delta per tick.
		envelope:      null,		// Volume envelope function object
	};
	this.panning = {
		pan:         0.5,			// Current panning of this channel.
		panSlide:    0,				// Pannning delta per tick
		envelope:    null,			// Panning envelope function object.
	};
	this.porta = {
		notePeriod: 0,				// Period of note to porta to.
		step:       0				// Note porta delta period on each tick.
	};
	this.vibrato = {
		position:  0,				// Vibrato function position.
		step:      0,				// Vibrato step per tick.
		amplitude: 0				// Vibrato function amplitude.
	};
	this.tremolo = {
		position:  0,				// Tremolo function position.
		step:      0,				// Tremolo step per tick.
		amplitude: 0,				// Tremolo function amplitude.
		volume:    1
	};
	this.tremor = {
		onCount:  0,				// Number of ticks channel produces sound.
		offCount: 0,				// Number of ticks channel is muted.
		muted:    false				// Channel is currently muted by tremor effect.
	}
	this.isMuted      = false;			// Channel is muted.
	this.note         = 0;				// Index of the note being played on this channel.
	this.period       = 0;				// Current period of this channel.
	this.noteDelay    = 0;				// Number of ticks to delay note start.
	this.loopMark     = 0;				// Row to jump back to when looping a pattern section.
	this.loopCount    = 0;				// Loop section counter.
	this.tremorCount  = 0;				// Number of ticks before tremor effect mutes channel.
	this.envelopePos  = 0;				// Panning anv volume envelope positions.
	this.noteReleased = false;			// Note release marker for envelopes.
};


Channel.prototype.reset = function() {
	this.sample.sample   = null;
	this.sample.position = 0;
	this.sample.restart  = 0;
	this.sample.step     = 0;
	this.sample.remain   = 0;
	this.sample.reversed = false;
	
	this.volume.channelVolume = 0;
	this.volume.sampleVolume  = 0;
	this.volume.volumeSlide   = 0;
	this.volume.envelope      = null;
	
	this.panning.pan      = 0.5;
	this.panning.panSlide = 0;
	this.panning.envelope = null;
	
	this.porta.notePeriod = 0;
	this.porta.step       = 0;
	
	this.vibrato.position  = 0;
	this.vibrato.step      = 0;
	this.vibrato.amplitude = 0;
	
	this.tremolo.position  = 0;
	this.tremolo.step      = 0;
	this.tremolo.amplitude = 0;
	this.tremolo.volume    = 1;
	
	this.tremor.onCount  = 0;
	this.tremor.offCount = 0;
	this.tremor.muted    = false;
	
	this.isMuted      = false;
	this.tremorMute   = false;
	this.note         = 0;
	this.period       = 0;
	this.noteDelay    = 0;
	this.loopMark     = 0;
	this.loopCount    = 0;
	this.envelopePos  = 0;
	this.noteReleased = false;
};


module.exports = Channel;
