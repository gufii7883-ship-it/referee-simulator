import { GameSettings } from '../types/game';

class SoundEngine {
  private ctx: AudioContext | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  private audioSettings: GameSettings['audio'] = {
    master: 0.85,
    crowd: 0.75,
    whistle: 0.9,
    music: 0.45,
    commentary: 0.8,
    sfx: 0.85,
    muteAll: false,
    musicEnabled: true,
    crowdEnabled: true,
  };
  private ambienceGain: GainNode | null = null;
  private ambienceRunning = false;

  public updateSettings(audio: GameSettings['audio']) {
    this.audioSettings = { ...audio };
    if (this.ambienceGain && this.ctx) {
      const target =
        audio.muteAll || !audio.crowdEnabled
          ? 0
          : audio.master * audio.crowd * 0.08;
      this.ambienceGain.gain.setTargetAtTime(target, this.ctx.currentTime, 0.1);
    }
  }

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    if (!this.noiseBuffer && this.ctx) {
      const length = this.ctx.sampleRate * 2;
      const buf = this.ctx.createBuffer(1, length, this.ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < length; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      this.noiseBuffer = buf;
    }
    return this.ctx;
  }

  private vol(channel: 'crowd' | 'whistle' | 'music' | 'commentary' | 'sfx'): number {
    if (this.audioSettings.muteAll) return 0;
    if (channel === 'crowd' && !this.audioSettings.crowdEnabled) return 0;
    if (channel === 'music' && !this.audioSettings.musicEnabled) return 0;
    return this.audioSettings.master * this.audioSettings[channel];
  }

  public startStadiumAmbience(intensity = 0.5) {
    const ctx = this.ensureContext();
    if (!ctx || !this.noiseBuffer || this.ambienceRunning) return;
    this.ambienceRunning = true;

    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    src.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 420;
    filter.Q.value = 0.7;

    const gain = ctx.createGain();
    gain.gain.value = this.vol('crowd') * 0.08 * intensity;

    src.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    src.start();
    this.ambienceGain = gain;
  }

  public whistle(type: 'short' | 'foul' | 'kickoff' | 'fulltime' = 'foul') {
    const v = this.vol('whistle');
    if (v <= 0.01) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    const playBlast = (startOffset: number, duration: number, freq = 2950) => {
      const t = ctx.currentTime + startOffset;
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(freq, t);
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(freq * 1.07, t);

      // Pea-whistle trill modulation
      lfo.type = 'sine';
      lfo.frequency.setValueAtTime(42, t);
      lfoGain.gain.setValueAtTime(140, t);
      lfo.connect(lfoGain);
      lfoGain.connect(osc1.frequency);
      lfoGain.connect(osc2.frequency);

      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(v * 0.24, t + 0.02);
      gain.gain.setValueAtTime(v * 0.22, t + duration - 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(t);
      osc2.start(t);
      lfo.start(t);
      osc1.stop(t + duration + 0.02);
      osc2.stop(t + duration + 0.02);
      lfo.stop(t + duration + 0.02);
    };

    if (type === 'short') {
      playBlast(0, 0.16, 3050);
    } else if (type === 'foul') {
      playBlast(0, 0.42, 2920);
    } else if (type === 'kickoff') {
      playBlast(0, 0.55, 2960);
    } else if (type === 'fulltime') {
      playBlast(0, 0.24, 2940);
      playBlast(0.32, 0.24, 2940);
      playBlast(0.65, 0.72, 2980);
    }
  }

  public cheer(intensity = 0.8) {
    const v = this.vol('crowd') * intensity;
    if (v <= 0.01) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.noiseBuffer) return;

    const t = ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    src.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(650, t);
    filter.frequency.linearRampToValueAtTime(1250, t + 0.45);
    filter.frequency.linearRampToValueAtTime(800, t + 1.8);
    filter.Q.value = 0.85;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(v * 0.26, t + 0.35);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 2.1);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    src.start(t);
    src.stop(t + 2.15);
  }

  public boo(intensity = 0.8) {
    const v = this.vol('crowd') * intensity;
    if (v <= 0.01) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.noiseBuffer) return;

    const t = ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    src.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(240, t);
    filter.frequency.linearRampToValueAtTime(190, t + 1.4);
    filter.Q.value = 2.4;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(v * 0.32, t + 0.25);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 1.6);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    src.start(t);
    src.stop(t + 1.65);
  }

  public kick() {
    const v = this.vol('sfx');
    if (v <= 0.01) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(155, t);
    osc.frequency.exponentialRampToValueAtTime(42, t + 0.11);

    gain.gain.setValueAtTime(v * 0.28, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.14);
  }

  public collision() {
    const v = this.vol('sfx');
    if (v <= 0.01) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.noiseBuffer) return;

    const t = ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 320;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(v * 0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    src.start(t);
    src.stop(t + 0.2);
  }

  public yellowCard() {
    const v = this.vol('sfx');
    if (v <= 0.01) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(520, t);
    osc.frequency.setValueAtTime(680, t + 0.09);

    gain.gain.setValueAtTime(v * 0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.32);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.35);
  }

  public redCard() {
    const v = this.vol('sfx');
    if (v <= 0.01) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    const t = ctx.currentTime;
    [220, 207, 165].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, t + i * 0.11);
      gain.gain.setValueAtTime(v * 0.16, t + i * 0.11);
      gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.11 + 0.28);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t + i * 0.11);
      osc.stop(t + i * 0.11 + 0.3);
    });
  }

  public varChime() {
    const v = this.vol('commentary');
    if (v <= 0.01) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    const t = ctx.currentTime;
    [587.33, 880, 1174.66].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + i * 0.09);
      gain.gain.setValueAtTime(v * 0.18, t + i * 0.09);
      gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.09 + 0.45);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t + i * 0.09);
      osc.stop(t + i * 0.09 + 0.48);
    });
  }

  public announcerTone() {
    const v = this.vol('commentary');
    if (v <= 0.01) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    const t = ctx.currentTime;
    [440, 554.37, 659.25].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + i * 0.12);
      gain.gain.setValueAtTime(v * 0.14, t + i * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.12 + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t + i * 0.12);
      osc.stop(t + i * 0.12 + 0.38);
    });
  }
}

export const soundEngine = new SoundEngine();
