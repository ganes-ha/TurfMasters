/**
 * Voice Recognition Engine for Hands-Free Cricket Scoring
 * Uses Web Speech API native browser speech recognition
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

  constructor() {
    this.initRecognition();
  }

  private initRecognition() {
    if (typeof window === 'undefined') return;

    const SpeechRec = (window as unknown as { SpeechRecognition: new () => SpeechRecognitionInstance }).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition: new () => SpeechRecognitionInstance }).webkitSpeechRecognition;

    if (!SpeechRec) {
      console.warn('Speech Recognition not supported in this browser.');
      return;
    }

    try {
      this.recognition = new SpeechRec();
      this.recognition.continuous = true;
      this.recognition.interimResults = false;
      this.recognition.lang = 'en-US';

      this.recognition.onresult = (event: SpeechRecognitionEvent) => {
        const lastResultIndex = event.results.length - 1;
        const transcript = event.results[lastResultIndex][0].transcript.trim().toLowerCase();
        this.processTranscript(transcript);
      };

      this.recognition.onerror = (event: { error: string }) => {
        console.warn('Voice recognition error:', event.error);
        if (event.error === 'not-allowed') {
          this.stop();
          this.notifyStatus(false, 'Microphone permission blocked');
        }
      };

      this.recognition.onend = () => {
        if (this.isListening) {
          // Restart if still marked as listening (mobile speech timeout workaround)
          try {
            this.recognition?.start();
          } catch (_) {
            this.isListening = false;
            this.notifyStatus(false, 'Voice paused');
          }
        } else {
          this.notifyStatus(false, 'Voice inactive');
        }
      };
    } catch (err) {
      console.error('Failed to init speech recognition:', err);
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
      this.recognition.start();
      this.isListening = true;
      this.notifyStatus(true, 'Listening for voice scores...');
      return true;
    } catch (err) {
      console.error('Error starting voice recognition:', err);
      return false;
    }
  }

  public stop() {
    this.isListening = false;
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (_) {}
    }
    this.notifyStatus(false, 'Voice stopped');
  }

  public toggle(onScore: VoiceScoreHandler, onStatusChange?: (isListening: boolean, message: string) => void): boolean {
    if (this.isListening) {
      this.stop();
      return false;
    } else {
      return this.start(onScore, onStatusChange);
    }
  }

  private notifyStatus(listening: boolean, msg: string) {
    if (this.onStatusChangeCallback) {
      this.onStatusChangeCallback(listening, msg);
    }
  }

  private processTranscript(text: string) {
    if (!this.onScoreCallback) return;

    // Analyze spoken words
    if (text.includes('dot') || text.includes('zero') || text.includes('no run') || text === '0') {
      this.onScoreCallback({ type: 'runs', runs: 0 });
      this.notifyStatus(true, `Heard: "Dot Ball (0)"`);
    } else if (text.includes('single') || text.includes('one run') || text === 'one' || text === '1') {
      this.onScoreCallback({ type: 'runs', runs: 1 });
      this.notifyStatus(true, `Heard: "1 Run"`);
    } else if (text.includes('double') || text.includes('two runs') || text === 'two' || text === '2') {
      this.onScoreCallback({ type: 'runs', runs: 2 });
      this.notifyStatus(true, `Heard: "2 Runs"`);
    } else if (text.includes('three') || text === '3') {
      this.onScoreCallback({ type: 'runs', runs: 3 });
      this.notifyStatus(true, `Heard: "3 Runs"`);
    } else if (text.includes('four') || text.includes('boundary') || text === '4') {
      this.onScoreCallback({ type: 'runs', runs: 4 });
      this.notifyStatus(true, `Heard: "FOUR (4)"`);
    } else if (text.includes('six') || text.includes('maximum') || text === '6') {
      this.onScoreCallback({ type: 'runs', runs: 6 });
      this.notifyStatus(true, `Heard: "SIX (6)"`);
    } else if (text.includes('wide')) {
      this.onScoreCallback({ type: 'wide' });
      this.notifyStatus(true, `Heard: "Wide Ball"`);
    } else if (text.includes('no ball') || text.includes('noball')) {
      this.onScoreCallback({ type: 'noball' });
      this.notifyStatus(true, `Heard: "No Ball"`);
    } else if (text.includes('bye')) {
      this.onScoreCallback({ type: 'bye', runs: 1 });
      this.notifyStatus(true, `Heard: "Bye"`);
    } else if (text.includes('out') || text.includes('wicket') || text.includes('bowled') || text.includes('caught')) {
      this.onScoreCallback({ type: 'wicket' });
      this.notifyStatus(true, `Heard: "Wicket Out"`);
    } else if (text.includes('undo')) {
      this.onScoreCallback({ type: 'undo' });
      this.notifyStatus(true, `Heard: "Undo"`);
    }
  }
}

export const voiceScoring = new VoiceScoringEngine();
