// Create a simple audio file for testing audio reactivity
// This is a placeholder - in a real implementation, we would use an actual audio file
// For now, we'll create a simple ambient sound using the Web Audio API

const audioContext = new (window.AudioContext || window.webkitAudioContext)();
const audioBuffer = audioContext.createBuffer(2, audioContext.sampleRate * 30, audioContext.sampleRate);

// Fill the buffer with some ambient technology-like sounds
for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
  const channelData = audioBuffer.getChannelData(channel);
  
  for (let i = 0; i < channelData.length; i++) {
    // Create a mix of sine waves at different frequencies
    const t = i / audioContext.sampleRate;
    
    // Base frequency modulation
    const baseMod = 0.1 * Math.sin(2 * Math.PI * 0.05 * t);
    
    // Main tone (low frequency pulsing)
    const mainTone = 0.3 * Math.sin(2 * Math.PI * (40 + 5 * baseMod) * t);
    
    // Higher harmonics
    const harmonic1 = 0.1 * Math.sin(2 * Math.PI * 120 * t);
    const harmonic2 = 0.05 * Math.sin(2 * Math.PI * 240 * t);
    
    // Occasional blips
    const blipFreq = 0.2; // Frequency of blips in Hz
    const blipWidth = 0.05; // Width of blips in seconds
    const blip = 0.2 * Math.exp(-Math.pow((t % (1/blipFreq)) / blipWidth, 2)) * Math.sin(2 * Math.PI * 500 * t);
    
    // Combine all sounds with some randomness for texture
    channelData[i] = mainTone + harmonic1 + harmonic2 + blip + 0.02 * (Math.random() * 2 - 1);
    
    // Apply overall envelope
    const fadeIn = Math.min(1, t / 2); // 2-second fade in
    const fadeOut = Math.min(1, (audioBuffer.duration - t) / 2); // 2-second fade out
    channelData[i] *= fadeIn * fadeOut;
  }
}

// Export the buffer as a WAV file
function exportWAV(audioBuffer) {
  const numOfChan = audioBuffer.numberOfChannels;
  const length = audioBuffer.length * numOfChan * 2;
  const buffer = new ArrayBuffer(44 + length);
  const view = new DataView(buffer);
  
  // Write WAV header
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + length, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numOfChan, true);
  view.setUint32(24, audioBuffer.sampleRate, true);
  view.setUint32(28, audioBuffer.sampleRate * numOfChan * 2, true);
  view.setUint16(32, numOfChan * 2, true);
  view.setUint16(34, 16, true);
  writeString(view, 36, 'data');
  view.setUint32(40, length, true);
  
  // Write audio data
  const data = new Float32Array(audioBuffer.length * numOfChan);
  let offset = 0;
  
  for (let i = 0; i < audioBuffer.length; i++) {
    for (let channel = 0; channel < numOfChan; channel++) {
      const sample = audioBuffer.getChannelData(channel)[i];
      data[offset++] = sample;
    }
  }
  
  floatTo16BitPCM(view, 44, data);
  
  return new Blob([view], { type: 'audio/wav' });
}

function writeString(view, offset, string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

function floatTo16BitPCM(output, offset, input) {
  for (let i = 0; i < input.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, input[i]));
    output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
  }
}

// Save the WAV file
const blob = exportWAV(audioBuffer);
const url = URL.createObjectURL(blob);

// Download the file
const a = document.createElement('a');
a.href = url;
a.download = 'ambient-technology.wav';
a.click();
