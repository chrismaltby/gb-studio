let globalAudioCtx: AudioContext | undefined = undefined;

export const playTone = (frequency: number, duration: number) => {
  const audioCtx = getAudioCtx();
  const gainNode = audioCtx.createGain();
  const oscillator = audioCtx.createOscillator();

  gainNode.gain.value = 0.2;

  oscillator.type = "square";
  oscillator.frequency.setValueAtTime(frequency, audioCtx.currentTime);

  oscillator.connect(gainNode);
  gainNode.connect(audioCtx.destination);
  oscillator.start();

  setTimeout(() => {
    oscillator.stop();
    gainNode.disconnect();
  }, duration);

  return oscillator;
};

export const stopTone = (oscillator: OscillatorNode) => {
  oscillator.stop();
};

export const decodeAudioData = (buffer: ArrayBuffer) => {
  const audioCtx = getAudioCtx();
  return audioCtx.decodeAudioData(buffer);
};

export const playBuffer = (audioBuffer: AudioBuffer) => {
  const audioCtx = getAudioCtx();
  const source = audioCtx.createBufferSource();
  source.buffer = audioBuffer;
  source.connect(audioCtx.destination);
  source.start();
  source.onended = () => {
    source.disconnect();
  };
  return source;
};

export const stopBuffer = (bufferSource: AudioBufferSourceNode) => {
  bufferSource.stop();
};

const getAudioCtx = () => {
  if (!globalAudioCtx) {
    globalAudioCtx = new window.AudioContext();
  }
  return globalAudioCtx;
};
