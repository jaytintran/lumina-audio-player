import { create } from 'zustand';
import type { Track } from '../db/schema';
import { audioEngine } from '../services/audioEngine';
import { db } from '../db/db';

export type RepeatMode = 'off' | 'all' | 'one';
export type VisualizerMode = 'bars' | 'wave' | 'circle';

interface PlayerState {
  currentTrack: Track | null;
  queue: Track[];
  originalQueue: Track[];
  history: Track[];
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  playbackRate: number;
  isShuffle: boolean;
  repeatMode: RepeatMode;
  isNowPlayingOpen: boolean;
  isQueueOpen: boolean;
  visualizerMode: VisualizerMode;

  // Actions
  playTrack: (track: Track, newQueue?: Track[]) => Promise<void>;
  togglePlay: () => Promise<void>;
  nextTrack: () => Promise<void>;
  prevTrack: () => Promise<void>;
  seek: (seconds: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  setPlaybackRate: (rate: number) => void;
  toggleShuffle: () => void;
  cycleRepeatMode: () => void;
  addToQueue: (tracks: Track | Track[]) => void;
  playNext: (tracks: Track | Track[]) => void;
  removeFromQueue: (index: number) => void;
  reorderQueue: (fromIndex: number, toIndex: number) => void;
  clearQueue: () => void;
  setNowPlayingOpen: (open: boolean) => void;
  setQueueOpen: (open: boolean) => void;
  setVisualizerMode: (mode: VisualizerMode) => void;
  toggleFavoriteCurrent: () => Promise<void>;
}

export const usePlayerStore = create<PlayerState>((set, get) => {
  // Initialize audioEngine callbacks
  audioEngine.setCallbacks({
    onTimeUpdate: (currentTime, duration) => {
      set({ currentTime, duration: duration || get().currentTrack?.duration || 0 });
    },
    onEnded: () => {
      const { repeatMode, currentTrack } = get();
      if (repeatMode === 'one' && currentTrack) {
        audioEngine.seek(0);
        audioEngine.play();
      } else {
        get().nextTrack();
      }
    },
    onError: (err) => {
      console.error('Audio engine error in store:', err);
      set({ isPlaying: false });
    },
  });

  audioEngine.bindMediaSessionActions({
    onPlay: () => get().togglePlay(),
    onPause: () => get().togglePlay(),
    onPrevioustrack: () => get().prevTrack(),
    onNexttrack: () => get().nextTrack(),
    onSeekto: (details) => {
      if (details.seekTime !== undefined) {
        get().seek(details.seekTime);
      }
    },
  });

  return {
    currentTrack: null,
    queue: [],
    originalQueue: [],
    history: [],
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 0.85,
    isMuted: false,
    playbackRate: 1.0,
    isShuffle: false,
    repeatMode: 'off',
    isNowPlayingOpen: false,
    isQueueOpen: false,
    visualizerMode: 'bars',

    playTrack: async (track: Track, newQueue?: Track[]) => {
      const { currentTrack, history } = get();
      const updatedHistory = currentTrack ? [currentTrack, ...history.slice(0, 50)] : history;

      let queue = get().queue;
      let originalQueue = get().originalQueue;

      if (newQueue) {
        originalQueue = [...newQueue];
        const trackIndex = newQueue.findIndex(t => t.id === track.id);
        if (trackIndex !== -1) {
          queue = newQueue.slice(trackIndex + 1);
        } else {
          queue = [...newQueue];
        }
      }

      set({
        currentTrack: track,
        queue,
        originalQueue,
        history: updatedHistory,
        isPlaying: true,
        currentTime: 0,
        duration: track.duration || 0,
      });

      // Update play count & lastPlayed in DB
      if (track.id) {
        const playCount = (track.playCount || 0) + 1;
        db.tracks.update(track.id, {
          playCount,
          lastPlayed: Date.now(),
        }).catch(() => {});
      }

      try {
        await audioEngine.loadAndPlay(track);
      } catch (err) {
        console.error('Failed to play track:', err);
        set({ isPlaying: false });
      }
    },

    togglePlay: async () => {
      const { isPlaying, currentTrack, queue } = get();
      if (!currentTrack) {
        if (queue.length > 0) {
          await get().playTrack(queue[0]);
        }
        return;
      }

      if (isPlaying) {
        audioEngine.pause();
        set({ isPlaying: false });
      } else {
        await audioEngine.play();
        set({ isPlaying: true });
      }
    },

    nextTrack: async () => {
      const { queue, originalQueue, repeatMode } = get();

      if (queue.length > 0) {
        const next = queue[0];
        const remaining = queue.slice(1);
        set({ queue: remaining });
        await get().playTrack(next);
      } else if (repeatMode === 'all' && originalQueue.length > 0) {
        const next = originalQueue[0];
        const remaining = originalQueue.slice(1);
        set({ queue: remaining });
        await get().playTrack(next);
      } else {
        set({ isPlaying: false, currentTime: 0 });
      }
    },

    prevTrack: async () => {
      const { currentTime, history, currentTrack } = get();
      // If played more than 3 seconds, seek back to beginning of current track
      if (currentTime > 3 || history.length === 0) {
        get().seek(0);
        return;
      }

      const prev = history[0];
      const newHistory = history.slice(1);
      if (currentTrack) {
        set({ queue: [currentTrack, ...get().queue] });
      }
      set({ history: newHistory });
      await get().playTrack(prev);
    },

    seek: (seconds: number) => {
      audioEngine.seek(seconds);
      set({ currentTime: seconds });
    },

    setVolume: (volume: number) => {
      const clamped = Math.max(0, Math.min(1, volume));
      audioEngine.setVolume(clamped);
      set({ volume: clamped, isMuted: clamped === 0 });
    },

    toggleMute: () => {
      const { isMuted, volume } = get();
      const newMuted = !isMuted;
      audioEngine.setMuted(newMuted);
      set({ isMuted: newMuted });
      if (!newMuted && volume === 0) {
        audioEngine.setVolume(0.5);
        set({ volume: 0.5 });
      }
    },

    setPlaybackRate: (rate: number) => {
      audioEngine.setPlaybackRate(rate);
      set({ playbackRate: rate });
    },

    toggleShuffle: () => {
      const { isShuffle, queue, originalQueue } = get();
      if (!isShuffle) {
        // Shuffle remaining queue
        const shuffled = [...queue].sort(() => Math.random() - 0.5);
        set({ isShuffle: true, queue: shuffled });
      } else {
        // Restore order from originalQueue
        const currentIds = new Set(queue.map(t => t.id));
        const unShuffled = originalQueue.filter(t => currentIds.has(t.id));
        set({ isShuffle: false, queue: unShuffled });
      }
    },

    cycleRepeatMode: () => {
      const { repeatMode } = get();
      const nextMode: RepeatMode = repeatMode === 'off' ? 'all' : repeatMode === 'all' ? 'one' : 'off';
      set({ repeatMode: nextMode });
    },

    addToQueue: (tracks: Track | Track[]) => {
      const trackArr = Array.isArray(tracks) ? tracks : [tracks];
      set(state => ({
        queue: [...state.queue, ...trackArr],
        originalQueue: [...state.originalQueue, ...trackArr],
      }));
    },

    playNext: (tracks: Track | Track[]) => {
      const trackArr = Array.isArray(tracks) ? tracks : [tracks];
      set(state => ({
        queue: [...trackArr, ...state.queue],
      }));
    },

    removeFromQueue: (index: number) => {
      set(state => ({
        queue: state.queue.filter((_, i) => i !== index),
      }));
    },

    reorderQueue: (fromIndex: number, toIndex: number) => {
      set(state => {
        const newQueue = [...state.queue];
        const [moved] = newQueue.splice(fromIndex, 1);
        newQueue.splice(toIndex, 0, moved);
        return { queue: newQueue };
      });
    },

    clearQueue: () => {
      set({ queue: [] });
    },

    setNowPlayingOpen: (open: boolean) => {
      set({ isNowPlayingOpen: open });
    },

    setQueueOpen: (open: boolean) => {
      set({ isQueueOpen: open });
    },

    setVisualizerMode: (mode: VisualizerMode) => {
      set({ visualizerMode: mode });
    },

    toggleFavoriteCurrent: async () => {
      const { currentTrack } = get();
      if (currentTrack?.id) {
        const isFavorite = !currentTrack.isFavorite;
        await db.tracks.update(currentTrack.id, { isFavorite });
        set({ currentTrack: { ...currentTrack, isFavorite } });
      }
    },
  };
});
