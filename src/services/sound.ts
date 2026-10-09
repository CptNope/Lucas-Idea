/**
 * Procedural Casino Sound Effects Synthesizer using Web Audio API.
 * High performance, zero external asset dependencies, instant response.
 */

class SoundService {
  private ctx: AudioContext | null = null;
  private muted: boolean = false;
  private volume: number = 0.5;

  constructor() {
    // Read user preferences if available
    try {
      const savedMute = localStorage.getItem('grand_royale_sound_muted');
      if (savedMute !== null) this.muted = savedMute === 'true';
      const savedVol = localStorage.getItem('grand_royale_sound_vol');
      if (savedVol !== null) this.volume = Math.max(0, Math.min(1, parseFloat(savedVol)));
    } catch {
      // Ignore localStorage security exceptions
    }
  }

  private initCtx(): AudioContext | null {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public setMuted(muted: boolean) {
    this.muted = muted;
    try {
      localStorage.setItem('grand_royale_sound_muted', String(muted));
    } catch {}
  }

  public getVolume(): number {
    return this.volume;
  }

  public setVolume(volume: number) {
    this.volume = Math.max(0, Math.min(1, volume));
    try {
      localStorage.setItem('grand_royale_sound_vol', String(this.volume));
    } catch {}
  }

  /**
   * Crisp ceramic poker chip clink
   */
  public playChip() {
    if (this.muted || this.volume <= 0) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(2200 + Math.random() * 300, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.05);

    filter.type = 'highpass';
    filter.frequency.setValueAtTime(1200, ctx.currentTime);

    const masterVol = this.volume * 0.3;
    gain.gain.setValueAtTime(masterVol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.07);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.08);
  }

  /**
   * Card deal / slide swoosh
   */
  public playCard() {
    if (this.muted || this.volume <= 0) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    // Filtered noise pulse
    const bufferSize = ctx.sampleRate * 0.08;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1400, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(500, ctx.currentTime + 0.07);
    filter.Q.setValueAtTime(3, ctx.currentTime);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(this.volume * 0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    noise.start();
  }

  /**
   * Slot reel mechanical click / stop tick
   */
  public playReelStop(pitchMod = 1) {
    if (this.muted || this.volume <= 0) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(180 * pitchMod, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(60 * pitchMod, ctx.currentTime + 0.04);

    gain.gain.setValueAtTime(this.volume * 0.35, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.06);
  }

  /**
   * Winning chime arpeggio
   */
  public playWin() {
    if (this.muted || this.volume <= 0) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.08);

      const startTime = ctx.currentTime + idx * 0.08;
      const duration = 0.22;
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(this.volume * 0.3, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + duration);
    });
  }

  /**
   * Big jackpot fanfare
   */
  public playJackpot() {
    if (this.muted || this.volume <= 0) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    const notes = [440, 554.37, 659.25, 880, 1108.73, 1318.51];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      const startTime = ctx.currentTime + idx * 0.07;
      const duration = 0.35;
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(this.volume * 0.4, startTime + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + duration);
    });
  }

  /**
   * Roulette wheel ball bouncing click
   */
  public playRouletteBall() {
    if (this.muted || this.volume <= 0) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1400 + Math.random() * 400, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.03);

    gain.gain.setValueAtTime(this.volume * 0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.035);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.04);
  }

  /**
   * Dice roll rattle on felt
   */
  public playDice() {
    if (this.muted || this.volume <= 0) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    // 2 rapid clicks simulating tumbling dice
    [0, 0.04, 0.09].forEach((delay) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      const startTime = ctx.currentTime + delay;
      osc.frequency.setValueAtTime(350 + Math.random() * 200, startTime);
      osc.frequency.exponentialRampToValueAtTime(120, startTime + 0.04);

      gain.gain.setValueAtTime(this.volume * 0.3, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.04);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.05);
    });
  }
}

export const sound = new SoundService();
