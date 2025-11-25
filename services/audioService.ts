
// Simple synthesizer using Web Audio API to avoid external asset dependencies
class AudioService {
  private context: AudioContext | null = null;
  private enabled: boolean = true;

  constructor() {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.context = new AudioContextClass();
    } catch (e) {
      console.warn("Web Audio API not supported");
      this.enabled = false;
    }
  }

  private playTone(frequency: number, type: OscillatorType, duration: number, startTime: number = 0, volume: number = 0.1) {
    if (!this.enabled || !this.context) return;

    // Resume context if suspended (browser policy)
    if (this.context.state === 'suspended') {
      this.context.resume();
    }

    const osc = this.context.createOscillator();
    const gainNode = this.context.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(frequency, this.context.currentTime + startTime);

    gainNode.gain.setValueAtTime(volume, this.context.currentTime + startTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + startTime + duration);

    osc.connect(gainNode);
    gainNode.connect(this.context.destination);

    osc.start(this.context.currentTime + startTime);
    osc.stop(this.context.currentTime + startTime + duration);
  }

  public playSwap() {
    this.playTone(300, 'sine', 0.1);
  }

  public playMatch(combo: number = 1) {
    // 限制最高音调变化，防止过于刺耳
    const effectiveCombo = Math.min(combo, 8);
    
    // 基础频率随连击升高: 400, 480, 560...
    const baseFreq = 400 + (effectiveCombo - 1) * 80;

    // 播放主和弦 (大三和弦)
    this.playTone(baseFreq, 'sine', 0.15, 0);
    this.playTone(baseFreq * 1.25, 'sine', 0.15, 0.05); // Major 3rd
    this.playTone(baseFreq * 1.5, 'sine', 0.2, 0.1);   // Perfect 5th

    // 3连击以上增加清脆的高音
    if (effectiveCombo >= 2) {
       this.playTone(baseFreq * 2, 'triangle', 0.1, 0, 0.05);
    }

    // 5连击以上增加更丰富的“奖励感”音效
    if (effectiveCombo >= 4) {
       this.playTone(baseFreq * 0.5, 'square', 0.2, 0, 0.05); // 低音厚度
       this.playTone(baseFreq * 2.5, 'sine', 0.3, 0.1, 0.05); // 高音泛音
    }
  }

  public playInvalid() {
    this.playTone(150, 'sawtooth', 0.2);
    this.playTone(100, 'sawtooth', 0.2, 0.1);
  }

  public playLevelUp() {
    this.playTone(500, 'square', 0.1, 0);
    this.playTone(700, 'square', 0.1, 0.1);
    this.playTone(900, 'square', 0.1, 0.2);
    this.playTone(1200, 'square', 0.4, 0.3);
  }
}

export const audioService = new AudioService();
