/**
 * Voice Recognition Engine for Hands-Free Cricket Scoring
 * Uses Web Speech API native browser speech recognition
 * Hardened for Mobile Chrome / Safari with exponential backoff & loop protection.
 */

type VoiceScoreHandler = (action: {
  type: 'runs' | 'wide' | 'noball' | 'bye' | 'wicket' | 'undo';
  runs?: number;
}) => void;

// TypeScript interface for SpeechRecognition
interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
}

interface SpeechRecognitionEvent {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: {
      [index: number]: {
        transcript: string;
      };
    };
  };
}

class VoiceScoringEngine {
  private recognition: SpeechRecognitionInstance | null = null;
  private isListening: boolean = false;
  private onScoreCallback: VoiceScoreHandler | null = null;
  private onStatusChangeCallback: ((isListening: boolean, message: string) => void) | null = null;
  private restartTimeout: ReturnType<typeof setTimeout> | null = null;
  private restartAttempts: number = 0;
  private lastRestartTime: number = 0;

  constructor() {
    this.initRecognition();
  }

  private initRecognition() {
    if (typeof window === 'undefined') return;

    const SpeechRec = (window as unknown as { SpeechRecognition: new () => SpeechRecognitionInstance }).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition: new () => SpeechRecognitionInstance }).webkitSpeechRecognition;

    if (!SpeechRec) {
      return;
    }

    try {
      this.recognition = new SpeechRec();
      this.recognition.continuous = true;
      this.recognition.interimResults = false;
      this.recognition.lang = 'en-US';

      this.recognition.onresult = (event: SpeechRecognitionEvent) => {
        try {
          const lastResultIndex = event.results.length - 1;
          const transcript = event.results[lastResultIndex][0].transcript.trim().toLowerCase();
          this.processTranscript(transcript);
        } catch (e) {
          console.warn('Transcript processing error:', e);
        }
      };

      this.recognition.onerror = (event: { error: string }) => {
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          this.stop();
          this.notifyStatus(false, 'Microphone permission blocked');
        } else if (event.error === 'no-speech') {
          // Normal timeout on quiet matches, handled in onend
        } else {
          console.warn('Voice recognition notice:', event.error);
        }
      };

      this.recognition.onend = () => {
        if (this.isListening) {
          const now = Date.now();
          // Rate-limit restarts: if restarted more than 5 times in 5 seconds, back off
          if (now - this.lastRestartTime < 1000) {
            this.restartAttempts++;
          } else {
            this.restartAttempts = 0;
          }
          this.lastRestartTime = now;

          if (this.restartAttempts > 4) {
            this.isListening = false;
            this.notifyStatus(false, 'Voice paused (low audio input)');
            return;
          }

          if (this.restartTimeout) clearTimeout(this.restartTimeout);
          this.restartTimeout = setTimeout(() => {
            if (this.isListening && this.recognition) {
              try {
                this.recognition.start();
              } catch (_) {
                this.isListening = false;
                this.notifyStatus(false, 'Voice paused');
              }
            }
          }, 350);
        } else {
          this.notifyStatus(false, 'Voice inactive');
        }
      };
    } catch (err) {
      console.warn('Failed to init speech recognition:', err);
    }
  }

  public isSupported(): boolean {
    return !!this.recognition;
  }

  public start(onScore: VoiceScoreHandler, onStatusChange?: (isListening: boolean, message: string) => void) {
    if (!this.recognition) return false;

    this.onScoreCallback = onScore;
    if (onStatusChange) this.onStatusChangeCallback = onStatusChange;

    try {
      this.isListening = true;
      this.restartAttempts = 0;
      this.recognition.start();
      this.notifyStatus(true, 'Listening for cricket commands...');
      return true;
    } catch (err) {
      console.warn('Speech start warning:', err);
      return false;
    }
  }

  public stop() {
    this.isListening = false;
    if (this.restartTimeout) {
      clearTimeout(this.restartTimeout);
      this.restartTimeout = null;
    }
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (_) {}
    }
    this.notifyStatus(false, 'Voice scoring stopped');
  }

  public toggle(onScore: VoiceScoreHandler, onStatusChange?: (isListening: boolean, message: string) => void): boolean {
    if (this.isListening) {
      this.stop();
      return false;
    } else {
      return this.start(onScore, onStatusChange);
    }
  }

  private notifyStatus(listening: boolean, message: string) {
    if (this.onStatusChangeCallback) {
      this.onStatusChangeCallback(listening, message);
    }
  }

  /**
   * Natural cricket scoring terminology parser
   */
  private processTranscript(text: string) {
    if (!this.onScoreCallback) return;

    // Direct match runs
    if (text.includes('six') || text.includes('sixer') || text.includes('maximum') || text === '6') {
      this.onScoreCallback({ type: 'runs', runs: 6 });
      return;
    }
    if (text.includes('four') || text.includes('boundary') || text === '4') {
      this.onScoreCallback({ type: 'runs', runs: 4 });
      return;
    }
    if (text.includes('dot') || text.includes('dot ball') || text.includes('zero') || text === '0') {
      this.onScoreCallback({ type: 'runs', runs: 0 });
      return;
    }
    if (text.includes('single') || text.includes('one run') || text === '1') {
      this.onScoreCallback({ type: 'runs', runs: 1 });
      return;
    }
    if (text.includes('double') || text.includes('two runs') || text.includes('two') || text === '2') {
      this.onScoreCallback({ type: 'runs', runs: 2 });
      return;
    }
    if (text.includes('three runs') || text.includes('three') || text === '3') {
      this.onScoreCallback({ type: 'runs', runs: 3 });
      return;
    }

    // Dismissals & Extras
    if (text.includes('wicket') || text.includes('out') || text.includes('bowled') || text.includes('caught')) {
      this.onScoreCallback({ type: 'wicket' });
      return;
    }
    if (text.includes('wide')) {
      this.onScoreCallback({ type: 'wide', runs: 1 });
      return;
    }
    if (text.includes('no ball') || text.includes('noball')) {
      this.onScoreCallback({ type: 'noball', runs: 1 });
      return;
    }
    if (text.includes('undo') || text.includes('cancel last')) {
      this.onScoreCallback({ type: 'undo' });
      return;
    }
  }
}

export const voiceScoring = new VoiceScoringEngine();
