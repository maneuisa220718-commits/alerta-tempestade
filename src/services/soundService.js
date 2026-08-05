// Custom Web Audio API sound synthesizer for Alert App (No external audio files required)

let audioCtx = null;
let currentOscillators = [];

function getAudioContext() {
  if (!audioCtx) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) {
      audioCtx = new AudioContext();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function playEmergencyAlertSound() {
  stopSound();
  const ctx = getAudioContext();
  if (!ctx) return;

  // Create Siren Sound (oscillating frequency between 440Hz and 880Hz)
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(440, ctx.currentTime);

  // Frequency modulation for siren effect
  const now = ctx.currentTime;
  for (let i = 0; i < 30; i++) {
    osc.frequency.linearRampToValueAtTime(880, now + i * 0.8 + 0.4);
    osc.frequency.linearRampToValueAtTime(440, now + i * 0.8 + 0.8);
  }

  gain.gain.setValueAtTime(0.3, ctx.currentTime);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start();
  currentOscillators.push(osc);
}

export function playCallIncomingSound() {
  stopSound();
  const ctx = getAudioContext();
  if (!ctx) return;

  const osc1 = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  const gain = ctx.createGain();

  osc1.type = 'sine';
  osc2.type = 'sine';
  osc1.frequency.setValueAtTime(440, ctx.currentTime);
  osc2.frequency.setValueAtTime(480, ctx.currentTime);

  gain.gain.setValueAtTime(0.2, ctx.currentTime);

  osc1.connect(gain);
  osc2.connect(gain);
  gain.connect(ctx.destination);

  osc1.start();
  osc2.start();

  currentOscillators.push(osc1, osc2);
}

export function stopSound() {
  currentOscillators.forEach((osc) => {
    try {
      osc.stop();
      osc.disconnect();
    } catch (e) {
      // Ignore if already stopped
    }
  });
  currentOscillators = [];
}

export function triggerVibration() {
  if ('vibrate' in navigator) {
    navigator.vibrate([1000, 500, 1000, 500, 1000, 500, 1000, 500, 1000]);
  }
}

export function stopVibration() {
  if ('vibrate' in navigator) {
    navigator.vibrate(0);
  }
}
