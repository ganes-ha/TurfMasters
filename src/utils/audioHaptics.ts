/**
 * Audio Synthesizer & Haptic Feedback Engine
 * Works natively in modern mobile and desktop browsers without external audio assets.
 */

class AudioHapticsEngine {
  private audioCtx: AudioContext | null = null;
  private soundEnabled: boolean = true;
  private hapticEnabled: boolean = true;

  constructor() {
    // Load persisted preferences if available
    try {
      const savedSound = localStorage.getItem('cricvault_sound');
      if (savedSound !== null) this.soundEnabled = savedSound === 'true';
      const savedHaptic = localStorage.getItem('cricvault_haptic');
      if (savedHaptic !== null) this.hapticEnabled = savedHaptic === 'true';
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

  private initAudio() {
    if (!this.audioCtx && typeof window !== 'undefined') {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  /**
   * Haptic vibration triggers
   */
  public vibrate(pattern: number | number[]) {
    if (!this.hapticEnabled || typeof navigator === 'undefined' || !navigator.vibrate) return;
    try {
      navigator.vibrate(pattern);
    } catch (_) {}
  }

  public tapFeedback() {
    this.vibrate(15);
    this.playTick();
  }

  public boundaryFeedback(type: 'four' | 'six') {
    this.vibrate([40, 30, 80]);
    if (type === 'six') {
      this.playSixFanfare();
    } else {
      this.playFourChime();
    }
  }

  public wicketFeedback() {
    this.vibrate([100, 50, 150]);
    this.playWicketSound();
  }

  public overCompleteFeedback() {
    this.vibrate([60, 40, 60]);
    this.playOverBell();
  }

  public undoFeedback() {
    this.vibrate(35);
    this.playTone(320, 0.08, 'sine');
  }

  public errorFeedback() {
    this.vibrate([50, 50, 50]);
    this.playTone(180, 0.15, 'sawtooth');
  }

  /* Tone synthesis using Web Audio API */

  private playTick() {
    if (!this.soundEnabled) return;
    this.initAudio();
    if (!this.audioCtx) return;

    try {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, this.audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(400, this.audioCtx.currentTime + 0.03);

      gain.gain.setValueAtTime(0.12, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.03);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start();
      osc.stop(this.audioCtx.currentTime + 0.03);
    } catch (_) {}
  }

  private playTone(freq: number, duration: number, type: OscillatorType = 'sine', volume: number = 0.15) {
    if (!this.soundEnabled) return;
    this.initAudio();
    if (!this.audioCtx) return;

    try {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);

      gain.gain.setValueAtTime(volume, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start();
      osc.stop(this.audioCtx.currentTime + duration);
    } catch (_) {}
  }

  private playFourChime() {
    if (!this.soundEnabled) return;
    this.initAudio();
    if (!this.audioCtx) return;

    try {
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        setTimeout(() => {
          this.playTone(freq, 0.12, 'triangle', 0.15);
        }, idx * 60);
      });
    } catch (_) {}
  }

  private playSixFanfare() {
    if (!this.soundEnabled) return;
    this.initAudio();
    if (!this.audioCtx) return;

    try {
      const chords = [
        { freq: 587.33, delay: 0 },
        { freq: 739.99, delay: 70 },
        { freq: 880.00, delay: 140 },
        { freq: 1174.66, delay: 210 }
      ];
      chords.forEach(({ freq, delay }) => {
        setTimeout(() => {
          this.playTone(freq, 0.22, 'triangle', 0.2);
        }, delay);
      });
    } catch (_) {}
  }

  private playWicketSound() {
    if (!this.soundEnabled) return;
    this.initAudio();
    if (!this.audioCtx) return;

    try {
      // Wood crack timbre: quick sweep down with square/sawtooth
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(380, this.audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(90, this.audioCtx.currentTime + 0.18);

      gain.gain.setValueAtTime(0.25, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.18);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start();
      osc.stop(this.audioCtx.currentTime + 0.18);
    } catch (_) {}
  }

  private playOverBell() {
    if (!this.soundEnabled) return;
    this.initAudio();
    if (!this.audioCtx) return;

    try {
      this.playTone(987.77, 0.35, 'sine', 0.18); // B5 bell
      setTimeout(() => {
        this.playTone(1318.51, 0.45, 'sine', 0.18); // E6
      }, 100);
    } catch (_) {}
  }
}

export const audioHaptics = new AudioHapticsEngine();
