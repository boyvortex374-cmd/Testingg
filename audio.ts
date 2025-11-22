
// Decodes Base64 encoded string to Uint8Array
const decodeBase64 = (base64: string): Uint8Array => {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
};

// Decodes raw PCM data into an AudioBuffer
export const decodeAudioData = async (
  base64Data: string,
  audioContext: AudioContext
): Promise<AudioBuffer> => {
  const uint8Array = decodeBase64(base64Data);
  
  // Convert Uint8Array to Int16Array (PCM 16-bit)
  const int16Array = new Int16Array(uint8Array.buffer);
  
  // Create AudioBuffer (1 Channel, 24kHz sample rate as per Gemini specs)
  const buffer = audioContext.createBuffer(1, int16Array.length, 24000);
  const channelData = buffer.getChannelData(0);
  
  // Convert Int16 to Float32 [-1.0, 1.0]
  for (let i = 0; i < int16Array.length; i++) {
    channelData[i] = int16Array[i] / 32768.0;
  }
  
  return buffer;
};

// --- UI Sound Effects (Synthesized) ---

let sfxContext: AudioContext | null = null;

const getSfxContext = () => {
  if (!sfxContext) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      sfxContext = new AudioContextClass();
    }
  }
  return sfxContext;
};

export const playSuccessSound = () => {
  const ctx = getSfxContext();
  if (!ctx) return;
  
  if (ctx.state === 'suspended') ctx.resume();

  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.connect(gain);
  gain.connect(ctx.destination);

  // Nice "Ding" sound (Sine wave arpeggio)
  osc.type = 'sine';
  osc.frequency.setValueAtTime(523.25, t); // C5
  osc.frequency.exponentialRampToValueAtTime(1046.5, t + 0.1); // C6
  
  // Envelope
  gain.gain.setValueAtTime(0.05, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);

  osc.start(t);
  osc.stop(t + 0.4);
};

export const playErrorSound = () => {
  const ctx = getSfxContext();
  if (!ctx) return;

  if (ctx.state === 'suspended') ctx.resume();

  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.connect(gain);
  gain.connect(ctx.destination);

  // "Buzz" sound (Sawtooth wave sliding down)
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(150, t);
  osc.frequency.linearRampToValueAtTime(80, t + 0.25);
  
  // Envelope
  gain.gain.setValueAtTime(0.05, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

  osc.start(t);
  osc.stop(t + 0.25);
};
