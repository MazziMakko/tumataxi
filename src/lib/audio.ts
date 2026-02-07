/**
 * Lion Roar Sound Effect
 * Synthesized web audio API for optimal performance
 * No external files needed - generated on demand
 */

export function playLionRoar(): Promise<void> {
  return new Promise((resolve) => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Create roar sound using oscillators and noise
      const now = audioContext.currentTime;
      const duration = 1.5; // seconds
      
      // Create noise buffer for realistic roar texture
      const bufferSize = audioContext.sampleRate * duration;
      const noiseBuffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
      const noiseData = noiseBuffer.getChannelData(0);
      
      for (let i = 0; i < bufferSize; i++) {
        noiseData[i] = Math.random() * 2 - 1;
      }
      
      const noiseSource = audioContext.createBufferSource();
      noiseSource.buffer = noiseBuffer;
      
      // Low frequency oscillator for bass (roar foundation)
      const bassOscillator = audioContext.createOscillator();
      bassOscillator.type = 'sine';
      bassOscillator.frequency.setValueAtTime(80, now);
      bassOscillator.frequency.exponentialRampToValueAtTime(40, now + duration);
      
      // Mid frequency for body of roar
      const midOscillator = audioContext.createOscillator();
      midOscillator.type = 'sawtooth';
      midOscillator.frequency.setValueAtTime(150, now);
      midOscillator.frequency.exponentialRampToValueAtTime(60, now + duration);
      
      // Create gain nodes for volume control
      const bassGain = audioContext.createGain();
      const midGain = audioContext.createGain();
      const noiseGain = audioContext.createGain();
      const masterGain = audioContext.createGain();
      
      // Set up roaring effect - starts loud and fades
      bassGain.gain.setValueAtTime(0.4, now);
      bassGain.gain.exponentialRampToValueAtTime(0.05, now + duration);
      
      midGain.gain.setValueAtTime(0.3, now);
      midGain.gain.exponentialRampToValueAtTime(0.02, now + duration);
      
      noiseGain.gain.setValueAtTime(0.2, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.01, now + duration);
      
      masterGain.gain.setValueAtTime(0.5, now);
      masterGain.gain.exponentialRampToValueAtTime(0.1, now + duration - 0.1);
      masterGain.gain.linearRampToValueAtTime(0, now + duration);
      
      // Connect nodes
      bassOscillator.connect(bassGain);
      bassGain.connect(masterGain);
      
      midOscillator.connect(midGain);
      midGain.connect(masterGain);
      
      noiseSource.connect(noiseGain);
      noiseGain.connect(masterGain);
      
      masterGain.connect(audioContext.destination);
      
      // Start playback
      bassOscillator.start(now);
      midOscillator.start(now);
      noiseSource.start(now);
      
      // Stop at end
      bassOscillator.stop(now + duration);
      midOscillator.stop(now + duration);
      noiseSource.stop(now + duration);
      
      // Resolve promise when sound finishes
      setTimeout(resolve, duration * 1000);
    } catch (error) {
      console.warn('Could not play lion roar:', error);
      resolve(); // Fail gracefully
    }
  });
}

export function playSuccessChime(): Promise<void> {
  return new Promise((resolve) => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const now = audioContext.currentTime;
      
      // Two ascending notes for success chime
      const osc1 = audioContext.createOscillator();
      const osc2 = audioContext.createOscillator();
      const gain1 = audioContext.createGain();
      const gain2 = audioContext.createGain();
      const masterGain = audioContext.createGain();
      
      // First note: E (330 Hz)
      osc1.frequency.value = 330;
      osc1.type = 'sine';
      
      // Second note: G (392 Hz)
      osc2.frequency.value = 392;
      osc2.type = 'sine';
      
      const duration = 0.3;
      
      gain1.gain.setValueAtTime(0.3, now);
      gain1.gain.linearRampToValueAtTime(0, now + duration);
      
      gain2.gain.setValueAtTime(0, now);
      gain2.gain.linearRampToValueAtTime(0.3, now + duration / 2);
      gain2.gain.linearRampToValueAtTime(0, now + duration);
      
      masterGain.gain.setValueAtTime(0.3, now);
      masterGain.gain.linearRampToValueAtTime(0, now + duration);
      
      osc1.connect(gain1);
      osc2.connect(gain2);
      gain1.connect(masterGain);
      gain2.connect(masterGain);
      masterGain.connect(audioContext.destination);
      
      osc1.start(now);
      osc2.start(now + duration / 2);
      
      osc1.stop(now + duration);
      osc2.stop(now + duration);
      
      setTimeout(resolve, duration * 1000);
    } catch (error) {
      console.warn('Could not play chime:', error);
      resolve();
    }
  });
}
