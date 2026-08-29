import { create } from 'zustand';
import type { Track } from '../db/schema';
import { audioEngine } from '../services/audioEngine';
import { db } from '../db/db';

export type RepeatMode = 'off' | 'all' | 'one';
export type VisualizerMode = 'bars' | 'wave' | 'circle';

interface PlayerState {
  currentTrack: Track | null;
  queue: Track[];               // The full persistent tracklist (e.g. folder, album, playlist)
  currentIndex: number;         // Active index within the full queue (-1 if empty)
  userQueue: Track[];           // Priority "Play Next" items added by user
  originalQueue: Track[];       // Unshuffled copy
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
  playUserQueueIndex: (index: number) => Promise<void>;
  shuffleQueue: () => void;
  clearHistory: () => void;
  removeFromQueue: (index: number) => void;
  removeFromUserQueue: (index: number) => void;
  reorderQueue: (fromIndex: number, toIndex: number) => void;
  reorderUserQueue: (fromIndex: number, toIndex: number) => void;
  clearQueue: () => void;
  clearUserQueue: () => void;
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
    userQueue: [],
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
      const { currentTrack, history, queue: currentQueue } = get();
      const updatedHistory = currentTrack ? [currentTrack, ...history.filter(h => h.id !== currentTrack.id).slice(0, 50)] : history;

      let fullQueue = newQueue ? [...newQueue] : currentQueue;
      let targetIndex = -1;

      if (newQueue) {
        targetIndex = newQueue.findIndex(t => t.id === track.id);
        if (targetIndex === -1) {
          fullQueue = [track, ...newQueue];
          targetIndex = 0;
        }
      } else {
        targetIndex = fullQueue.findIndex(t => t.id === track.id);
        if (targetIndex === -1) {
          fullQueue = [...fullQueue, track];
          targetIndex = fullQueue.length - 1;
        }
      }

      set({
        currentTrack: track,
        queue: fullQueue,
        originalQueue: newQueue ? [...newQueue] : get().originalQueue,
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
          await get().playTrack(queue[idx]);
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
      const { userQueue, queue, currentIndex, repeatMode } = get();

      // 1. First priority: check user-queued ("Play Next" / "Add to Queue") items
      if (userQueue.length > 0) {
        const nextUserTrack = userQueue[0];
        const remainingUserQueue = userQueue.slice(1);
        set({ userQueue: remainingUserQueue });
        await get().playTrack(nextUserTrack);
        return;
      }

      // 2. Next item in persistent queue
      if (queue.length > 0) {
        const nextIdx = currentIndex + 1;
        if (nextIdx < queue.length) {
          const nextTrack = queue[nextIdx];
          set({ currentIndex: nextIdx });
          await get().playTrack(nextTrack);
        } else if (repeatMode === 'all') {
          // Wrap around seamlessly to start of full queue
          const firstTrack = queue[0];
          set({ currentIndex: 0 });
          await get().playTrack(firstTrack);
        } else {
          set({ isPlaying: false, currentTime: 0 });
        }
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
        const prevTrack = queue[prevIdx];
        set({ currentIndex: prevIdx });
        await get().playTrack(prevTrack);
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
      const { isShuffle, queue, currentIndex, currentTrack } = get();
      if (!isShuffle) {
        if (queue.length <= 1) return;
        // Keep current track at index 0, shuffle the rest
        const otherTracks = queue.filter((_, i) => i !== currentIndex);
        const shuffled = [...otherTracks].sort(() => Math.random() - 0.5);
        const newQueue = currentTrack ? [currentTrack, ...shuffled] : shuffled;
        set({ isShuffle: true, queue: newQueue, currentIndex: currentTrack ? 0 : -1 });
      } else {
        // Restore order from originalQueue
        const original = get().originalQueue;
        if (original.length > 0) {
          const newIdx = currentTrack ? original.findIndex(t => t.id === currentTrack.id) : 0;
          set({ isShuffle: false, queue: [...original], currentIndex: newIdx !== -1 ? newIdx : 0 });
        } else {
          set({ isShuffle: false });
        }
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
        userQueue: [...state.userQueue, ...trackArr],
      }));
    },

    playNext: (tracks: Track | Track[]) => {
      const trackArr = Array.isArray(tracks) ? tracks : [tracks];
      set(state => ({
        userQueue: [...trackArr, ...state.userQueue],
      }));
    },

    playQueueIndex: async (index: number) => {
      const { queue } = get();
      if (index < 0 || index >= queue.length) return;
      const trackToPlay = queue[index];
      set({ currentIndex: index });
      await get().playTrack(trackToPlay);
    },

    playUserQueueIndex: async (index: number) => {
      const { userQueue } = get();
      if (index < 0 || index >= userQueue.length) return;
      const trackToPlay = userQueue[index];
      const remaining = userQueue.filter((_, i) => i !== index);
      set({ userQueue: remaining });
      await get().playTrack(trackToPlay);
    },

    shuffleQueue: () => {
      const { queue, currentIndex, currentTrack } = get();
      if (queue.length <= 1) return;
      // Shuffle tracks except the currently playing one
      const otherTracks = queue.filter((_, i) => i !== currentIndex);
      const shuffled = [...otherTracks].sort(() => Math.random() - 0.5);
      const newQueue = currentTrack ? [currentTrack, ...shuffled] : shuffled;
      set({ queue: newQueue, currentIndex: currentTrack ? 0 : -1 });
    },

    clearHistory: () => {
      set({ history: [] });
    },

    removeFromQueue: (index: number) => {
      set(state => {
        const newQueue = state.queue.filter((_, i) => i !== index);
        let newIndex = state.currentIndex;
        if (index < state.currentIndex) {
          newIndex = Math.max(0, state.currentIndex - 1);
        } else if (index === state.currentIndex) {
          newIndex = Math.min(newIndex, newQueue.length - 1);
        }
        return {
          queue: newQueue,
          currentIndex: newIndex,
        };
      });
    },

    removeFromUserQueue: (index: number) => {
      set(state => ({
        userQueue: state.userQueue.filter((_, i) => i !== index),
      }));
    },

    reorderQueue: (fromIndex: number, toIndex: number) => {
      set(state => {
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

    reorderUserQueue: (fromIndex: number, toIndex: number) => {
      set(state => {
        const newUserQueue = [...state.userQueue];
        const [moved] = newUserQueue.splice(fromIndex, 1);
        newUserQueue.splice(toIndex, 0, moved);
        return { userQueue: newUserQueue };
      });
    },

    clearQueue: () => {
      set({ queue: [], currentIndex: -1 });
    },

    clearUserQueue: () => {
      set({ userQueue: [] });
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
