// Reliable audio system for learning cues, focus music, and victory ceremony.
const AudioContextCtor = window.AudioContext || window.webkitAudioContext;

const FOCUS_URL = 'https://upload.wikimedia.org/wikipedia/commons/e/ec/Air_-_Air_Force_Strings_-_United_States_Air_Force_Band.mp3';
const ANTHEM_URL = 'https://upload.wikimedia.org/wikipedia/commons/2/25/%22The_Star-Spangled_Banner%22_performed_by_the_United_States_Navy_Band.mp3';

let audioCtx = null;
let focusAudio = null;
let focusFallbackTimer = null;
let focusFallbackMaster = null;
let focusFallbackStep = 0;
let currentFocusVolume = 0.34;
let anthemAudio = null;

const initAudio = () => {
  if (!audioCtx) {
    audioCtx = new AudioContextCtor();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
};

const softTone = (frequency, when, duration, volume, destination, type = 'sine') => {
  const ctx = initAudio();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();

  osc.type = type;
  osc.frequency.setValueAtTime(frequency, when);

  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(1800, when);
  filter.Q.setValueAtTime(0.4, when);

  gain.gain.setValueAtTime(0.0001, when);
  gain.gain.exponentialRampToValueAtTime(volume, when + 0.04);
  gain.gain.exponentialRampToValueAtTime(0.0001, when + duration);

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(destination || ctx.destination);

  osc.start(when);
  osc.stop(when + duration + 0.05);
};

export const playCorrectSound = () => {
  try {
    const ctx = initAudio();
    const now = ctx.currentTime;
    [440, 554.37, 659.25, 880].forEach((frequency, index) => {
      softTone(frequency, now + index * 0.08, 0.28, 0.13, ctx.destination, 'sine');
    });
  } catch (error) {
    console.error('Audio API not supported or error', error);
  }
};

export const playIncorrectSound = () => {
  try {
    const ctx = initAudio();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(155, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(105, ctx.currentTime + 0.25);

    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.14, ctx.currentTime + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.28);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  } catch (error) {
    console.error('Audio API not supported or error', error);
  }
};

const FOCUS_CHORDS = [
  [261.63, 329.63, 392.0, 493.88],
  [220.0, 261.63, 329.63, 392.0],
  [293.66, 349.23, 440.0, 523.25],
  [196.0, 246.94, 293.66, 349.23],
];

const FOCUS_PATTERN = [0, 2, 1, 3, 2, 1, 0, 1];
const FOCUS_STEP_MS = 430;

const scheduleFallbackFocusStep = () => {
  if (!focusFallbackMaster) return;

  const ctx = initAudio();
  const chordIndex = Math.floor(focusFallbackStep / FOCUS_PATTERN.length) % FOCUS_CHORDS.length;
  const noteIndex = FOCUS_PATTERN[focusFallbackStep % FOCUS_PATTERN.length];
  const frequency = FOCUS_CHORDS[chordIndex][noteIndex];
  const now = ctx.currentTime;
  const scale = Math.max(0.25, currentFocusVolume / 0.34);

  softTone(frequency, now, 1.15, 0.095 * scale, focusFallbackMaster, 'sine');
  softTone(frequency * 2, now + 0.015, 0.85, 0.022 * scale, focusFallbackMaster, 'triangle');

  if (focusFallbackStep % FOCUS_PATTERN.length === 0) {
    softTone(FOCUS_CHORDS[chordIndex][0] / 2, now, 1.7, 0.04 * scale, focusFallbackMaster, 'sine');
  }

  focusFallbackStep += 1;
};

const startFallbackFocusMusic = () => {
  if (focusFallbackTimer) return;

  try {
    const ctx = initAudio();
    focusFallbackMaster = ctx.createGain();
    focusFallbackMaster.gain.setValueAtTime(0.72, ctx.currentTime);
    focusFallbackMaster.connect(ctx.destination);

    focusFallbackStep = 0;
    scheduleFallbackFocusStep();
    focusFallbackTimer = window.setInterval(scheduleFallbackFocusStep, FOCUS_STEP_MS);
  } catch (error) {
    console.error('Unable to start fallback focus music', error);
  }
};

const stopFallbackFocusMusic = () => {
  if (focusFallbackTimer) {
    window.clearInterval(focusFallbackTimer);
    focusFallbackTimer = null;
  }

  if (focusFallbackMaster) {
    try {
      focusFallbackMaster.disconnect();
    } catch {
      // Already disconnected.
    }
    focusFallbackMaster = null;
  }
};

export const setFocusMusicVolume = (volume) => {
  currentFocusVolume = Math.max(0, Math.min(1, Number(volume) || 0));
  if (focusAudio) {
    focusAudio.volume = currentFocusVolume;
  }
};

export const startFocusMusic = (volume = currentFocusVolume) => {
  setFocusMusicVolume(volume);
  stopFallbackFocusMusic();

  if (!focusAudio) {
    focusAudio = new Audio(FOCUS_URL);
    focusAudio.loop = true;
    focusAudio.preload = 'auto';
    focusAudio.volume = currentFocusVolume;

    focusAudio.onerror = () => {
      startFallbackFocusMusic();
    };
  }

  focusAudio.volume = currentFocusVolume;

  const playPromise = focusAudio.play();
  if (playPromise?.catch) {
    playPromise.catch((error) => {
      console.warn('Focus recording could not start; using synthesized fallback.', error);
      startFallbackFocusMusic();
    });
  }

  return focusAudio;
};

export const stopFocusMusic = () => {
  stopFallbackFocusMusic();

  if (focusAudio) {
    focusAudio.pause();
  }
};

export const playVictorySound = () => {
  try {
    const ctx = initAudio();
    const now = ctx.currentTime;
    [523.25, 659.25, 783.99, 1046.5].forEach((frequency, index) => {
      softTone(frequency, now + index * 0.12, 0.34, 0.17, ctx.destination, 'triangle');
    });
  } catch (error) {
    console.error('Audio API not supported or error', error);
  }
};

export const stopAnthem = () => {
  if (!anthemAudio) return;
  anthemAudio.pause();
  anthemAudio.currentTime = 0;
  anthemAudio.onended = null;
  anthemAudio.onerror = null;
  anthemAudio = null;
};

export const playAnthem = ({ onEnded, onError } = {}) => {
  stopAnthem();

  const audio = new Audio(ANTHEM_URL);
  anthemAudio = audio;
  audio.preload = 'auto';
  audio.volume = 0.72;

  let settled = false;

  const fail = () => {
    if (settled) return;
    settled = true;
    if (anthemAudio === audio) anthemAudio = null;
    playVictorySound();
    onError?.();
  };

  audio.onended = () => {
    if (settled) return;
    settled = true;
    anthemAudio = null;
    onEnded?.();
  };

  audio.onerror = fail;

  const playPromise = audio.play();
  if (playPromise?.catch) {
    playPromise.catch(fail);
  }

  return audio;
};

export const getAudioSources = () => ({
  focus: FOCUS_URL,
  anthem: ANTHEM_URL,
});
