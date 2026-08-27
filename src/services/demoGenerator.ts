import { db } from '../db/db';
import { saveFile, calculateSHA256 } from '../db/opfs';
import type { Track } from '../db/schema';

// Helper to render an artistic dark gradient album art canvas to Blob
function createArtworkBlob(title: string, artist: string, color1: string, color2: string): Promise<Blob> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 600;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      resolve(new Blob());
      return;
    }

    // Background gradient
    const grad = ctx.createLinearGradient(0, 0, 600, 600);
    grad.addColorStop(0, color1);
    grad.addColorStop(1, color2);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 600, 600);

    // Glowing circles / shapes
    const radial = ctx.createRadialGradient(300, 300, 20, 300, 300, 280);
    radial.addColorStop(0, 'rgba(255, 255, 255, 0.25)');
    radial.addColorStop(0.5, 'rgba(255, 255, 255, 0.05)');
    radial.addColorStop(1, 'rgba(0, 0, 0, 0.5)');
    ctx.fillStyle = radial;
    ctx.beginPath();
    ctx.arc(300, 300, 260, 0, Math.PI * 2);
    ctx.fill();

    // Vinyl groove pattern
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 2;
    for (let r = 80; r < 240; r += 16) {
      ctx.beginPath();
      ctx.arc(300, 300, r, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Center badge
    ctx.fillStyle = '#09090b';
    ctx.beginPath();
    ctx.arc(300, 300, 70, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Text
    ctx.fillStyle = '#f4f4f5';
    ctx.font = 'bold 28px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(title, 300, 480);

    ctx.fillStyle = '#a1a1aa';
    ctx.font = '500 18px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(artist, 300, 520);

    canvas.toBlob((blob) => {
      resolve(blob || new Blob());
    }, 'image/jpeg', 0.92);
  });
}

// Convert AudioBuffer to 16-bit PCM WAV Blob
function audioBufferToWav(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;
  
  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;
  
  const numSamples = buffer.length;
  const dataSize = numSamples * blockAlign;
  const headerSize = 44;
  const totalSize = headerSize + dataSize;
  
  const arrayBuffer = new ArrayBuffer(totalSize);
  const view = new DataView(arrayBuffer);
  
  function writeString(offset: number, string: string) {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }
  
  writeString(0, 'RIFF');
  view.setUint32(4, totalSize - 8, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, format, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);
  writeString(36, 'data');
  view.setUint32(40, dataSize, true);
  
  let offset = 44;
  for (let i = 0; i < numSamples; i++) {
    for (let channel = 0; channel < numChannels; channel++) {
      const sample = Math.max(-1, Math.min(1, buffer.getChannelData(channel)[i]));
      const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
      view.setInt16(offset, intSample, true);
      offset += 2;
    }
  }
  
  return new Blob([arrayBuffer], { type: 'audio/wav' });
}

// Generate ambient synth chord progression with OfflineAudioContext
async function generateSynthesizedAudio(durationSec: number, rootFreq: number, chordType: 'major' | 'minor' | 'dreamy'): Promise<Blob> {
  const sampleRate = 44100;
  const offlineCtx = new OfflineAudioContext(2, sampleRate * durationSec, sampleRate);
  
  const now = 0;
  const intervals = chordType === 'dreamy' ? [0, 4, 7, 11, 14] : chordType === 'minor' ? [0, 3, 7, 10] : [0, 4, 7, 12];
  
  intervals.forEach((semitones, idx) => {
    const freq = rootFreq * Math.pow(2, semitones / 12);
    
    // Main warm oscillator
    const osc = offlineCtx.createOscillator();
    osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
    osc.frequency.setValueAtTime(freq, now);
    
    // Sub-oscillator for warmth
    const subOsc = offlineCtx.createOscillator();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(freq / 2, now);
    
    // Gain envelope with smooth attack and decay
    const gain = offlineCtx.createGain();
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.12 / intervals.length, now + 1.5 + idx * 0.4);
    gain.gain.setValueAtTime(0.12 / intervals.length, durationSec - 2.5);
    gain.gain.exponentialRampToValueAtTime(0.0001, durationSec);
    
    // Panning
    const panner = offlineCtx.createStereoPanner();
    panner.pan.value = (idx / (intervals.length - 1)) * 1.4 - 0.7;
    
    osc.connect(gain);
    subOsc.connect(gain);
    gain.connect(panner);
    panner.connect(offlineCtx.destination);
    
    osc.start(now);
    subOsc.start(now);
    osc.stop(durationSec);
    subOsc.stop(durationSec);
  });

  const renderedBuffer = await offlineCtx.startRendering();
  return audioBufferToWav(renderedBuffer);
}

export interface DemoTrackConfig {
  title: string;
  artist: string;
  album: string;
  genre: string;
  year: number;
  duration: number;
  rootFreq: number;
  chordType: 'major' | 'minor' | 'dreamy';
  color1: string;
  color2: string;
}

export const SAMPLE_TRACK_CONFIGS: DemoTrackConfig[] = [
  {
    title: 'Neon Horizon',
    artist: 'Lumina Soundscapes',
    album: 'Synthetic Dreams',
    genre: 'Synthwave',
    year: 2026,
    duration: 22,
    rootFreq: 220, // A3
    chordType: 'dreamy',
    color1: '#0f172a',
    color2: '#06b6d4',
  },
  {
    title: 'Celestial Lofi',
    artist: 'Astral Nomad',
    album: 'Midnight Orbit',
    genre: 'Ambient / Chill',
    year: 2026,
    duration: 20,
    rootFreq: 261.63, // C4
    chordType: 'major',
    color1: '#1e1b4b',
    color2: '#8b5cf6',
  },
  {
    title: 'Cyber Pulse',
    artist: 'Hyperion Zero',
    album: 'Quantum Shift',
    genre: 'Electronic',
    year: 2026,
    duration: 24,
    rootFreq: 174.61, // F3
    chordType: 'minor',
    color1: '#18181b',
    color2: '#10b981',
  },
];

/**
 * Generates and seeds demo tracks directly into OPFS & Dexie DB
 */
export async function seedDemoTracks(): Promise<Track[]> {
  const createdTracks: Track[] = [];

  for (let i = 0; i < SAMPLE_TRACK_CONFIGS.length; i++) {
    const config = SAMPLE_TRACK_CONFIGS[i];
    
    // Generate audio WAV blob
    const audioBlob = await generateSynthesizedAudio(config.duration, config.rootFreq, config.chordType);
    const audioHash = await calculateSHA256(audioBlob);
    
    // Check if already in DB
    const existing = await db.tracks.where('fileHash').equals(audioHash).first();
    if (existing) {
      createdTracks.push(existing);
      continue;
    }

    // Generate cover art blob
    const coverBlob = await createArtworkBlob(config.title, config.artist, config.color1, config.color2);
    const coverHash = await calculateSHA256(coverBlob);

    const fileKey = `audio/${audioHash}.wav`;
    const coverKey = `covers/${coverHash}.jpg`;

    await saveFile(fileKey, audioBlob);
    await saveFile(coverKey, coverBlob);

    const track: Track = {
      title: config.title,
      artist: config.artist,
      album: config.album,
      genre: config.genre,
      year: config.year,
      duration: config.duration,
      format: 'wav',
      bitrate: 1411,
      sampleRate: 44100,
      fileKey,
      fileHash: audioHash,
      coverKey,
      rating: 5,
      isFavorite: i === 0,
      playCount: 0,
      tags: ['demo', config.genre.toLowerCase()],
      order: i,
      dateAdded: Date.now(),
    };

    const id = await db.tracks.add(track);
    createdTracks.push({ ...track, id });
  }

  // Create a default playlist "Favorites & Chill"
  const existingPlaylist = await db.playlists.toCollection().first();
  if (!existingPlaylist && createdTracks.length > 0) {
    const playlistId = await db.playlists.add({
      name: '✨ Midnight Essentials',
      description: 'Handcrafted atmospheric tracks generated with Web Audio',
      order: 0,
      createdAt: Date.now(),
    });

    for (let i = 0; i < createdTracks.length; i++) {
      await db.trackPlaylists.add({
        trackId: createdTracks[i].id!,
        playlistId: Number(playlistId),
        order: i,
      });
    }
  }

  return createdTracks;
}
