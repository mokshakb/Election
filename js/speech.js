/**
 * Election Awareness Platform - Audio & Speech Synthesis Module
 * Web Speech API for Listen buttons & Web Audio API for authentic EVM buzzer
 */

class SoundSystem {
  constructor() {
    this.audioCtx = null;
    this.soundEnabled = true;
    this.synth = window.speechSynthesis || null;
    this.currentUtterance = null;
    this.activeSpeakerButton = null;
    this.activeHighlightedSection = null;

    // Initialize AudioContext on first user interaction to comply with browser autoplay policies
    document.addEventListener("click", () => this.initAudioContext(), { once: true });
    document.addEventListener("keydown", () => this.initAudioContext(), { once: true });
  }

  initAudioContext() {
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
  }

  toggleSoundFX() {
    this.soundEnabled = !this.soundEnabled;
    return this.soundEnabled;
  }

  /**
   * Generates the authentic Indian EVM long buzzer sound (~800Hz - 900Hz tone)
   */
  playEVMBuzzer(durationSec = 2.5) {
    if (!this.soundEnabled) return;
    try {
      this.initAudioContext();
      if (!this.audioCtx) return;

      if (this.audioCtx.state === "suspended") {
        this.audioCtx.resume();
      }

      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      // EVM tone characteristic: piercing mid-high continuous frequency
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(840, this.audioCtx.currentTime);

      // Volume envelope
      gain.gain.setValueAtTime(0.18, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + durationSec);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start();
      osc.stop(this.audioCtx.currentTime + durationSec);
    } catch (e) {
      console.warn("AudioContext error:", e);
    }
  }

  /**
   * Generates a subtle tactile button click tone
   */
  playClickTone() {
    if (!this.soundEnabled) return;
    try {
      this.initAudioContext();
      if (!this.audioCtx) return;

      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(600, this.audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(200, this.audioCtx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.15, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start();
      osc.stop(this.audioCtx.currentTime + 0.08);
    } catch (e) {
      console.warn("Click audio error:", e);
    }
  }

  /**
   * Generates celebratory chime for earning badges or certificate
   */
  playSuccessChime() {
    if (!this.soundEnabled) return;
    try {
      this.initAudioContext();
      if (!this.audioCtx) return;

      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime + idx * 0.1);
        gain.gain.setValueAtTime(0.12, this.audioCtx.currentTime + idx * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + idx * 0.1 + 0.3);
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start(this.audioCtx.currentTime + idx * 0.1);
        osc.stop(this.audioCtx.currentTime + idx * 0.1 + 0.3);
      });
    } catch (e) {
      console.warn("Chime error:", e);
    }
  }

  /**
   * Speaks given text using SpeechSynthesis with language auto-detection
   */
  speakText(text, lang = "en", buttonElement = null, sectionElement = null) {
    if (!this.synth) {
      alert("Text-to-speech is not supported on this browser.");
      return;
    }

    // If currently speaking this exact button, cancel/stop it
    if (this.synth.speaking && this.activeSpeakerButton === buttonElement) {
      this.stopSpeech();
      return;
    }

    // Stop previous utterance
    this.stopSpeech();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95; // slightly slower for maximum accessibility & clarity
    utterance.pitch = 1.0;

    // Pick best voice
    const voices = this.synth.getVoices();
    if (lang === "kn") {
      // Find Kannada voice or fallback to Indian English/Regional
      const knVoice = voices.find(v => v.lang.toLowerCase().includes("kn") || v.lang.toLowerCase().includes("kannada"));
      if (knVoice) {
        utterance.voice = knVoice;
      }
      utterance.lang = "kn-IN";
    } else {
      const enVoice = voices.find(v => v.lang.toLowerCase().includes("en-in") || v.lang.toLowerCase().includes("en_in")) 
        || voices.find(v => v.lang.toLowerCase().includes("en"));
      if (enVoice) {
        utterance.voice = enVoice;
      }
      utterance.lang = "en-IN";
    }

    // Visual indicators
    if (buttonElement) {
      this.activeSpeakerButton = buttonElement;
      buttonElement.classList.add("speaking");
      buttonElement.setAttribute("aria-pressed", "true");
    }

    if (sectionElement) {
      this.activeHighlightedSection = sectionElement;
      sectionElement.classList.add("is-narrating");
    }

    utterance.onend = () => {
      this.clearSpeechVisuals();
    };

    utterance.onerror = () => {
      this.clearSpeechVisuals();
    };

    this.currentUtterance = utterance;
    this.synth.speak(utterance);
  }

  stopSpeech() {
    if (this.synth) {
      this.synth.cancel();
    }
    this.clearSpeechVisuals();
  }

  clearSpeechVisuals() {
    if (this.activeSpeakerButton) {
      this.activeSpeakerButton.classList.remove("speaking");
      this.activeSpeakerButton.setAttribute("aria-pressed", "false");
      this.activeSpeakerButton = null;
    }
    if (this.activeHighlightedSection) {
      this.activeHighlightedSection.classList.remove("is-narrating");
      this.activeHighlightedSection = null;
    }
  }
}

// Global instance
window.soundSystem = new SoundSystem();
