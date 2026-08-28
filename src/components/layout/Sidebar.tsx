import React, { useState } from 'react';
import {
  Music,
  Heart,
  Clock,
  Flame,
  Users,
  Disc,
  Tags,
  Plus,
  Trash2,
  GripVertical,
  Folder,
} from 'lucide-react';
import { useDroppable } from '@dnd-kit/core';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { usePlaylists } from '../../hooks/usePlaylists';
import type { Playlist } from '../../db/schema';

interface NavItemProps {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  active: boolean;
  count?: number;
  color?: string;
  onClick: () => void;
}

const DroppableNavItem: React.FC<NavItemProps> = ({
  id,
  label,
  icon: Icon,
  active,
  count,
  color = 'text-emerald-400',
  onClick,
}) => {
  const { isOver, setNodeRef } = useDroppable({
    id: `nav-${id}`,
    data: { targetType: 'nav', navId: id },
  });

  return (
    <button
      ref={setNodeRef}
      onClick={onClick}
      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-[13px] font-medium transition-colors cursor-pointer ${
        isOver
          ? 'bg-[#0f241a] ring-2 ring-emerald-500 text-emerald-300 border border-emerald-500/60'
          : active
          ? 'bg-[#0f241a] text-[#34d399] border border-emerald-500/40 font-semibold'
          : 'text-slate-400 hover:text-slate-100 hover:bg-[#0f1720] border border-transparent'
      }`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <Icon className={`w-[17px] h-[17px] ${active ? 'text-emerald-400' : color}`} />
        <span className="truncate">{label}</span>
      </div>
      {count !== undefined && (
        <span className="text-[11px] font-mono text-slate-500 bg-[#090d12] px-2 py-0.5 rounded-full border border-[#17232e]">
          {count}
        </span>
      )}
    </button>
  );
};

interface SortablePlaylistItemProps {
  playlist: Playlist;
  active: boolean;
  onClick: () => void;
  onDelete: () => void;
}

const SortablePlaylistItem: React.FC<SortablePlaylistItemProps> = ({
  playlist,
  active,
  onClick,
  onDelete,
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `playlist-sort-${playlist.id}`,
  });

  const { isOver, setNodeRef: setDroppableRef } = useDroppable({
    id: `playlist-drop-${playlist.id}`,
    data: { playlistId: playlist.id },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  return (
    <div
      ref={(node) => {
        setNodeRef(node);
        setDroppableRef(node);
      }}
      style={style}
      className={`group flex items-center justify-between px-3 py-2 rounded-xl text-[13px] font-medium transition-colors ${
        isOver
          ? 'bg-[#0f241a] ring-2 ring-emerald-500 text-emerald-300 border border-emerald-500/60'
          : active
          ? 'bg-[#0f241a] text-emerald-300 border border-emerald-500/40 font-semibold'
          : 'text-slate-400 hover:text-slate-100 hover:bg-[#0f1720] border border-transparent'
      }`}
    >
      <div
        {...attributes}
        {...listeners}
        className="text-slate-600 hover:text-slate-300 cursor-grab active:cursor-grabbing p-1 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <GripVertical className="w-3.5 h-3.5" />
      </div>

      <div onClick={onClick} className="flex-1 min-w-0 flex items-center gap-2.5 cursor-pointer">
        <Folder className={`w-4 h-4 ${active ? 'text-emerald-400' : 'text-emerald-500/70'}`} />
        <span className="truncate">{playlist.name}</span>
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        className="p-1 rounded-lg text-slate-500 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity"
        title="Delete playlist"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

interface SidebarProps {
  currentView: string;
  onNavigate: (view: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onNavigate }) => {
  const { playlists, createPlaylist, deletePlaylist, reorderPlaylists } = usePlaylists();
  const [isCreatingPlaylist, setIsCreatingPlaylist] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleCreatePlaylist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPlaylistName.trim()) {
      const id = await createPlaylist(newPlaylistName.trim());
      setNewPlaylistName('');
      setIsCreatingPlaylist(false);
      onNavigate(`/playlists/${id}`);
    }
  };

  const handlePlaylistDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = playlists.findIndex((p) => `playlist-sort-${p.id}` === active.id);
      const newIndex = playlists.findIndex((p) => `playlist-sort-${p.id}` === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        const reordered = [...playlists];
        const [moved] = reordered.splice(oldIndex, 1);
        reordered.splice(newIndex, 0, moved);
        reorderPlaylists(reordered.map((p) => p.id!));
      }
    }
  };

  return (
    <aside className="w-64 bg-[#080b0f] border-r border-[#17232e] flex flex-col h-full shrink-0 select-none p-4 overflow-y-auto">
      {/* Brand Logo */}
      <div className="flex items-center gap-3 px-2 py-3 mb-4">
        <img
          src="/logo.svg"
          alt="Lumina Player Logo"
          className="w-9 h-9 rounded-xl border border-[#16222f] object-cover shrink-0"
        />
        <div>
          <h1 className="font-extrabold text-sm tracking-wider text-emerald-400">
            LUMINA
          </h1>
          <p className="text-[10px] text-slate-500 font-mono tracking-tight uppercase">
            Audio Player
          </p>
        </div>
      </div>

      {/* Main Navigation */}
      <div className="space-y-1 mb-6">
        <DroppableNavItem
          id="home"
          label="Home"
          icon={Music}
          active={currentView === '/'}
          onClick={() => onNavigate('/')}
        />
        <DroppableNavItem
          id="favorites"
          label="Favorites"
          icon={Heart}
          color="text-slate-400"
          active={currentView === '/favorites'}
          onClick={() => onNavigate('/favorites')}
        />
        <DroppableNavItem
          id="recents"
          label="Recently Played"
          icon={Clock}
          color="text-slate-400"
          active={currentView === '/recently-played'}
          onClick={() => onNavigate('/recently-played')}
        />
        <DroppableNavItem
          id="most-played"
          label="Most Played"
          icon={Flame}
          color="text-slate-400"
          active={currentView === '/most-played'}
          onClick={() => onNavigate('/most-played')}
        />
      </div>

      {/* Playlists Section */}
      <div className="space-y-1 mb-6">
        <div className="flex items-center justify-between px-3 mb-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Playlists
          </p>
          <button
            onClick={() => setIsCreatingPlaylist(true)}
            className="p-1 rounded-lg text-slate-500 hover:text-emerald-400 hover:bg-[#0f1720] transition-colors"
            title="Add Playlist"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* New Playlist input form */}
        {isCreatingPlaylist && (
          <form onSubmit={handleCreatePlaylist} className="px-2 mb-2">
            <input
              type="text"
              autoFocus
              value={newPlaylistName}
              onChange={(e) => setNewPlaylistName(e.target.value)}
              placeholder="Playlist name..."
              className="w-full px-2.5 py-1.5 rounded-xl bg-[#0d1218] border border-emerald-500/50 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-400"
              onBlur={() => {
                if (!newPlaylistName.trim()) setIsCreatingPlaylist(false);
              }}
            />
          </form>
        )}

        <div className="space-y-0.5">
          {playlists.length === 0 ? (
            <div className="px-3 py-2 text-slate-600 text-xs">
              No playlists yet
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handlePlaylistDragEnd}
            >
              <SortableContext
                items={playlists.map((p) => `playlist-sort-${p.id}`)}
                strategy={verticalListSortingStrategy}
              >
                {playlists.map((playlist) => (
                  <SortablePlaylistItem
                    key={playlist.id}
                    playlist={playlist}
                    active={currentView === `/playlists/${playlist.id}`}
                    onClick={() => onNavigate(`/playlists/${playlist.id}`)}
                    onDelete={() => {
                      if (playlist.id && confirm(`Delete playlist "${playlist.name}"?`)) {
                        deletePlaylist(playlist.id);
                        if (currentView === `/playlists/${playlist.id}`) {
                          onNavigate('/');
                        }
                      }
                    }}
                  />
                ))}
              </SortableContext>
            </DndContext>
          )}
        </div>
      </div>

      {/* Smart Views */}
      <div className="space-y-1">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-3 mb-2">
          Smart Views
        </p>
        <DroppableNavItem
          id="artists"
          label="Artists"
          icon={Users}
          color="text-slate-400"
          active={currentView === '/artists'}
          onClick={() => onNavigate('/artists')}
        />
        <DroppableNavItem
          id="albums"
          label="Albums"
          icon={Disc}
          color="text-slate-400"
          active={currentView === '/albums'}
          onClick={() => onNavigate('/albums')}
        />
        <DroppableNavItem
          id="genres"
          label="Genres"
          icon={Tags}
          color="text-slate-400"
          active={currentView === '/genres'}
          onClick={() => onNavigate('/genres')}
        />
      </div>
    </aside>
  );
};
