// Define types for SpeechRecognition API
interface SpeechRecognitionResult {
  [key: number]: {
    transcript: string;
  };
  isFinal: boolean;
}

interface SpeechRecognitionEvent {
  results: SpeechRecognitionResult[] & {
    [key: number]: SpeechRecognitionResult;
  };
  resultIndex: number;
  error?: string;
}

interface SpeechRecognition {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  continuous: boolean;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: SpeechRecognitionEvent) => void;
  onend: () => void;
  start: () => void;
  stop: () => void;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognition;
}

// Extend Window interface to include SpeechRecognition
declare global {
  interface Window {
    SpeechRecognition: SpeechRecognitionConstructor;
    webkitSpeechRecognition: SpeechRecognitionConstructor;
  }
}

// Speech recognition service
export class SpeechService {
  private recognition: SpeechRecognition | null = null;
  private isListening: boolean = false;
  private onResultCallback: ((text: string) => void) | null = null;
  private onErrorCallback: ((error: string) => void) | null = null;
  private finalTranscript: string = "";

  // Check if speech recognition is supported
  isSupported(): boolean {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = 
        window.SpeechRecognition || 
        window.webkitSpeechRecognition;
      return !!SpeechRecognition;
    }
    return false;
  }

  // Start speech recognition
  startRecognition(onResult: (text: string) => void, onError?: (error: string) => void): void {
    if (!this.isSupported()) {
      onError?.("Speech recognition not supported in this browser.");
      return;
    }

    // If already listening, stop first
    if (this.isListening) {
      this.stopRecognition();
    }
    
    this.isListening = true;
    this.onResultCallback = onResult;
    this.onErrorCallback = onError || null;
    this.finalTranscript = "";
    
    const SpeechRecognitionConstructor: SpeechRecognitionConstructor = 
      window.SpeechRecognition || 
      window.webkitSpeechRecognition;
    
    this.recognition = new SpeechRecognitionConstructor();
    this.recognition.lang = "en-US";
    this.recognition.interimResults = true;
    this.recognition.maxAlternatives = 1;
    this.recognition.continuous = false; // Set to false for better control

    this.recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interimTranscript = "";
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          this.finalTranscript += transcript + " ";
        } else {
          interimTranscript = transcript;
        }
      }
      
      // Call the callback with final + interim transcript
      const fullTranscript = (this.finalTranscript + interimTranscript).trim();
      this.onResultCallback?.(fullTranscript);
    };

    this.recognition.onerror = (event: SpeechRecognitionEvent) => {
      let errorMessage = "Speech recognition error";
      
      if (event.error) {
        switch (event.error) {
          case "no-speech":
            errorMessage = "No speech detected. Please try again.";
            break;
          case "audio-capture":
            errorMessage = "Microphone access denied or not available.";
            break;
          case "not-allowed":
            errorMessage = "Microphone access not allowed. Please enable microphone access.";
            break;
          case "network":
            errorMessage = "Network error occurred.";
            break;
          default:
            errorMessage = `Speech recognition error: ${event.error}`;
        }
      }
      
      this.onErrorCallback?.(errorMessage);
      this.isListening = false;
    };

    this.recognition.onend = () => {
      this.isListening = false;
    };

    try {
      this.recognition.start();
    } catch (error) {
      this.onErrorCallback?.(`Failed to start speech recognition: ${error}`);
      this.isListening = false;
    }
  }

  // Stop speech recognition
  stopRecognition(): void {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
      this.finalTranscript = "";
    }
  }

  // Check if currently listening
  getIsListening(): boolean {
    return this.isListening;
  }
}

// Export a singleton instance
export const speechService = new SpeechService();