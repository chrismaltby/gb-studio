//This file is part of the XAudioJS library.
let XAudioJSResampledBuffer = [];
let XAudioJSOutputBuffer = [];
let XAudioJSResampleBufferStart = 0;
let XAudioJSResampleBufferEnd = 0;
let XAudioJSResampleBufferSize = 0;
let XAudioJSChannelsAllocated = 1;
//Message Receiver:
self.onmessage = function (event) {
	let data = event.data;
	switch (data[0]) {
		case 0:
			//Add new audio samples to our ring buffer:
			let resampledResult = data[1];
			let length = resampledResult.length;
			for (let i = 0; i < length; ++i) {
				XAudioJSResampledBuffer[XAudioJSResampleBufferEnd++] = resampledResult[i];
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
			break;
		case 1:
			//Initialize:
			XAudioJSResampleBufferSize = data[1];
			XAudioJSChannelsAllocated = data[2];
			XAudioJSResampledBuffer = new Float32Array(XAudioJSResampleBufferSize);
	}
}
//MediaStream Polyfill Event:
self.onprocessmedia = function (event) {
	//Get some buffer length computations:
	let apiBufferLength = event.audioLength;
	let apiBufferLengthAll = apiBufferLength * event.audioChannels;
	if (apiBufferLengthAll > XAudioJSOutputBuffer.length) {
		XAudioJSOutputBuffer = new Float32Array(apiBufferLengthAll);
	}
	//De-interleave the buffered audio while looping through our ring buffer:
	let sampleFramesCount = Math.min(apiBufferLength, XAudioJSResampledSamplesLeft() / XAudioJSChannelsAllocated);
	for (let sampleFramePosition = 0, channelOffset = 0; sampleFramePosition < sampleFramesCount; ++sampleFramePosition) {
		for (channelOffset = sampleFramePosition; channelOffset < apiBufferLengthAll; channelOffset += apiBufferLength) {
			XAudioJSOutputBuffer[channelOffset] = XAudioJSResampledBuffer[XAudioJSResampleBufferStart++];
			if (XAudioJSResampleBufferStart == XAudioJSResampleBufferSize) {
				XAudioJSResampleBufferStart = 0;
			}
		}
	}
	//Add some zero fill if we underran the required buffer fill amount:
	while (sampleFramePosition < apiBufferLength) {
		for (channelOffset = sampleFramePosition++; channelOffset < apiBufferLengthAll; channelOffset += apiBufferLength) {
			XAudioJSOutputBuffer[channelOffset] = 0;
		}
	}
	//Write some buffered audio:
	event.writeAudio(XAudioJSOutputBuffer.subarray(0, apiBufferLengthAll));
	//Request a buffer from the main thread:
	self.postMessage(event.audioLength);
}
//Accessory function used to determine remaining samples in the ring buffer:
function XAudioJSResampledSamplesLeft() {
	return ((XAudioJSResampleBufferStart <= XAudioJSResampleBufferEnd) ? 0 : XAudioJSResampleBufferSize) + XAudioJSResampleBufferEnd - XAudioJSResampleBufferStart;
}