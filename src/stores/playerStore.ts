import { create } from 'zustand';
import type { Track } from '../db/schema';
import { audioEngine } from '../services/audioEngine';
import { db } from '../db/db';

export type RepeatMode = 'off' | 'all' | 'one';
export type VisualizerMode = 'bars' | 'wave' | 'circle';

interface PlayerState {
  currentTrack: Track | null;
  queue: Track[];               // The single unified queue
  currentIndex: number;         // Active index within the queue (-1 if empty)
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
  playQueueIndex: (index: number) => Promise<void>;
  shuffleQueue: () => void;
  clearHistory: () => void;
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
    currentIndex: -1,
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
      const updatedHistory = currentTrack
        ? [currentTrack, ...history.filter((h) => h.id !== currentTrack.id).slice(0, 50)]
        : history;

      let fullQueue: Track[];
      let targetIndex: number;

      if (newQueue && newQueue.length > 0) {
        fullQueue = [...newQueue];
        targetIndex = newQueue.findIndex((t) => t.id === track.id);
        if (targetIndex === -1) {
          fullQueue = [track, ...newQueue];
          targetIndex = 0;
        }
      } else {
        // Standalone track playback -> clear queue to just this track
        fullQueue = [track];
        targetIndex = 0;
      }

      set({
        currentTrack: track,
        queue: fullQueue,
        currentIndex: targetIndex,
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
      const { isPlaying, currentTrack, queue, currentIndex } = get();
      if (!currentTrack) {
        if (queue.length > 0) {
          const idx = currentIndex >= 0 ? currentIndex : 0;
          await get().playQueueIndex(idx);
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
      const { queue, currentIndex, repeatMode } = get();

      if (queue.length === 0) {
        set({ isPlaying: false, currentTime: 0 });
        return;
      }

      const nextIdx = currentIndex + 1;
      if (nextIdx < queue.length) {
        await get().playQueueIndex(nextIdx);
      } else if (repeatMode === 'all') {
        await get().playQueueIndex(0);
      } else {
        set({ isPlaying: false, currentTime: 0 });
      }
    },

    prevTrack: async () => {
      const { currentTime, queue, currentIndex } = get();
      // If played more than 3 seconds or at the first track, restart current track
      if (currentTime > 3 || currentIndex <= 0) {
        get().seek(0);
        return;
      }

      const prevIdx = currentIndex - 1;
      if (prevIdx >= 0 && prevIdx < queue.length) {
        await get().playQueueIndex(prevIdx);
      } else {
        get().seek(0);
      }
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
      const { isShuffle } = get();
      if (!isShuffle) {
        get().shuffleQueue();
        set({ isShuffle: true });
      } else {
        set({ isShuffle: false });
      }
    },

    cycleRepeatMode: () => {
      const { repeatMode } = get();
      const nextMode: RepeatMode = repeatMode === 'off' ? 'all' : repeatMode === 'all' ? 'one' : 'off';
      set({ repeatMode: nextMode });
    },

    addToQueue: (tracks: Track | Track[]) => {
      const trackArr = Array.isArray(tracks) ? tracks : [tracks];
      if (trackArr.length === 0) return;

      const { queue, currentTrack } = get();
      if (queue.length === 0 || !currentTrack) {
        get().playTrack(trackArr[0], trackArr);
        return;
      }

      set((state) => ({
        queue: [...state.queue, ...trackArr],
      }));
    },

    playNext: (tracks: Track | Track[]) => {
      const trackArr = Array.isArray(tracks) ? tracks : [tracks];
      if (trackArr.length === 0) return;

      const { queue, currentIndex, currentTrack } = get();
      if (queue.length === 0 || !currentTrack || currentIndex === -1) {
        get().playTrack(trackArr[0], trackArr);
        return;
      }

      set((state) => {
        const insertIdx = state.currentIndex + 1;
        const newQueue = [...state.queue];
        newQueue.splice(insertIdx, 0, ...trackArr);
        return { queue: newQueue };
      });
    },

    playQueueIndex: async (index: number) => {
      const { queue, currentTrack, history } = get();
      if (index < 0 || index >= queue.length) return;
      const trackToPlay = queue[index];

      const updatedHistory = currentTrack
        ? [currentTrack, ...history.filter((h) => h.id !== currentTrack.id).slice(0, 50)]
        : history;

      set({
        currentIndex: index,
        currentTrack: trackToPlay,
        history: updatedHistory,
        isPlaying: true,
        currentTime: 0,
        duration: trackToPlay.duration || 0,
      });

      if (trackToPlay.id) {
        const playCount = (trackToPlay.playCount || 0) + 1;
        db.tracks.update(trackToPlay.id, {
          playCount,
          lastPlayed: Date.now(),
        }).catch(() => {});
      }

      try {
        await audioEngine.loadAndPlay(trackToPlay);
      } catch (err) {
        console.error('Failed to play track index:', err);
        set({ isPlaying: false });
      }
    },

    shuffleQueue: () => {
      const { queue, currentIndex } = get();
      if (queue.length <= 1) return;

      // If playing, keep tracks up to and including currentIndex, shuffle upcoming tracks
      if (currentIndex >= 0 && currentIndex < queue.length) {
        const playedTracks = queue.slice(0, currentIndex + 1);
        const upcomingTracks = queue.slice(currentIndex + 1);
        const shuffledUpcoming = [...upcomingTracks].sort(() => Math.random() - 0.5);
        set({ queue: [...playedTracks, ...shuffledUpcoming] });
      } else {
        const shuffled = [...queue].sort(() => Math.random() - 0.5);
        set({ queue: shuffled });
      }
    },

    clearHistory: () => {
      set({ history: [] });
    },

    removeFromQueue: (index: number) => {
      const { queue, currentIndex, isPlaying } = get();
      if (index < 0 || index >= queue.length) return;

      const newQueue = queue.filter((_, i) => i !== index);

      if (newQueue.length === 0) {
        audioEngine.pause();
        set({
          queue: [],
          currentIndex: -1,
          currentTrack: null,
          isPlaying: false,
          currentTime: 0,
        });
        return;
      }

      if (index === currentIndex) {
        // Removed the currently playing track
        const nextIdx = Math.min(index, newQueue.length - 1);
        set({ queue: newQueue });
        if (isPlaying) {
          get().playQueueIndex(nextIdx);
        } else {
          set({
            currentIndex: nextIdx,
            currentTrack: newQueue[nextIdx],
            duration: newQueue[nextIdx].duration || 0,
            currentTime: 0,
          });
        }
      } else {
        let newCurrentIndex = currentIndex;
        if (index < currentIndex) {
          newCurrentIndex = Math.max(0, currentIndex - 1);
        }
        set({
          queue: newQueue,
          currentIndex: newCurrentIndex,
        });
      }
    },

    reorderQueue: (fromIndex: number, toIndex: number) => {
      set((state) => {
        if (
          fromIndex < 0 ||
          fromIndex >= state.queue.length ||
          toIndex < 0 ||
          toIndex >= state.queue.length
        ) {
          return {};
        }

        const newQueue = [...state.queue];
        const [moved] = newQueue.splice(fromIndex, 1);
        newQueue.splice(toIndex, 0, moved);

        let newCurrentIndex = state.currentIndex;
        if (state.currentIndex === fromIndex) {
          newCurrentIndex = toIndex;
        } else if (fromIndex < state.currentIndex && toIndex >= state.currentIndex) {
          newCurrentIndex--;
        } else if (fromIndex > state.currentIndex && toIndex <= state.currentIndex) {
          newCurrentIndex++;
        }

        return { queue: newQueue, currentIndex: newCurrentIndex };
      });
    },

    clearQueue: () => {
      audioEngine.pause();
      set({
        queue: [],
        currentIndex: -1,
        currentTrack: null,
        isPlaying: false,
        currentTime: 0,
      });
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
