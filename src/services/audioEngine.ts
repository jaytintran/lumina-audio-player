import type { Track } from '../db/schema';
import { readObjectUrl } from '../db/opfs';

export class AudioEngine {
  private static instance: AudioEngine;
  private audio: HTMLAudioElement;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private sourceNode: MediaElementAudioSourceNode | null = null;
  private isSourceConnected = false;
  private currentTrack: Track | null = null;
  private onTimeUpdateCallback?: (currentTime: number, duration: number) => void;
  private onEndedCallback?: () => void;
  private onErrorCallback?: (err: any) => void;

  private constructor() {
    this.audio = new Audio();
    this.audio.preload = 'auto';
    this.audio.crossOrigin = 'anonymous';

    this.audio.addEventListener('timeupdate', () => {
      this.onTimeUpdateCallback?.(this.audio.currentTime, this.audio.duration || 0);
    });

    this.audio.addEventListener('ended', () => {
      this.onEndedCallback?.();
    });

    this.audio.addEventListener('error', (e) => {
      console.error('Audio playback error:', e);
      this.onErrorCallback?.(e);
    });
  }

  public static getInstance(): AudioEngine {
    if (!AudioEngine.instance) {
      AudioEngine.instance = new AudioEngine();
    }
    return AudioEngine.instance;
  }

  private initWebAudio(): void {
    if (!this.audioContext) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioContext = new AudioContextClass();
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.8;

      if (!this.isSourceConnected) {
        try {
          this.sourceNode = this.audioContext.createMediaElementSource(this.audio);
          this.sourceNode.connect(this.analyser);
          this.analyser.connect(this.audioContext.destination);
          this.isSourceConnected = true;
        } catch (e) {
          console.warn('Could not connect MediaElementSourceNode:', e);
        }
      }
    }

    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
  }

  public async loadAndPlay(track: Track, startTime = 0): Promise<void> {
    this.initWebAudio();
    this.currentTrack = track;

    const audioUrl = await readObjectUrl(track.fileKey);
    if (!audioUrl) {
      throw new Error(`Audio file not found in OPFS: ${track.fileKey}`);
    }

    this.audio.src = audioUrl;
    this.audio.currentTime = startTime;

    try {
      await this.audio.play();
      this.updateMediaSession(track);
    } catch (err) {
      console.warn('Audio play failed or was interrupted:', err);
    }
  }

  public async play(): Promise<void> {
    this.initWebAudio();
    return this.audio.play();
  }

  public pause(): void {
    this.audio.pause();
  }

  public seek(seconds: number): void {
    if (!isNaN(seconds) && isFinite(seconds)) {
      this.audio.currentTime = Math.max(0, Math.min(seconds, this.audio.duration || 0));
    }
  }

  public setVolume(volume: number): void {
    this.audio.volume = Math.max(0, Math.min(1, volume));
  }

  public setMuted(muted: boolean): void {
    this.audio.muted = muted;
  }

  public setPlaybackRate(rate: number): void {
    this.audio.playbackRate = rate;
  }

  public getCurrentTrack(): Track | null {
    return this.currentTrack;
  }

  public getCurrentTime(): number {
    return this.audio.currentTime;
  }

  public getDuration(): number {
    return this.audio.duration || 0;
  }

  public isPaused(): boolean {
    return this.audio.paused;
  }

  public getFrequencyData(array: Uint8Array): void {
    if (this.analyser) {
      this.analyser.getByteFrequencyData(array);
    } else {
      array.fill(0);
    }
  }

  public getWaveformData(array: Uint8Array): void {
    if (this.analyser) {
      this.analyser.getByteTimeDomainData(array);
    } else {
      array.fill(128);
    }
  }

  public getAnalyserFrequencyBinCount(): number {
    return this.analyser ? this.analyser.frequencyBinCount : 128;
  }

  public setCallbacks(callbacks: {
    onTimeUpdate?: (currentTime: number, duration: number) => void;
    onEnded?: () => void;
    onError?: (err: any) => void;
  }): void {
    this.onTimeUpdateCallback = callbacks.onTimeUpdate;
    this.onEndedCallback = callbacks.onEnded;
    this.onErrorCallback = callbacks.onError;
  }

  private async updateMediaSession(track: Track): Promise<void> {
    if ('mediaSession' in navigator) {
      let artwork: MediaImage[] = [];
      if (track.coverKey) {
        const coverUrl = await readObjectUrl(track.coverKey);
        if (coverUrl) {
          artwork = [
            { src: coverUrl, sizes: '512x512', type: 'image/jpeg' },
          ];
        }
      }

      navigator.mediaSession.metadata = new MediaMetadata({
        title: track.title,
        artist: track.artist,
        album: track.album || 'Lumina Audio',
        artwork,
      });
    }
  }

  public bindMediaSessionActions(handlers: {
    onPlay: () => void;
    onPause: () => void;
    onPrevioustrack: () => void;
    onNexttrack: () => void;
    onSeekto: (details: MediaSessionActionDetails) => void;
  }): void {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.setActionHandler('play', handlers.onPlay);
      navigator.mediaSession.setActionHandler('pause', handlers.onPause);
      navigator.mediaSession.setActionHandler('previoustrack', handlers.onPrevioustrack);
      navigator.mediaSession.setActionHandler('nexttrack', handlers.onNexttrack);
      navigator.mediaSession.setActionHandler('seekto', handlers.onSeekto);
    }
  }
}

export const audioEngine = AudioEngine.getInstance();
