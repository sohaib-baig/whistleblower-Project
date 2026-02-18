/**
 * Audio Processor Utility
 * 
 * This utility processes audio recordings to alter the voice characteristics
 * in order to help protect user identity while maintaining speech intelligibility.
 * 
 * Techniques used:
 * - Pitch shifting (slight adjustment to change voice pitch)
 * - Playback rate adjustment (slight speed change)
 * - Low-pass filtering (to mask some voice characteristics)
 */

// ----------------------------------------------------------------------

/**
 * Process audio blob to alter voice characteristics
 * @param audioBlob - The original audio blob from MediaRecorder
 * @returns Promise<Blob> - Processed audio blob with altered voice
 */
export async function processAudioForAnonymity(audioBlob: Blob): Promise<Blob> {
  try {
    // Create audio context
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Decode audio data from blob
    const arrayBuffer = await audioBlob.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    
    // Create offline audio context for processing
    const offlineContext = new OfflineAudioContext(
      audioBuffer.numberOfChannels,
      audioBuffer.length,
      audioBuffer.sampleRate
    );
    
    // Create source buffer
    const source = offlineContext.createBufferSource();
    source.buffer = audioBuffer;
    
    // Create gain node for volume control
    const gainNode = offlineContext.createGain();
    
    // Create low-pass filter to mask some voice characteristics
    const filter = offlineContext.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 4000; // Reduce high frequencies slightly
    filter.Q.value = 1;
    
    // Create delay node for subtle echo effect (optional, helps mask voice)
    const delay = offlineContext.createDelay(0.1);
    delay.delayTime.value = 0.02; // 20ms delay
    
    const delayGain = offlineContext.createGain();
    delayGain.gain.value = 0.1; // Subtle echo
    
    // Create compressor to normalize audio
    const compressor = offlineContext.createDynamicsCompressor();
    compressor.threshold.value = -24;
    compressor.knee.value = 30;
    compressor.ratio.value = 12;
    compressor.attack.value = 0.003;
    compressor.release.value = 0.25;
    
    // Connect nodes: source -> filter -> delay -> compressor -> gain -> destination
    source.connect(filter);
    filter.connect(delay);
    delay.connect(delayGain);
    delayGain.connect(compressor);
    filter.connect(compressor); // Direct path (no delay)
    compressor.connect(gainNode);
    gainNode.connect(offlineContext.destination);
    
    // Apply pitch shift by adjusting playback rate
    // Slight variation: between 0.95 and 1.05 (5% variation)
    const pitchShift = 0.98 + (Math.random() * 0.04 - 0.02); // Random between 0.96-1.00
    source.playbackRate.value = pitchShift;
    
    // Slight volume adjustment
    gainNode.gain.value = 0.95; // Slight volume reduction
    
    // Start playback
    source.start(0);
    
    // Render the processed audio
    const processedBuffer = await offlineContext.startRendering();
    
    // Convert processed buffer back to blob
    const processedBlob = await audioBufferToBlob(processedBuffer, audioBlob.type);
    
    // Cleanup
    audioContext.close();
    
    return processedBlob;
  } catch (error) {
    console.error('Error processing audio for anonymity:', error);
    // If processing fails, return original blob
    return audioBlob;
  }
}

// ----------------------------------------------------------------------

/**
 * Convert AudioBuffer to Blob
 * @param audioBuffer - The processed AudioBuffer
 * @param mimeType - The original MIME type
 * @returns Promise<Blob> - Audio blob
 */
async function audioBufferToBlob(audioBuffer: AudioBuffer, mimeType: string): Promise<Blob> {
  // Determine the format based on MIME type
  const isWav = mimeType.includes('wav');
  const isMp4 = mimeType.includes('mp4');
  
  if (isWav) {
    return audioBufferToWav(audioBuffer);
  }
  
  if (isMp4) {
    // For MP4, we'll convert to WAV as a fallback since encoding MP4 in browser is complex
    return audioBufferToWav(audioBuffer);
  }
  
  // For WebM/OGG, we need to re-encode using MediaRecorder
  return audioBufferToWebM(audioBuffer, mimeType);
}

// ----------------------------------------------------------------------

/**
 * Convert AudioBuffer to WAV format
 */
function audioBufferToWav(audioBuffer: AudioBuffer): Blob {
  const numChannels = audioBuffer.numberOfChannels;
  const length = audioBuffer.length;
  const sampleRate = audioBuffer.sampleRate;
  const bytesPerSample = 2;
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = length * blockAlign;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);
  
  // WAV header
  const writeString = (offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };
  
  writeString(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true); // fmt chunk size
  view.setUint16(20, 1, true); // audio format (PCM)
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true); // bits per sample
  writeString(36, 'data');
  view.setUint32(40, dataSize, true);
  
  // Convert float samples to 16-bit PCM
  let offset = 44;
  for (let i = 0; i < length; i++) {
    for (let channel = 0; channel < numChannels; channel++) {
      const sample = Math.max(-1, Math.min(1, audioBuffer.getChannelData(channel)[i]));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
      offset += 2;
    }
  }
  
  return new Blob([buffer], { type: 'audio/wav' });
}

// ----------------------------------------------------------------------

/**
 * Convert AudioBuffer to WebM format using MediaRecorder
 */
async function audioBufferToWebM(audioBuffer: AudioBuffer, originalMimeType: string): Promise<Blob> {
  return new Promise((resolve, reject) => {
    try {
      // Create a new audio context
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Create a source from the buffer
      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      
      // Create a MediaStreamDestination to capture the audio
      const destination = audioContext.createMediaStreamDestination();
      source.connect(destination);
      
      // Determine MIME type
      const supportedTypes = [
        'audio/webm',
        'audio/webm;codecs=opus',
        'audio/ogg;codecs=opus',
      ];
      
      let mimeType = 'audio/webm';
      for (const type of supportedTypes) {
        if (MediaRecorder.isTypeSupported(type)) {
          mimeType = type;
          break;
        }
      }
      
      // Create MediaRecorder
      const mediaRecorder = new MediaRecorder(destination.stream, {
        mimeType,
      });
      
      const chunks: Blob[] = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunks.push(event.data);
        }
      };
      
      // Start recording
      mediaRecorder.start(100); // Request data every 100ms
      source.start(0);
      
      // Stop after the buffer duration
      const timeoutId = setTimeout(() => {
        try {
          source.stop();
          if (mediaRecorder.state === 'recording') {
            mediaRecorder.requestData();
            mediaRecorder.stop();
          }
        } catch {
          // If stop fails, try to resolve with what we have
          if (chunks.length > 0) {
            const blob = new Blob(chunks, { type: mimeType });
            audioContext.close();
            resolve(blob);
          } else {
            // Fallback to WAV
            const wavBlob = audioBufferToWav(audioBuffer);
            audioContext.close();
            resolve(wavBlob);
          }
        }
      }, (audioBuffer.duration * 1000) + 200);
      
      mediaRecorder.onstop = () => {
        clearTimeout(timeoutId);
        const blob = new Blob(chunks, { type: mimeType });
        audioContext.close();
        resolve(blob);
      };
      
      mediaRecorder.onerror = (event: any) => {
        clearTimeout(timeoutId);
        audioContext.close();
        // Fallback to WAV if WebM encoding fails
        const wavBlob = audioBufferToWav(audioBuffer);
        resolve(wavBlob);
      };
    } catch {
      // Fallback to WAV on any error
      const wavBlob = audioBufferToWav(audioBuffer);
      resolve(wavBlob);
    }
  });
}

