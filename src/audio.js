// Audio system: local synthesized learning cues + classical focus loop,
// plus a public-domain U.S. Navy Band recording for the victory ceremony.
const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
const ANTHEM_URL = 'https://upload.wikimedia.org/wikipedia/commons/2/25/%22The_Star-Spangled_Banner%22_performed_by_the_United_States_Navy_Band.mp3';

let audioCtx = null;
let focusTimer = null;
let focusMaster = null;
let focusStep = 0;
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
  gain.gain.exponentialRampToValueAtTime(volume, when + 0.05);
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
      softTone(frequency, now + index * 0.08, 0.28, 0.12, ctx.destination, 'sine');
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
    gain.gain.exponentialRampToValueAtTime(0.13, ctx.currentTime + 0.03);
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
  [261.63, 329.63, 392.0, 493.88], // Cmaj7
  [220.0, 261.63, 329.63, 392.0],  // Am7
  [293.66, 349.23, 440.0, 523.25], // Dm7
  [196.0, 246.94, 293.66, 349.23], // G7
];

const FOCUS_PATTERN = [0, 2, 1, 3, 2, 1, 0, 1];
const FOCUS_STEP_MS = 430;

const scheduleFocusStep = () => {
  if (!focusMaster) return;

  const ctx = initAudio();
  const chordIndex = Math.floor(focusStep / FOCUS_PATTERN.length) % FOCUS_CHORDS.length;
  const noteIndex = FOCUS_PATTERN[focusStep % FOCUS_PATTERN.length];
  const frequency = FOCUS_CHORDS[chordIndex][noteIndex];
  const now = ctx.currentTime;

  // Gentle two-layer timbre: enough harmonic content to sound musical,
  // but deliberately low-energy so it does not compete with learning.
  softTone(frequency, now, 1.15, 0.055, focusMaster, 'sine');
  softTone(frequency * 2, now + 0.015, 0.85, 0.012, focusMaster, 'triangle');

  if (focusStep % FOCUS_PATTERN.length === 0) {
    softTone(FOCUS_CHORDS[chordIndex][0] / 2, now, 1.7, 0.022, focusMaster, 'sine');
  }

  focusStep += 1;
};

export const startFocusMusic = () => {
  try {
    if (focusTimer) return;
    const ctx = initAudio();

    focusMaster = ctx.createGain();
    focusMaster.gain.setValueAtTime(0.0001, ctx.currentTime);
    focusMaster.gain.exponentialRampToValueAtTime(0.38, ctx.currentTime + 0.8);
    focusMaster.connect(ctx.destination);

    focusStep = 0;
    scheduleFocusStep();
    focusTimer = window.setInterval(scheduleFocusStep, FOCUS_STEP_MS);
  } catch (error) {
    console.error('Unable to start focus music', error);
  }
};

export const stopFocusMusic = () => {
  if (focusTimer) {
    window.clearInterval(focusTimer);
    focusTimer = null;
  }

  if (focusMaster && audioCtx) {
    const master = focusMaster;
    const now = audioCtx.currentTime;
    master.gain.cancelScheduledValues(now);
    master.gain.setValueAtTime(Math.max(master.gain.value, 0.0001), now);
    master.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);
    window.setTimeout(() => {
      try {
        master.disconnect();
      } catch {
        // Already disconnected.
      }
    }, 450);
  }

  focusMaster = null;
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
  audio.volume = 0.62;

  audio.onended = () => {
    anthemAudio = null;
    onEnded?.();
  };

  audio.onerror = () => {
    anthemAudio = null;
    playVictorySound();
    onError?.();
  };

  const playPromise = audio.play();
  if (playPromise?.catch) {
    playPromise.catch(() => {
      if (anthemAudio === audio) anthemAudio = null;
      playVictorySound();
      onError?.();
    });
  }

  return audio;
};

export const getAnthemSource = () => ANTHEM_URL;
