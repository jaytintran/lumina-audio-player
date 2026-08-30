import { create } from 'zustand';
import type { Track } from '../db/schema';
import { readObjectUrl } from '../db/opfs';

export interface MultiDeckChannel {
  id: string;
  track: Track;
  audio: HTMLAudioElement;
  gainNode: GainNode;
  isPlaying: boolean;
  isMuted: boolean;
  volume: number;        // 0.0 - 1.0
  currentTime: number;
  duration: number;
  isLooping: boolean;
}

interface MultiDeckState {
  decks: MultiDeckChannel[];
  activeDeckId: string | null;
  audioContext: AudioContext | null;
  masterVolume: number;
  isMasterLooping: boolean;

  // Actions
  addDeck: (track: Track, autoPlay?: boolean) => Promise<string>;
  removeDeck: (deckId: string) => void;
  togglePlayDeck: (deckId: string) => void;
  toggleMuteDeck: (deckId: string) => void;
  setDeckVolume: (deckId: string, volume: number) => void;
  setDeckTime: (deckId: string, time: number) => void;
  toggleDeckLoop: (deckId: string) => void;
  setActiveDeck: (deckId: string) => void;
  setMasterVolume: (volume: number) => void;
  toggleMasterLoop: () => void;
  pauseAllDecks: () => void;
  playAllDecks: () => void;
  clearAllDecks: () => void;
  swapWithMainTrack: (deckId: string, currentMainTrack: Track | null) => Promise<Track | undefined>;
}

export const useMultiDeckStore = create<MultiDeckState>((set, get) => ({
  decks: [],
  activeDeckId: null,
  audioContext: null,
  masterVolume: 0.8,
  isMasterLooping: false,

  addDeck: async (track: Track, autoPlay = true) => {
    let ctx = get().audioContext;
    if (!ctx) {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      ctx = new AudioCtxClass();
      set({ audioContext: ctx });
    }
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }

    const audioUrl = await readObjectUrl(track.fileKey);
    if (!audioUrl) {
      throw new Error(`Cannot load track from OPFS: ${track.fileKey}`);
    }

    const audio = new Audio();
    audio.src = audioUrl;
    audio.preload = 'auto';
    audio.crossOrigin = 'anonymous';

    const gainNode = ctx.createGain();
    gainNode.gain.value = 0.8;

    try {
      const source = ctx.createMediaElementSource(audio);
      source.connect(gainNode);
      gainNode.connect(ctx.destination);
    } catch (e) {
      console.warn('Could not connect multi-deck MediaElementSource:', e);
    }

    const deckId = `deck-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    const newDeck: MultiDeckChannel = {
      id: deckId,
      track,
      audio,
      gainNode,
      isPlaying: false,
      isMuted: false,
      volume: 0.8,
      currentTime: 0,
      duration: track.duration || 0,
      isLooping: false,
    };

    // Event listeners
    audio.addEventListener('timeupdate', () => {
      set((state) => ({
        decks: state.decks.map((d) =>
          d.id === deckId
            ? { ...d, currentTime: audio.currentTime, duration: audio.duration || d.duration }
            : d
        ),
      }));
    });

    audio.addEventListener('ended', () => {
      const d = get().decks.find((deck) => deck.id === deckId);
      if (d?.isLooping) {
        audio.currentTime = 0;
        audio.play().catch(console.error);
      } else {
        set((state) => ({
          decks: state.decks.map((deck) =>
            deck.id === deckId ? { ...deck, isPlaying: false } : deck
          ),
        }));
      }
    });

    set((state) => ({
      decks: [...state.decks, newDeck],
      activeDeckId: deckId,
    }));

    if (autoPlay) {
      try {
        await audio.play();
        set((state) => ({
          decks: state.decks.map((d) =>
            d.id === deckId ? { ...d, isPlaying: true } : d
          ),
        }));
      } catch (err) {
        console.warn('Autoplay error in deck:', err);
      }
    }

    return deckId;
  },

  removeDeck: (deckId: string) => {
    const deck = get().decks.find((d) => d.id === deckId);
    if (deck) {
      deck.audio.pause();
      deck.audio.src = '';
      try {
        deck.gainNode.disconnect();
      } catch (e) {}
    }

    set((state) => {
      const remaining = state.decks.filter((d) => d.id !== deckId);
      const nextActive =
        state.activeDeckId === deckId
          ? remaining.length > 0
            ? remaining[remaining.length - 1].id
            : null
          : state.activeDeckId;
      return {
        decks: remaining,
        activeDeckId: nextActive,
      };
    });
  },

  togglePlayDeck: (deckId: string) => {
    const deck = get().decks.find((d) => d.id === deckId);
    if (!deck) return;

    if (deck.isPlaying) {
      deck.audio.pause();
      set((state) => ({
        decks: state.decks.map((d) =>
          d.id === deckId ? { ...d, isPlaying: false } : d
        ),
      }));
    } else {
      deck.audio.play().then(() => {
        set((state) => ({
          decks: state.decks.map((d) =>
            d.id === deckId ? { ...d, isPlaying: true } : d
          ),
        }));
      }).catch(console.error);
    }
  },

  toggleMuteDeck: (deckId: string) => {
    const deck = get().decks.find((d) => d.id === deckId);
    if (!deck) return;

    const nextMuted = !deck.isMuted;
    deck.audio.muted = nextMuted;
    deck.gainNode.gain.value = nextMuted ? 0 : deck.volume;

    set((state) => ({
      decks: state.decks.map((d) =>
        d.id === deckId ? { ...d, isMuted: nextMuted } : d
      ),
    }));
  },

  setDeckVolume: (deckId: string, volume: number) => {
    const deck = get().decks.find((d) => d.id === deckId);
    if (!deck) return;

    const clamped = Math.max(0, Math.min(1, volume));
    deck.volume = clamped;
    if (!deck.isMuted) {
      deck.gainNode.gain.value = clamped;
    }

    set((state) => ({
      decks: state.decks.map((d) =>
        d.id === deckId ? { ...d, volume: clamped } : d
      ),
    }));
  },

  setDeckTime: (deckId: string, time: number) => {
    const deck = get().decks.find((d) => d.id === deckId);
    if (!deck) return;
    deck.audio.currentTime = Math.max(0, Math.min(time, deck.duration || 0));
  },

  toggleDeckLoop: (deckId: string) => {
    const deck = get().decks.find((d) => d.id === deckId);
    if (!deck) return;

    const nextLoop = !deck.isLooping;
    deck.audio.loop = nextLoop;

    set((state) => ({
      decks: state.decks.map((d) =>
        d.id === deckId ? { ...d, isLooping: nextLoop } : d
      ),
    }));
  },

  setActiveDeck: (deckId: string) => {
    set({ activeDeckId: deckId });
  },

  setMasterVolume: (volume: number) => {
    const clamped = Math.max(0, Math.min(1, volume));
    set({ masterVolume: clamped });
    get().decks.forEach((deck) => {
      if (!deck.isMuted) {
        deck.gainNode.gain.value = clamped * deck.volume;
      }
    });
  },

  toggleMasterLoop: () => {
    const nextLoop = !get().isMasterLooping;
    set({ isMasterLooping: nextLoop });
    get().decks.forEach((deck) => {
      deck.audio.loop = nextLoop;
    });
    set((state) => ({
      decks: state.decks.map((d) => ({ ...d, isLooping: nextLoop })),
    }));
  },

  pauseAllDecks: () => {
    get().decks.forEach((deck) => {
      deck.audio.pause();
    });
    set((state) => ({
      decks: state.decks.map((d) => ({ ...d, isPlaying: false })),
    }));
  },

  playAllDecks: () => {
    get().decks.forEach((deck) => {
      deck.audio.play().catch(console.error);
    });
    set((state) => ({
      decks: state.decks.map((d) => ({ ...d, isPlaying: true })),
    }));
  },

  clearAllDecks: () => {
    get().decks.forEach((deck) => {
      deck.audio.pause();
      deck.audio.src = '';
      try {
        deck.gainNode.disconnect();
      } catch (e) {}
    });
    set({ decks: [], activeDeckId: null });
  },

  swapWithMainTrack: async (deckId: string, currentMainTrack: Track | null) => {
    const deck = get().decks.find((d) => d.id === deckId);
    if (!deck) return;

    const deckTrack = deck.track;
    deck.audio.pause();
    deck.audio.src = '';
    try {
      deck.gainNode.disconnect();
    } catch (e) {}

    // If there was a main track playing, replace this deck slot with the previous main track
    if (currentMainTrack && currentMainTrack.id !== deckTrack.id) {
      let ctx = get().audioContext;
      if (!ctx) {
        const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
        ctx = new AudioCtxClass();
        set({ audioContext: ctx });
      }
      const audioUrl = await readObjectUrl(currentMainTrack.fileKey);
      if (audioUrl) {
        const audio = new Audio();
        audio.src = audioUrl;
        audio.preload = 'auto';
        audio.crossOrigin = 'anonymous';

        const gainNode = ctx.createGain();
        gainNode.gain.value = deck.volume;

        try {
          const source = ctx.createMediaElementSource(audio);
          source.connect(gainNode);
          gainNode.connect(ctx.destination);
        } catch (e) {}

        const newDeck: MultiDeckChannel = {
          id: `deck-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          track: currentMainTrack,
          audio,
          gainNode,
          isPlaying: false,
          isMuted: deck.isMuted,
          volume: deck.volume,
          currentTime: 0,
          duration: currentMainTrack.duration || 0,
          isLooping: deck.isLooping,
        };

        audio.addEventListener('timeupdate', () => {
          set((state) => ({
            decks: state.decks.map((d) =>
              d.id === newDeck.id
                ? { ...d, currentTime: audio.currentTime, duration: audio.duration || d.duration }
                : d
            ),
          }));
        });

        audio.addEventListener('ended', () => {
          const d = get().decks.find((k) => k.id === newDeck.id);
          if (d?.isLooping) {
            audio.currentTime = 0;
            audio.play().catch(console.error);
          } else {
            set((state) => ({
              decks: state.decks.map((k) =>
                k.id === newDeck.id ? { ...k, isPlaying: false } : k
              ),
            }));
          }
        });

        set((state) => ({
          decks: [...state.decks.filter((d) => d.id !== deckId), newDeck],
          activeDeckId: newDeck.id,
        }));
      } else {
        set((state) => ({
          decks: state.decks.filter((d) => d.id !== deckId),
        }));
      }
    } else {
      set((state) => ({
        decks: state.decks.filter((d) => d.id !== deckId),
      }));
    }

    return deckTrack;
  },
}));
