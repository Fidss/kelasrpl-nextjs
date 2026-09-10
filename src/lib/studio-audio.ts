// Web Audio API helper for synthesizer sounds and real-time audio mixing
// Runs 100% client-side without relying on external sound asset files

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx || audioCtx.state === "closed") {
    const AudioCtxClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    audioCtx = new AudioCtxClass();
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  return audioCtx;
}

/**
 * Play a countdown beep sound (high pitched for '1', softer for '3' and '2')
 */
export function playCountdownBeep(isFinal = false) {
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(isFinal ? 1046.5 : 587.33, ctx.currentTime); // C6 or D5

    gain.gain.setValueAtTime(0.001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + (isFinal ? 0.35 : 0.18));

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + (isFinal ? 0.38 : 0.2));
  } catch (err) {
    console.warn("AudioContext error on playCountdownBeep:", err);
  }
}

/**
 * Play a realistic mechanical camera shutter click sound
 */
export function playShutterSound() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // Part 1: Initial sharp click (high-frequency burst)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "triangle";
    osc1.frequency.setValueAtTime(1400, now);
    osc1.frequency.exponentialRampToValueAtTime(200, now + 0.05);

    gain1.gain.setValueAtTime(0.3, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.06);

    // Part 2: Mechanical shutter curtain noise
    const bufferSize = ctx.sampleRate * 0.08;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;

    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(1200, now + 0.02);
    filter.Q.setValueAtTime(3, now + 0.02);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.001, now + 0.02);
    noiseGain.gain.exponentialRampToValueAtTime(0.2, now + 0.035);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

    whiteNoise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(ctx.destination);

    whiteNoise.start(now + 0.02);
    whiteNoise.stop(now + 0.1);
  } catch (err) {
    console.warn("AudioContext error on playShutterSound:", err);
  }
}

/**
 * Mix user's microphone MediaStream with Background Music (audio element) into a single unified MediaStream
 */
export function mixMicrophoneAndBgm(
  micStream: MediaStream | null,
  bgmAudioElement: HTMLAudioElement | null
): { mixedStream: MediaStream; cleanup: () => void } {
  const ctx = getAudioContext();
  const dest = ctx.createMediaStreamDestination();
  const cleanupTasks: Array<() => void> = [];

  // Connect microphone stream if available
  if (micStream && micStream.getAudioTracks().length > 0) {
    try {
      const micSource = ctx.createMediaStreamSource(micStream);
      const micGain = ctx.createGain();
      micGain.gain.value = 1.0;
      micSource.connect(micGain);
      micGain.connect(dest);
      cleanupTasks.push(() => {
        try {
          micSource.disconnect();
          micGain.disconnect();
        } catch {}
      });
    } catch (e) {
      console.warn("Could not connect micSource:", e);
    }
  }

  // Connect BGM if available
  if (bgmAudioElement) {
    try {
      // Note: createMediaElementSource can only be called ONCE per HTMLMediaElement
      let bgmSource: MediaElementAudioSourceNode;
      const existing = (bgmAudioElement as unknown as { _sourceNode?: MediaElementAudioSourceNode })._sourceNode;
      if (existing) {
        bgmSource = existing;
      } else {
        bgmSource = ctx.createMediaElementSource(bgmAudioElement);
        (bgmAudioElement as unknown as { _sourceNode: MediaElementAudioSourceNode })._sourceNode = bgmSource;
      }

      const bgmGain = ctx.createGain();
      bgmGain.gain.value = 0.7; // Balance music volume slightly below vocal
      bgmSource.connect(bgmGain);
      bgmGain.connect(dest);
      // Also connect to speakers so user can hear the music while recording
      bgmSource.connect(ctx.destination);

      cleanupTasks.push(() => {
        try {
          bgmGain.disconnect();
        } catch {}
      });
    } catch (e) {
      console.warn("Could not connect bgmSource:", e);
    }
  }

  return {
    mixedStream: dest.stream,
    cleanup: () => {
      cleanupTasks.forEach((fn) => fn());
    },
  };
}
