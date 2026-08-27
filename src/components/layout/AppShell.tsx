import React, { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  useSensor,
  useSensors,
  PointerSensor,
  KeyboardSensor,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { LibraryView } from '../views/LibraryView';
import { ArtistsView } from '../views/ArtistsView';
import { AlbumsView } from '../views/AlbumsView';
import { GenresView } from '../views/GenresView';
import { PlaylistDetailView } from '../views/PlaylistDetailView';
import { PlayerBar } from '../player/PlayerBar';
import { NowPlayingModal } from '../player/NowPlayingModal';
import { QueueDrawer } from '../player/QueueDrawer';
import { DuplicateModal } from '../library/DuplicateModal';
import { DraggedTrackOverlay } from '../library/DraggedTrackOverlay';
import { SettingsModal } from '../modals/SettingsModal';
import { snapCenterToCursor } from '../../utils/dndModifiers';

import {
  useAllTracks,
  useFavoriteTracks,
  useRecentlyPlayedTracks,
  useMostPlayedTracks,
} from '../../hooks/useTracks';
import { usePlaylists } from '../../hooks/usePlaylists';
import { useFolders } from '../../hooks/useFolders';
import { importAudioFile, type DuplicateAction, type DuplicateConflict } from '../../services/importer';
import { useSettings, useUpdateSettings } from '../../hooks/useSettings';
import { db } from '../../db/db';
import type { Track } from '../../db/schema';
import { Heart, Clock, Flame, Music, Loader2 } from 'lucide-react';

export const AppShell: React.FC = () => {
  const { data: settings } = useSettings();
  const updateSettings = useUpdateSettings();

  const [currentView, setCurrentView] = useState<string>('/');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'order' | 'title' | 'artist' | 'dateAdded' | 'playCount'>('order');
  const [sortDesc, setSortDesc] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const viewMode = settings?.viewMode || 'grid';
  const density = settings?.density || 'comfortable';

  const handleViewModeChange = (mode: 'grid' | 'row') => {
    updateSettings.mutate({ viewMode: mode });
  };

  const handleDensityChange = (d: 'compact' | 'comfortable') => {
    updateSettings.mutate({ density: d });
  };

  // Drag-and-drop active state
  const [activeDragTrack, setActiveDragTrack] = useState<Track | null>(null);

  // Import batch & conflict states
  const [isImporting, setIsImporting] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [pendingConflicts, setPendingConflicts] = useState<DuplicateConflict[]>([]);
  const [currentConflict, setCurrentConflict] = useState<DuplicateConflict | null>(null);
  const [conflictActionForAll, setConflictActionForAll] = useState<DuplicateAction | null>(null);

  // Data queries
  const allTracks = useAllTracks(searchQuery, sortBy, sortDesc) || [];
  const favoriteTracks = useFavoriteTracks() || [];
  const recentTracks = useRecentlyPlayedTracks() || [];
  const mostPlayedTracks = useMostPlayedTracks() || [];

  const { addTracksToPlaylist } = usePlaylists();
  const { addTracksToFolder } = useFolders('view', 'home');

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor)
  );

  // DND Handlers
  const handleDragStart = (event: DragStartEvent) => {
    const trackData = event.active.data.current?.track as Track | undefined;
    if (trackData) {
      setActiveDragTrack(trackData);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragTrack(null);

    if (!over) return;

    const track = active.data.current?.track as Track | undefined;
    if (!track || !track.id) return;

    const overId = String(over.id);

    // Dropped on a Sidebar Nav item
    if (overId === 'nav-favorites') {
      await db.tracks.update(track.id, { isFavorite: true });
    } else if (overId.startsWith('playlist-drop-')) {
      const playlistId = parseInt(overId.replace('playlist-drop-', ''), 10);
      if (!isNaN(playlistId)) {
        await addTracksToPlaylist(playlistId, [track.id]);
      }
    } else if (overId.startsWith('folder-')) {
      const folderId = parseInt(overId.replace('folder-', ''), 10);
      if (!isNaN(folderId)) {
        await addTracksToFolder(folderId, [track.id]);
      }
    }
  };

  // Import handler
  const handleFilesSelected = async (files: File[]) => {
    const validFiles = files.filter((f) => {
      const ext = f.name.split('.').pop()?.toLowerCase();
      return ['mp3', 'flac', 'wav', 'm4a', 'aac', 'ogg'].includes(ext || '') || f.type.startsWith('audio/');
    });

    if (validFiles.length === 0) return;

    setIsImporting(true);
    let imported = 0;

    for (let i = 0; i < validFiles.length; i++) {
      const file = validFiles[i];
      setImportStatus(`Importing (${i + 1}/${validFiles.length}): ${file.name}`);

      const res = await importAudioFile(file, 'skip');
      if (res.duplicate && res.track) {
        if (conflictActionForAll) {
          await importAudioFile(file, conflictActionForAll);
        } else {
          setPendingConflicts((prev) => [
            ...prev,
            { file, existingTrack: res.track!, hash: res.track!.fileHash },
          ]);
        }
      } else if (res.track) {
        imported++;
      }
    }

    setIsImporting(false);
    setImportStatus(null);
  };

  // Process conflict queue
  React.useEffect(() => {
    if (!currentConflict && pendingConflicts.length > 0) {
      setCurrentConflict(pendingConflicts[0]);
      setPendingConflicts((prev) => prev.slice(1));
    }
  }, [pendingConflicts, currentConflict]);

  const handleResolveConflict = async (action: DuplicateAction, applyToAll: boolean) => {
    if (applyToAll) {
      setConflictActionForAll(action);
    }

    if (currentConflict) {
      await importAudioFile(currentConflict.file, action);
      setCurrentConflict(null);
    }
  };

  // Render view router
  const renderCurrentView = () => {
    if (currentView === '/') {
      return (
        <LibraryView
          title="All Library Tracks"
          subtitle="Explore all offline audio tracks, podcasts, and recordings"
          icon={Music}
          iconColor="text-primary"
          tracks={allTracks}
          viewMode={viewMode}
          density={density}
          scopeId="home"
          sortBy={sortBy}
          onSortChange={setSortBy}
          sortDesc={sortDesc}
          onSortDescToggle={() => setSortDesc(!sortDesc)}
        />
      );
    }

    if (currentView === '/favorites') {
      return (
        <LibraryView
          title="Favorites"
          subtitle="Your cherished songs and top picks"
          icon={Heart}
          iconColor="text-rose-400"
          tracks={favoriteTracks}
          viewMode={viewMode}
          density={density}
          scopeId="favorites"
          sortBy={sortBy}
          onSortChange={setSortBy}
          sortDesc={sortDesc}
          onSortDescToggle={() => setSortDesc(!sortDesc)}
        />
      );
    }

    if (currentView === '/recently-played') {
      return (
        <LibraryView
          title="Recently Played"
          subtitle="Listening history across all devices"
          icon={Clock}
          iconColor="text-purple-400"
          tracks={recentTracks}
          viewMode={viewMode}
          density={density}
          scopeId="recently-played"
          sortBy={sortBy}
          onSortChange={setSortBy}
          sortDesc={sortDesc}
          onSortDescToggle={() => setSortDesc(!sortDesc)}
        />
      );
    }

    if (currentView === '/most-played') {
      return (
        <LibraryView
          title="Most Played"
          subtitle="Your top rotation and heavy repeat tracks"
          icon={Flame}
          iconColor="text-amber-400"
          tracks={mostPlayedTracks}
          viewMode={viewMode}
          density={density}
          scopeId="most-played"
          sortBy={sortBy}
          onSortChange={setSortBy}
          sortDesc={sortDesc}
          onSortDescToggle={() => setSortDesc(!sortDesc)}
        />
      );
    }

    if (currentView === '/artists') {
      return <ArtistsView viewMode={viewMode} density={density} />;
    }

    if (currentView === '/albums') {
      return <AlbumsView viewMode={viewMode} density={density} />;
    }

    if (currentView === '/genres') {
      return <GenresView viewMode={viewMode} density={density} />;
    }

    if (currentView.startsWith('/playlists/')) {
      const playlistId = parseInt(currentView.replace('/playlists/', ''), 10);
      return (
        <PlaylistDetailView
          playlistId={playlistId}
          viewMode={viewMode}
          density={density}
          onBack={() => setCurrentView('/')}
        />
      );
    }

    return null;
  };

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex h-screen w-screen bg-background text-foreground overflow-hidden font-sans select-none">
        {/* Left Sidebar */}
        <Sidebar currentView={currentView} onNavigate={setCurrentView} />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
          {/* Header */}
          <div className="p-6 pb-2 shrink-0">
            <Header
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              viewMode={viewMode}
              onViewModeChange={handleViewModeChange}
              density={density}
              onDensityChange={handleDensityChange}
              onFilesSelected={handleFilesSelected}
              onNavigateView={setCurrentView}
              onOpenSettings={() => setIsSettingsOpen(true)}
              currentView={currentView}
            />
          </div>

          {/* View Container with Scroll */}
          <main className="flex-1 overflow-y-auto px-6 pb-28 pt-2">
            {isImporting && (
              <div className="mb-4 p-3 rounded-2xl glass-panel border border-primary/40 flex items-center gap-3 animate-pulse text-xs text-primary">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                <span>{importStatus || 'Importing audio files...'}</span>
              </div>
            )}

            {renderCurrentView()}
          </main>
        </div>

        {/* Persistent Bottom Player Bar */}
        <PlayerBar />

        {/* Expandable Now Playing Modal */}
        <NowPlayingModal />

        {/* Up Next Queue Drawer */}
        <QueueDrawer />

        {/* Settings Modal */}
        <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />

        {/* Duplicate Conflict Resolution Modal */}
        {currentConflict && (
          <DuplicateModal
            incomingFile={currentConflict.file}
            existingTrack={currentConflict.existingTrack}
            onResolve={handleResolveConflict}
          />
        )}

        {/* Centered Pointer Overlay with custom modifier */}
        <DragOverlay dropAnimation={null} modifiers={[snapCenterToCursor]}>
          {activeDragTrack ? (
            <DraggedTrackOverlay
              track={activeDragTrack}
              viewMode={viewMode}
            />
          ) : null}
        </DragOverlay>
      </div>
    </DndContext>
  );
};
