/**
 * Audio Synthesizer & Haptic Feedback Engine
 * Ultra-lightweight, zero-asset Web Audio API implementation optimized for mobile browsers.
 * Safe for iOS Safari & Android Chrome with auto-resume, leak prevention, and zero freezing.
 */

class AudioHapticsEngine {
  private audioCtx: AudioContext | null = null;
  private soundEnabled: boolean = true;
  private hapticEnabled: boolean = true;
  private isResuming: boolean = false;

  constructor() {
    // Load persisted preferences safely
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const savedSound = localStorage.getItem('cricvault_sound');
        if (savedSound !== null) this.soundEnabled = savedSound === 'true';
        const savedHaptic = localStorage.getItem('cricvault_haptic');
        if (savedHaptic !== null) this.hapticEnabled = savedHaptic === 'true';
      }
    } catch (_) {}
  }

  public setSoundEnabled(enabled: boolean) {
    this.soundEnabled = enabled;
    try {
      localStorage.setItem('cricvault_sound', String(enabled));
    } catch (_) {}
  }

  public isSoundEnabled(): boolean {
    return this.soundEnabled;
  }

  public setHapticEnabled(enabled: boolean) {
    this.hapticEnabled = enabled;
    try {
      localStorage.setItem('cricvault_haptic', String(enabled));
    } catch (_) {}
  }

  public isHapticEnabled(): boolean {
    return this.hapticEnabled;
  }

  /**
   * Lazily initializes and wakes up a single shared AudioContext.
   * Prevents audio context exhaustion on iOS Safari (which caps at 4-6 instances).
   */
  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;

    if (!this.audioCtx) {
      try {
        const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioContextClass) {
          this.audioCtx = new AudioContextClass();
        }
      } catch (e) {
        return null;
      }
    }

    if (this.audioCtx && this.audioCtx.state === 'suspended' && !this.isResuming) {
      this.isResuming = true;
      this.audioCtx.resume().then(() => {
        this.isResuming = false;
      }).catch(() => {
        this.isResuming = false;
      });
    }

    return this.audioCtx;
  }

  /**
   * Mobile haptic vibration triggers with hardware-safe throttling
   */
  public vibrate(pattern: number | number[]) {
    if (!this.hapticEnabled || typeof navigator === 'undefined' || !navigator.vibrate) return;
    try {
      navigator.vibrate(pattern);
    } catch (_) {}
  }

  public tapFeedback() {
    this.vibrate(10);
    this.playTick();
  }

  public boundaryFeedback(type: 'four' | 'six') {
    this.vibrate([30, 25, 60]);
    if (type === 'six') {
      this.playSixFanfare();
    } else {
      this.playFourChime();
    }
  }

  public wicketFeedback() {
    this.vibrate([80, 40, 120]);
    this.playWicketSound();
  }

  public overCompleteFeedback() {
    this.vibrate([50, 30, 50]);
    this.playOverBell();
  }

  public undoFeedback() {
    this.vibrate(25);
    this.playTone(320, 0.06, 'sine');
  }

  public errorFeedback() {
    this.vibrate([40, 40, 40]);
    this.playTone(180, 0.12, 'sawtooth');
  }

  /* Safe tone synthesis using Web Audio API */

  private playTick() {
    if (!this.soundEnabled) return;
    const ctx = this.getAudioContext();
    if (!ctx || ctx.state !== 'running') return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(400, now + 0.03);

      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.03);
    } catch (_) {}
  }

  private playTone(freq: number, duration: number, type: OscillatorType = 'sine', volume: number = 0.12) {
    if (!this.soundEnabled) return;
    const ctx = this.getAudioContext();
    if (!ctx || ctx.state !== 'running') return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(volume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + duration);
    } catch (_) {}
  }

  private playFourChime() {
    if (!this.soundEnabled) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        setTimeout(() => {
          this.playTone(freq, 0.1, 'triangle', 0.12);
        }, idx * 50);
      });
    } catch (_) {}
  }

  private playSixFanfare() {
    if (!this.soundEnabled) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const chords = [
        { freq: 587.33, delay: 0 },
        { freq: 739.99, delay: 60 },
        { freq: 880.00, delay: 120 },
        { freq: 1174.66, delay: 180 }
      ];
      chords.forEach(({ freq, delay }) => {
        setTimeout(() => {
          this.playTone(freq, 0.18, 'triangle', 0.15);
        }, delay);
      });
    } catch (_) {}
  }

  private playWicketSound() {
    if (!this.soundEnabled) return;
    const ctx = this.getAudioContext();
    if (!ctx || ctx.state !== 'running') return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(360, now);
      osc.frequency.exponentialRampToValueAtTime(90, now + 0.16);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.16);
    } catch (_) {}
  }

  private playOverBell() {
    if (!this.soundEnabled) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      this.playTone(987.77, 0.25, 'sine', 0.15); // B5
      setTimeout(() => {
        this.playTone(1318.51, 0.35, 'sine', 0.15); // E6
      }, 80);
    } catch (_) {}
  }
}

export const audioHaptics = new AudioHapticsEngine();
