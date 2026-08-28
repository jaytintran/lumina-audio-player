declare global {
  interface Window {
    onYouTubeIframeAPIReady?: () => void;
    YT?: any;
  }
}

export type YouTubePlayerStateChange = (state: number) => void;
export type YouTubeTimeUpdate = (currentTime: number, duration: number) => void;

class YouTubePlayerService {
  private static instance: YouTubePlayerService;
  private player: any = null;
  private currentVideoId: string | null = null;
  private pollTimer: NodeJS.Timeout | null = null;

  private onTimeUpdateCallback?: YouTubeTimeUpdate;
  private onEndedCallback?: () => void;
  private onErrorCallback?: (err: any) => void;

  private constructor() {
    this.ensureContainer();
    this.loadIframeAPI();
  }

  public static getInstance(): YouTubePlayerService {
    if (!YouTubePlayerService.instance) {
      YouTubePlayerService.instance = new YouTubePlayerService();
    }
    return YouTubePlayerService.instance;
  }

  private ensureContainer(): void {
    if (typeof document === 'undefined') return;
    let container = document.getElementById('lumina-yt-container') as HTMLDivElement | null;
    if (!container) {
      container = document.createElement('div');
      container.id = 'lumina-yt-container';
      // Visible to browser compositing engine so audio decoding is never throttled,
      // but clipped to 1px on edge so it is completely invisible to user
      container.style.position = 'fixed';
      container.style.bottom = '0px';
      container.style.right = '0px';
      container.style.width = '200px';
      container.style.height = '200px';
      container.style.clipPath = 'inset(100%)';
      container.style.pointerEvents = 'none';
      container.style.zIndex = '-9999';

      const playerDiv = document.createElement('div');
      playerDiv.id = 'lumina-yt-player';
      container.appendChild(playerDiv);
      document.body.appendChild(container);
    }
  }

  private loadIframeAPI(): Promise<void> {
    return new Promise((resolve) => {
      if (window.YT && window.YT.Player) {
        resolve();
        return;
      }

      const existingScript = document.getElementById('youtube-iframe-api-script');
      if (!existingScript) {
        const tag = document.createElement('script');
        tag.id = 'youtube-iframe-api-script';
        tag.src = 'https://www.youtube.com/iframe_api';
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag?.parentNode?.insertBefore(tag, firstScriptTag);
      }

      const checkInterval = setInterval(() => {
        if (window.YT && window.YT.Player) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 50);

      const prevReady = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        prevReady?.();
        clearInterval(checkInterval);
        resolve();
      };
    });
  }

  private initPlayer(videoId: string, startTime = 0): Promise<void> {
    return new Promise((resolve) => {
      this.ensureContainer();

      if (this.player && typeof this.player.loadVideoById === 'function') {
        try {
          this.player.loadVideoById({
            videoId,
            startSeconds: startTime,
          });
          this.player.playVideo();
          this.startPolling();
          resolve();
          return;
        } catch (e) {
          console.warn('Could not load in existing player, rebuilding...', e);
        }
      }

      try {
        this.player = new window.YT.Player('lumina-yt-player', {
          height: '200',
          width: '200',
          videoId,
          playerVars: {
            autoplay: 1,
            controls: 0,
            disablekb: 1,
            fs: 0,
            modestbranding: 1,
            playsinline: 1,
            rel: 0,
            start: startTime,
            enablejsapi: 1,
          },
          events: {
            onReady: (event: any) => {
              event.target.playVideo();
              this.startPolling();
              resolve();
            },
            onStateChange: (event: any) => {
              this.handleStateChange(event.data);
            },
            onError: (e: any) => {
              console.error('YouTube Player error:', e);
              this.onErrorCallback?.(e);
              resolve();
            },
          },
        });
      } catch (err) {
        console.error('Error initializing YouTube Player:', err);
        resolve();
      }
    });
  }

  private handleStateChange(state: number): void {
    // 0: Ended, 1: Playing, 2: Paused, 3: Buffering
    if (state === 1) {
      this.startPolling();
    } else if (state === 2 || state === 0) {
      this.stopPolling();
    }

    if (state === 0) {
      this.onEndedCallback?.();
    }
  }

  private startPolling(): void {
    this.stopPolling();
    this.pollTimer = setInterval(() => {
      if (this.player) {
        try {
          const current = typeof this.player.getCurrentTime === 'function' ? this.player.getCurrentTime() : 0;
          const duration = typeof this.player.getDuration === 'function' ? this.player.getDuration() : 0;
          if (duration > 0) {
            this.onTimeUpdateCallback?.(current || 0, duration);
          }
        } catch {}
      }
    }, 250);
  }

  private stopPolling(): void {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
  }

  public setCallbacks(callbacks: {
    onTimeUpdate?: YouTubeTimeUpdate;
    onEnded?: () => void;
    onError?: (err: any) => void;
  }): void {
    this.onTimeUpdateCallback = callbacks.onTimeUpdate;
    this.onEndedCallback = callbacks.onEnded;
    this.onErrorCallback = callbacks.onError;
  }

  public async loadAndPlay(videoId: string, startTime = 0): Promise<void> {
    this.currentVideoId = videoId;
    await this.loadIframeAPI();
    await this.initPlayer(videoId, startTime);
  }

  public play(): void {
    if (this.player && typeof this.player.playVideo === 'function') {
      this.player.playVideo();
    }
  }

  public pause(): void {
    if (this.player && typeof this.player.pauseVideo === 'function') {
      this.player.pauseVideo();
    }
    this.stopPolling();
  }

  public seek(seconds: number): void {
    if (this.player && typeof this.player.seekTo === 'function') {
      this.player.seekTo(seconds, true);
    }
  }

  public setVolume(volume: number): void {
    // YouTube volume is 0 - 100
    if (this.player && typeof this.player.setVolume === 'function') {
      this.player.setVolume(Math.round(Math.max(0, Math.min(1, volume)) * 100));
    }
  }

  public setMuted(muted: boolean): void {
    if (this.player) {
      if (muted && typeof this.player.mute === 'function') {
        this.player.mute();
      } else if (!muted && typeof this.player.unMute === 'function') {
        this.player.unMute();
      }
    }
  }

  public setPlaybackRate(rate: number): void {
    if (this.player && typeof this.player.setPlaybackRate === 'function') {
      this.player.setPlaybackRate(rate);
    }
  }

  public getCurrentVideoId(): string | null {
    return this.currentVideoId;
  }
}

export const youtubePlayerService = YouTubePlayerService.getInstance();
