//2010-2013 Grant Galitz - XAudioJS realtime audio output compatibility library:
var XAudioJSscriptsHandle = document.getElementsByTagName("script");
var XAudioJSsourceHandle = XAudioJSscriptsHandle[XAudioJSscriptsHandle.length-1].src;
function XAudioServer(channels, sampleRate, minBufferSize, maxBufferSize, underRunCallback, volume, failureCallback) {
	XAudioJSChannelsAllocated = Math.max(channels, 1);
	this.XAudioJSSampleRate = Math.abs(sampleRate);
	XAudioJSMinBufferSize = (minBufferSize >= (XAudioJSSamplesPerCallback * XAudioJSChannelsAllocated) && minBufferSize < maxBufferSize) ? (minBufferSize & (-XAudioJSChannelsAllocated)) : (XAudioJSSamplesPerCallback * XAudioJSChannelsAllocated);
	XAudioJSMaxBufferSize = (Math.floor(maxBufferSize) > XAudioJSMinBufferSize + XAudioJSChannelsAllocated) ? (maxBufferSize & (-XAudioJSChannelsAllocated)) : (XAudioJSMinBufferSize * XAudioJSChannelsAllocated);
	this.underRunCallback = (typeof underRunCallback == "function") ? underRunCallback : function () {};
	XAudioJSVolume = (volume >= 0 && volume <= 1) ? volume : 1;
	this.failureCallback = (typeof failureCallback == "function") ? failureCallback : function () { throw(new Error("XAudioJS has encountered a fatal error.")); };
	this.initializeAudio();
}
XAudioServer.prototype.MOZWriteAudioNoCallback = function (buffer) {
    //Resample before passing to the moz audio api:
    var bufferLength  = buffer.length;
    for (var bufferIndex = 0; bufferIndex < bufferLength;) {
        var sliceLength = Math.min(bufferLength - bufferIndex, XAudioJSMaxBufferSize);
        for (var sliceIndex = 0; sliceIndex < sliceLength; ++sliceIndex) {
            XAudioJSAudioContextSampleBuffer[sliceIndex] = buffer[bufferIndex++];
        }
        var resampleLength = XAudioJSResampleControl.resampler(XAudioJSGetArraySlice(XAudioJSAudioContextSampleBuffer, sliceIndex));
        if (resampleLength > 0) {
            var resampledResult = XAudioJSResampleControl.outputBuffer;
            var resampledBuffer = XAudioJSGetArraySlice(resampledResult, resampleLength);
            this.samplesAlreadyWritten += this.audioHandleMoz.mozWriteAudio(resampledBuffer);
        }
    }
}
XAudioServer.prototype.callbackBasedWriteAudioNoCallback = function (buffer) {
	//Callback-centered audio APIs:
	var length = buffer.length;
	for (var bufferCounter = 0; bufferCounter < length && XAudioJSAudioBufferSize < XAudioJSMaxBufferSize;) {
		XAudioJSAudioContextSampleBuffer[XAudioJSAudioBufferSize++] = buffer[bufferCounter++];
	}
}
/*Pass your samples into here!
Pack your samples as a one-dimenional array
With the channel samples packed uniformly.
examples:
    mono - [left, left, left, left]
    stereo - [left, right, left, right, left, right, left, right]
*/
XAudioServer.prototype.writeAudio = function (buffer) {
	switch (this.audioType) {
		case 0:
			this.MOZWriteAudioNoCallback(buffer);
			this.MOZExecuteCallback();
			break;
		case 2:
			this.checkFlashInit();
		case 1:
		case 3:
			this.callbackBasedWriteAudioNoCallback(buffer);
			this.callbackBasedExecuteCallback();
			break;
		default:
			this.failureCallback();
	}
}
/*Pass your samples into here if you don't want automatic callback calling:
Pack your samples as a one-dimenional array
With the channel samples packed uniformly.
examples:
    mono - [left, left, left, left]
    stereo - [left, right, left, right, left, right, left, right]
Useful in preventing infinite recursion issues with calling writeAudio inside your callback.
*/
XAudioServer.prototype.writeAudioNoCallback = function (buffer) {
	switch (this.audioType) {
		case 0:
			this.MOZWriteAudioNoCallback(buffer);
			break;
		case 2:
			this.checkFlashInit();
		case 1:
		case 3:
			this.callbackBasedWriteAudioNoCallback(buffer);
			break;
		default:
			this.failureCallback();
	}
}
//Developer can use this to see how many samples to write (example: minimum buffer allotment minus remaining samples left returned from this function to make sure maximum buffering is done...)
//If null is returned, then that means metric could not be done.
XAudioServer.prototype.remainingBuffer = function () {
	switch (this.audioType) {
		case 0:
			return Math.floor((this.samplesAlreadyWritten - this.audioHandleMoz.mozCurrentSampleOffset()) * XAudioJSResampleControl.ratioWeight / XAudioJSChannelsAllocated) * XAudioJSChannelsAllocated;
		case 2:
			this.checkFlashInit();
		case 1:
		case 3:
			return (Math.floor((XAudioJSResampledSamplesLeft() * XAudioJSResampleControl.ratioWeight) / XAudioJSChannelsAllocated) * XAudioJSChannelsAllocated) + XAudioJSAudioBufferSize;
		default:
			this.failureCallback();
			return null;
	}
}
XAudioServer.prototype.MOZExecuteCallback = function () {
	//mozAudio:
	var samplesRequested = XAudioJSMinBufferSize - this.remainingBuffer();
	if (samplesRequested > 0) {
		this.MOZWriteAudioNoCallback(this.underRunCallback(samplesRequested));
	}
}
XAudioServer.prototype.callbackBasedExecuteCallback = function () {
	//WebKit /Flash Audio:
	var samplesRequested = XAudioJSMinBufferSize - this.remainingBuffer();
	if (samplesRequested > 0) {
		this.callbackBasedWriteAudioNoCallback(this.underRunCallback(samplesRequested));
	}
}
//If you just want your callback called for any possible refill (Execution of callback is still conditional):
XAudioServer.prototype.executeCallback = function () {
	switch (this.audioType) {
		case 0:
			this.MOZExecuteCallback();
			break;
		case 2:
			this.checkFlashInit();
		case 1:
		case 3:
			this.callbackBasedExecuteCallback();
			break;
		default:
			this.failureCallback();
	}
}
//DO NOT CALL THIS, the lib calls this internally!
XAudioServer.prototype.initializeAudio = function () {
    try {
        this.initializeMozAudio();
    }
    catch (error) {
        try {
            this.initializeWebAudio();
        }
        catch (error) {
            try {
                this.initializeMediaStream();
            }
            catch (error) {
                try {
                    this.initializeFlashAudio();
                }
                catch (error) {
                    this.audioType = -1;
                    this.failureCallback();
                }
            }
        }
    }
}
XAudioServer.prototype.initializeMediaStream = function () {
	this.audioHandleMediaStream = new Audio();
	this.resetCallbackAPIAudioBuffer(XAudioJSMediaStreamSampleRate);
	if (XAudioJSMediaStreamWorker) {
		//WebWorker is not GC'd, so manually collect it:
		XAudioJSMediaStreamWorker.terminate();
	}
	XAudioJSMediaStreamWorker = new Worker(XAudioJSsourceHandle.substring(0, XAudioJSsourceHandle.length - 3) + "MediaStreamWorker.js");
	this.audioHandleMediaStreamProcessing = new ProcessedMediaStream(XAudioJSMediaStreamWorker, XAudioJSMediaStreamSampleRate, XAudioJSChannelsAllocated);
	this.audioHandleMediaStream.src = this.audioHandleMediaStreamProcessing;
	this.audioHandleMediaStream.volume = XAudioJSVolume;
	XAudioJSMediaStreamWorker.onmessage = XAudioJSMediaStreamPushAudio;
	XAudioJSMediaStreamWorker.postMessage([1, XAudioJSResampleBufferSize, XAudioJSChannelsAllocated]);
	this.audioHandleMediaStream.play();
	this.audioType = 3;
}
XAudioServer.prototype.initializeMozAudio = function () {
    this.audioHandleMoz = new Audio();
	this.audioHandleMoz.mozSetup(XAudioJSChannelsAllocated, XAudioJSMozAudioSampleRate);
	this.audioHandleMoz.volume = XAudioJSVolume;
	this.samplesAlreadyWritten = 0;
	this.audioType = 0;
	//if (navigator.platform != "MacIntel" && navigator.platform != "MacPPC") {
		//Add some additional buffering space to workaround a moz audio api issue:
		var bufferAmount = (this.XAudioJSSampleRate * XAudioJSChannelsAllocated / 10) | 0;
		bufferAmount -= bufferAmount % XAudioJSChannelsAllocated;
		this.samplesAlreadyWritten -= bufferAmount;
	//}
    this.initializeResampler(XAudioJSMozAudioSampleRate);
}
XAudioServer.prototype.initializeWebAudio = function () {
	if (!XAudioJSWebAudioLaunchedContext) {
        try {
            XAudioJSWebAudioContextHandle = new AudioContext();								//Create a system audio context.
        }
        catch (error) {
            XAudioJSWebAudioContextHandle = new webkitAudioContext();							//Create a system audio context.
        }
        XAudioJSWebAudioLaunchedContext = true;
    }
    if (XAudioJSWebAudioAudioNode) {
        XAudioJSWebAudioAudioNode.disconnect();
        XAudioJSWebAudioAudioNode.onaudioprocess = null;
        XAudioJSWebAudioAudioNode = null;
    }
	//Android chrome exception has stuttery audio, firefox android is fine with 2048
	if (navigator.userAgent.includes("Android") && navigator.userAgent.includes("Chrome")) {
		XAudioJSSamplesPerCallback = 4096;
	}
    try {
        XAudioJSWebAudioAudioNode = XAudioJSWebAudioContextHandle.createScriptProcessor(XAudioJSSamplesPerCallback, 0, XAudioJSChannelsAllocated);	//Create the js event node.
    }
    catch (error) {
        XAudioJSWebAudioAudioNode = XAudioJSWebAudioContextHandle.createJavaScriptNode(XAudioJSSamplesPerCallback, 0, XAudioJSChannelsAllocated);	//Create the js event node.
    }
	XAudioJSWebAudioAudioNode.onaudioprocess = XAudioJSWebAudioEvent;
	var gainNode = XAudioJSWebAudioContextHandle.createGain();
	XAudioJSWebAudioAudioNode.connect(gainNode); //Connect the audio processing event to a handling function so we can manipulate output
	//Connect the audio processing event to a handling function so we can manipulate output
	gainNode.connect(XAudioJSWebAudioContextHandle.destination);
	// Ramp up gain to avoid pop when initialised, these can be relaxed/removed with the fixed dc offset in GameBoyCore.js no longer popping
	gainNode.gain.value = 0.2;
	gainNode.gain.exponentialRampToValueAtTime(
	  1,
	  XAudioJSWebAudioContextHandle.currentTime + 0.5
	);
  
	document.addEventListener("visibilitychange", function(event) {
	  if (document.hidden) {
		// Ramp down gain to avoid pop when switching tab away
		gainNode.gain.exponentialRampToValueAtTime(
		  0.0001,
		  XAudioJSWebAudioContextHandle.currentTime + 0.5
		);
	  } else {
		// Ramp up gain to avoid pop when switching back to tab
		gainNode.gain.exponentialRampToValueAtTime(
		  1,
		  XAudioJSWebAudioContextHandle.currentTime + 0.5
		);
	  }
	});
	
    this.resetCallbackAPIAudioBuffer(XAudioJSWebAudioContextHandle.sampleRate);
    this.audioType = 1;
    /*
     Firefox has a bug in its web audio implementation...
     The node may randomly stop playing on Mac OS X for no
     good reason. Keep a watchdog timer to restart the failed
     node if it glitches. Google Chrome never had this issue.
     */
    XAudioJSWebAudioWatchDogLast = (new Date()).getTime();
    if (navigator.userAgent.indexOf('Gecko/') > -1) {
        if (XAudioJSWebAudioWatchDogTimer) {
            clearInterval(XAudioJSWebAudioWatchDogTimer);
        }
        var parentObj = this;
        XAudioJSWebAudioWatchDogTimer = setInterval(function () {
            var timeDiff = (new Date()).getTime() - XAudioJSWebAudioWatchDogLast;
            if (timeDiff > 500) {
                parentObj.initializeWebAudio();
            }
        }, 500);
    }
}
XAudioServer.prototype.initializeFlashAudio = function () {
	var existingFlashload = document.getElementById("XAudioJS");
	this.flashInitialized = false;
	this.resetCallbackAPIAudioBuffer(44100);
	switch (XAudioJSChannelsAllocated) {
		case 1:
			XAudioJSFlashTransportEncoder = XAudioJSGenerateFlashMonoString;
			break;
		case 2:
			XAudioJSFlashTransportEncoder = XAudioJSGenerateFlashStereoString;
			break;
		default:
			XAudioJSFlashTransportEncoder = XAudioJSGenerateFlashSurroundString;
	}
	if (existingFlashload == null) {
		this.audioHandleFlash = null;
		var thisObj = this;
		var mainContainerNode = document.createElement("div");
		mainContainerNode.setAttribute("style", "position: fixed; bottom: 0px; right: 0px; margin: 0px; padding: 0px; border: none; width: 8px; height: 8px; overflow: hidden; z-index: -1000; ");
		var containerNode = document.createElement("div");
		containerNode.setAttribute("style", "position: static; border: none; width: 0px; height: 0px; visibility: hidden; margin: 8px; padding: 0px;");
		containerNode.setAttribute("id", "XAudioJS");
		mainContainerNode.appendChild(containerNode);
		document.getElementsByTagName("body")[0].appendChild(mainContainerNode);
		swfobject.embedSWF(
			XAudioJSsourceHandle.substring(0, XAudioJSsourceHandle.length - 9) + "JS.swf",
			"XAudioJS",
			"8",
			"8",
			"9.0.0",
			"",
			{},
			{"allowscriptaccess":"always"},
			{"style":"position: static; visibility: hidden; margin: 8px; padding: 0px; border: none"},
			function (event) {
				if (event.success) {
					thisObj.audioHandleFlash = event.ref;
					thisObj.checkFlashInit();
				}
				else {
					thisObj.failureCallback();
					thisObj.audioType = -1;
				}
			}
		);
	}
	else {
		this.audioHandleFlash = existingFlashload;
		this.checkFlashInit();
	}
	this.audioType = 2;
}
XAudioServer.prototype.changeVolume = function (newVolume) {
	if (newVolume >= 0 && newVolume <= 1) {
		XAudioJSVolume = newVolume;
		switch (this.audioType) {
			case 0:
				this.audioHandleMoz.volume = XAudioJSVolume;
			case 1:
				break;
			case 2:
				if (this.flashInitialized) {
					this.audioHandleFlash.changeVolume(XAudioJSVolume);
				}
				else {
					this.checkFlashInit();
				}
				break;
			case 3:
				this.audioHandleMediaStream.volume = XAudioJSVolume;
				break;
			default:
				this.failureCallback();
		}
	}
}
//Checks to see if the NPAPI Adobe Flash bridge is ready yet:
XAudioServer.prototype.checkFlashInit = function () {
	if (!this.flashInitialized) {
		try {
			if (this.audioHandleFlash && this.audioHandleFlash.initialize) {
				this.flashInitialized = true;
				this.audioHandleFlash.initialize(XAudioJSChannelsAllocated, XAudioJSVolume);
			}
		}
		catch (error) {
			this.flashInitialized = false;
		}
	}
}
//Set up the resampling:
XAudioServer.prototype.resetCallbackAPIAudioBuffer = function (APISampleRate) {
	XAudioJSAudioBufferSize = XAudioJSResampleBufferEnd = XAudioJSResampleBufferStart = 0;
    this.initializeResampler(APISampleRate);
    XAudioJSResampledBuffer = this.getFloat32(XAudioJSResampleBufferSize);
}
XAudioServer.prototype.initializeResampler = function (sampleRate) {
    XAudioJSAudioContextSampleBuffer = this.getFloat32(XAudioJSMaxBufferSize);
    XAudioJSResampleBufferSize = Math.max(XAudioJSMaxBufferSize * Math.ceil(sampleRate / this.XAudioJSSampleRate) + XAudioJSChannelsAllocated, XAudioJSSamplesPerCallback * XAudioJSChannelsAllocated);
	XAudioJSResampleControl = new Resampler(this.XAudioJSSampleRate, sampleRate, XAudioJSChannelsAllocated, XAudioJSResampleBufferSize, true);
}
XAudioServer.prototype.getFloat32 = function (size) {
	try {
		return new Float32Array(size);
	}
	catch (error) {
		return [];
	}
}
function XAudioJSFlashAudioEvent() {		//The callback that flash calls...
	XAudioJSResampleRefill();
	return XAudioJSFlashTransportEncoder();
}
function XAudioJSGenerateFlashSurroundString() {	//Convert the arrays to one long string for speed.
	var XAudioJSTotalSamples = XAudioJSSamplesPerCallback << 1;
	if (XAudioJSBinaryString.length > XAudioJSTotalSamples) {
		XAudioJSBinaryString = [];
	}
	XAudioJSTotalSamples = 0;
	for (var index = 0; index < XAudioJSSamplesPerCallback && XAudioJSResampleBufferStart != XAudioJSResampleBufferEnd; ++index) {
		//Sanitize the buffer:
		XAudioJSBinaryString[XAudioJSTotalSamples++] = String.fromCharCode(((Math.min(Math.max(XAudioJSResampledBuffer[XAudioJSResampleBufferStart++] + 1, 0), 2) * 0x3FFF) | 0) + 0x3000);
		XAudioJSBinaryString[XAudioJSTotalSamples++] = String.fromCharCode(((Math.min(Math.max(XAudioJSResampledBuffer[XAudioJSResampleBufferStart++] + 1, 0), 2) * 0x3FFF) | 0) + 0x3000);
		XAudioJSResampleBufferStart += XAudioJSChannelsAllocated - 2;
		if (XAudioJSResampleBufferStart == XAudioJSResampleBufferSize) {
			XAudioJSResampleBufferStart = 0;
		}
	}
	return XAudioJSBinaryString.join("");
}
function XAudioJSGenerateFlashStereoString() {	//Convert the arrays to one long string for speed.
	var XAudioJSTotalSamples = XAudioJSSamplesPerCallback << 1;
	if (XAudioJSBinaryString.length > XAudioJSTotalSamples) {
		XAudioJSBinaryString = [];
	}
	for (var index = 0; index < XAudioJSTotalSamples && XAudioJSResampleBufferStart != XAudioJSResampleBufferEnd;) {
		//Sanitize the buffer:
		XAudioJSBinaryString[index++] = String.fromCharCode(((Math.min(Math.max(XAudioJSResampledBuffer[XAudioJSResampleBufferStart++] + 1, 0), 2) * 0x3FFF) | 0) + 0x3000);
		XAudioJSBinaryString[index++] = String.fromCharCode(((Math.min(Math.max(XAudioJSResampledBuffer[XAudioJSResampleBufferStart++] + 1, 0), 2) * 0x3FFF) | 0) + 0x3000);
		if (XAudioJSResampleBufferStart == XAudioJSResampleBufferSize) {
			XAudioJSResampleBufferStart = 0;
		}
	}
	return XAudioJSBinaryString.join("");
}
function XAudioJSGenerateFlashMonoString() {	//Convert the array to one long string for speed.
	if (XAudioJSBinaryString.length > XAudioJSSamplesPerCallback) {
		XAudioJSBinaryString = [];
	}
	for (var index = 0; index < XAudioJSSamplesPerCallback && XAudioJSResampleBufferStart != XAudioJSResampleBufferEnd;) {
		//Sanitize the buffer:
		XAudioJSBinaryString[index++] = String.fromCharCode(((Math.min(Math.max(XAudioJSResampledBuffer[XAudioJSResampleBufferStart++] + 1, 0), 2) * 0x3FFF) | 0) + 0x3000);
		if (XAudioJSResampleBufferStart == XAudioJSResampleBufferSize) {
			XAudioJSResampleBufferStart = 0;
		}
	}
	return XAudioJSBinaryString.join("");
}
//Some Required Globals:
var XAudioJSWebAudioContextHandle = null;
var XAudioJSWebAudioAudioNode = null;
var XAudioJSWebAudioWatchDogTimer = null;
var XAudioJSWebAudioWatchDogLast = false;
var XAudioJSWebAudioLaunchedContext = false;
var XAudioJSAudioContextSampleBuffer = [];
var XAudioJSResampledBuffer = [];
var XAudioJSMinBufferSize = 15000;
var XAudioJSMaxBufferSize = 25000;
var XAudioJSChannelsAllocated = 1;
var XAudioJSVolume = 1;
var XAudioJSResampleControl = null;
var XAudioJSAudioBufferSize = 0;
var XAudioJSResampleBufferStart = 0;
var XAudioJSResampleBufferEnd = 0;
var XAudioJSResampleBufferSize = 0;
var XAudioJSMediaStreamWorker = null;
var XAudioJSMediaStreamBuffer = [];
var XAudioJSMediaStreamSampleRate = 44100;
var XAudioJSMozAudioSampleRate = 44100;
var XAudioJSSamplesPerCallback = 2048;			//Has to be between 2048 and 4096 (If over, then samples are ignored, if under then silence is added, 4096 fixes chrome android).
var XAudioJSFlashTransportEncoder = null;
var XAudioJSMediaStreamLengthAliasCounter = 0;
var XAudioJSBinaryString = [];
function XAudioJSWebAudioEvent(event) {		//Web Audio API callback...
	if (XAudioJSWebAudioWatchDogTimer) {
		XAudioJSWebAudioWatchDogLast = (new Date()).getTime();
	}
	//Find all output channels:
	for (var bufferCount = 0, buffers = []; bufferCount < XAudioJSChannelsAllocated; ++bufferCount) {
		buffers[bufferCount] = event.outputBuffer.getChannelData(bufferCount);
	}
	//Make sure we have resampled samples ready:
	XAudioJSResampleRefill();
	//Copy samples from XAudioJS to the Web Audio API:
	for (var index = 0; index < XAudioJSSamplesPerCallback && XAudioJSResampleBufferStart != XAudioJSResampleBufferEnd; ++index) {
		for (bufferCount = 0; bufferCount < XAudioJSChannelsAllocated; ++bufferCount) {
			buffers[bufferCount][index] = XAudioJSResampledBuffer[XAudioJSResampleBufferStart++] * XAudioJSVolume;
		}
		if (XAudioJSResampleBufferStart == XAudioJSResampleBufferSize) {
			XAudioJSResampleBufferStart = 0;
		}
	}
	//Pad with silence if we're underrunning:
	while (index < XAudioJSSamplesPerCallback) {
		for (bufferCount = 0; bufferCount < XAudioJSChannelsAllocated; ++bufferCount) {
			buffers[bufferCount][index] = 0;
		}
		++index;
	}
}
//MediaStream API buffer push
function XAudioJSMediaStreamPushAudio(event) {
	var index = 0;
	var audioLengthRequested = event.data;
	var samplesPerCallbackAll = XAudioJSSamplesPerCallback * XAudioJSChannelsAllocated;
	var XAudioJSMediaStreamLengthAlias = audioLengthRequested % XAudioJSSamplesPerCallback;
	audioLengthRequested = audioLengthRequested - (XAudioJSMediaStreamLengthAliasCounter - (XAudioJSMediaStreamLengthAliasCounter % XAudioJSSamplesPerCallback)) - XAudioJSMediaStreamLengthAlias + XAudioJSSamplesPerCallback;
	XAudioJSMediaStreamLengthAliasCounter -= XAudioJSMediaStreamLengthAliasCounter - (XAudioJSMediaStreamLengthAliasCounter % XAudioJSSamplesPerCallback);
	XAudioJSMediaStreamLengthAliasCounter += XAudioJSSamplesPerCallback - XAudioJSMediaStreamLengthAlias;
	if (XAudioJSMediaStreamBuffer.length != samplesPerCallbackAll) {
		XAudioJSMediaStreamBuffer = new Float32Array(samplesPerCallbackAll);
	}
	XAudioJSResampleRefill();
	while (index < audioLengthRequested) {
		var index2 = 0;
		while (index2 < samplesPerCallbackAll && XAudioJSResampleBufferStart != XAudioJSResampleBufferEnd) {
			XAudioJSMediaStreamBuffer[index2++] = XAudioJSResampledBuffer[XAudioJSResampleBufferStart++];
			if (XAudioJSResampleBufferStart == XAudioJSResampleBufferSize) {
				XAudioJSResampleBufferStart = 0;
			}
		}
		XAudioJSMediaStreamWorker.postMessage([0, XAudioJSMediaStreamBuffer]);
		index += XAudioJSSamplesPerCallback;
	}
}
function XAudioJSResampleRefill() {
	if (XAudioJSAudioBufferSize > 0) {
		//Resample a chunk of audio:
		var resampleLength = XAudioJSResampleControl.resampler(XAudioJSGetBufferSamples());
		var resampledResult = XAudioJSResampleControl.outputBuffer;
		for (var index2 = 0; index2 < resampleLength;) {
			XAudioJSResampledBuffer[XAudioJSResampleBufferEnd++] = resampledResult[index2++];
			if (XAudioJSResampleBufferEnd == XAudioJSResampleBufferSize) {
				XAudioJSResampleBufferEnd = 0;
			}
			if (XAudioJSResampleBufferStart == XAudioJSResampleBufferEnd) {
				XAudioJSResampleBufferStart += XAudioJSChannelsAllocated;
				if (XAudioJSResampleBufferStart == XAudioJSResampleBufferSize) {
					XAudioJSResampleBufferStart = 0;
				}
			}
		}
		XAudioJSAudioBufferSize = 0;
	}
}
function XAudioJSResampledSamplesLeft() {
	return ((XAudioJSResampleBufferStart <= XAudioJSResampleBufferEnd) ? 0 : XAudioJSResampleBufferSize) + XAudioJSResampleBufferEnd - XAudioJSResampleBufferStart;
}
function XAudioJSGetBufferSamples() {
    return XAudioJSGetArraySlice(XAudioJSAudioContextSampleBuffer, XAudioJSAudioBufferSize);
}
function XAudioJSGetArraySlice(buffer, lengthOf) {
	//Typed array and normal array buffer section referencing:
	try {
		return buffer.subarray(0, lengthOf);
	}
	catch (error) {
		try {
			//Regular array pass:
			buffer.length = lengthOf;
			return buffer;
		}
		catch (error) {
			//Nightly Firefox 4 used to have the subarray function named as slice:
			return buffer.slice(0, lengthOf);
		}
	}
}