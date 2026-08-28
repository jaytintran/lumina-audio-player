import React, { useState, useRef, useEffect } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Folder as FolderIcon,
  Trash2,
  Play,
  X,
  Search,
} from 'lucide-react';
import { useDroppable } from '@dnd-kit/core';
import type { Folder } from '../../db/schema';
import { useFolderTracks, useFolders } from '../../hooks/useFolders';
import { usePlayerStore } from '../../stores/playerStore';
import { FOLDER_ICONS, getFolderIconComponent } from '../../utils/folderIcons';
import { TrackGrid } from './TrackGrid';
import { TrackRowList } from './TrackRow';

interface FolderSectionProps {
  folder: Folder;
  viewMode?: 'grid' | 'row';
  density?: 'compact' | 'comfortable';
  selectedIds?: Set<number>;
  onSelectTrack?: (trackId: number, e?: React.MouseEvent) => void;
  onLongPressSelect?: (trackId: number) => void;
  onOpenFolder?: (folderId: number) => void;
}

export const FolderSection: React.FC<FolderSectionProps> = ({
  folder,
  viewMode = 'grid',
  density = 'comfortable',
  selectedIds,
  onSelectTrack,
  onLongPressSelect,
  onOpenFolder,
}) => {
  const tracks = useFolderTracks(folder.id!);
  const { toggleFolderCollapse, deleteFolder, updateFolder } = useFolders(folder.scopeType, folder.scopeId);
  const { playTrack } = usePlayerStore();

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(folder.name);
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [iconSearch, setIconSearch] = useState('');
  const iconPickerRef = useRef<HTMLDivElement>(null);

  const { isOver, setNodeRef } = useDroppable({
    id: `folder-${folder.id}`,
    data: { folderId: folder.id },
  });

  const isCollapsed = folder.isCollapsed ?? false;
  const FolderIconComp = getFolderIconComponent(folder.icon);

  // Close icon picker when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (iconPickerRef.current && !iconPickerRef.current.contains(e.target as Node)) {
        setShowIconPicker(false);
      }
    };
    if (showIconPicker) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [showIconPicker]);

  const handleSaveTitle = async () => {
    if (folder.id && editedTitle.trim() && editedTitle.trim() !== folder.name) {
      await updateFolder(folder.id, { name: editedTitle.trim() });
    }
    setIsEditingTitle(false);
  };

  const handleSelectIcon = async (iconId: string) => {
    if (folder.id) {
      await updateFolder(folder.id, { icon: iconId });
    }
    setShowIconPicker(false);
  };

  const handlePlayAll = () => {
    if (tracks && tracks.length > 0) {
      playTrack(tracks[0], tracks);
    }
  };

  const filteredIcons = FOLDER_ICONS.filter((item) =>
    item.label.toLowerCase().includes(iconSearch.toLowerCase()) ||
    item.id.toLowerCase().includes(iconSearch.toLowerCase())
  );

  return (
    <div
      ref={setNodeRef}
      className={`rounded-2xl transition-all duration-300 mb-6 border ${
        isOver
          ? 'ring-2 ring-emerald-400 bg-emerald-950/30 border-emerald-500/50'
          : 'border-[#17232e] bg-[#0a0f15]'
      }`}
    >
      {/* Folder Header (Entire header is clickable to toggle collapse, while inner buttons stopPropagation) */}
      <div
        onClick={() => folder.id && toggleFolderCollapse(folder.id, isCollapsed)}
        className="flex items-center justify-between p-3 md:px-4 bg-[#0d131a] rounded-2xl border-b border-[#17232e]/60 cursor-pointer hover:bg-[#101721] transition-colors select-none group/header"
      >
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          {/* Collapse Chevron Toggle */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (folder.id) toggleFolderCollapse(folder.id, isCollapsed);
            }}
            className="text-slate-400 group-hover/header:text-emerald-400 p-0.5 rounded transition-colors"
            title={isCollapsed ? 'Expand folder' : 'Collapse folder'}
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>

          {/* Folder Icon Selector with Floating Micro Track Count Pill */}
          <div className="relative" ref={iconPickerRef}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowIconPicker(!showIconPicker);
              }}
              className="relative p-1.5 rounded-lg bg-[#141d27] border border-[#1e2936] text-emerald-400 hover:border-emerald-500/50 hover:bg-[#1a2533] transition-all flex items-center justify-center"
              title="Change folder icon"
            >
              <FolderIconComp className="w-4 h-4 text-emerald-400" />

              {/* Floating Rectangular Track Count Badge */}
              <span className="absolute -top-1.5 -right-2 inline-flex items-center justify-center min-w-[14px] h-3.5 px-1 rounded-[3px] bg-[#121820] border border-[#1d2734] text-slate-400 text-[9px] font-mono font-semibold leading-none shadow-sm pointer-events-none select-none">
                {tracks?.length || 0}
              </span>
            </button>

            {/* 50 Lucide Icons Dropdown Grid */}
            {showIconPicker && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute left-0 top-full mt-2 w-72 p-3 bg-[#0c1218] border border-[#1c2836] rounded-2xl shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-200">Select Folder Icon</span>
                  <button
                    onClick={() => setShowIconPicker(false)}
                    className="p-1 text-slate-400 hover:text-slate-200"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Search input for 50 icons */}
                <div className="relative mb-2.5">
                  <Search className="w-3 h-3 text-slate-400 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    value={iconSearch}
                    onChange={(e) => setIconSearch(e.target.value)}
                    placeholder="Search 50+ icons..."
                    className="w-full pl-8 pr-2.5 py-1.5 rounded-lg bg-[#080b0f] border border-[#1c2836] text-[11px] text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Icons Grid */}
                <div className="grid grid-cols-5 gap-1.5 max-h-48 overflow-y-auto pr-1">
                  {filteredIcons.map((item) => {
                    const IconComp = item.icon;
                    const isSelected = (folder.icon || 'folder') === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleSelectIcon(item.id)}
                        className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all ${
                          isSelected
                            ? 'bg-emerald-950/60 border-emerald-500 text-emerald-400 ring-1 ring-emerald-500'
                            : 'bg-[#101721] border-[#182330] text-slate-400 hover:border-slate-500 hover:text-slate-100 hover:bg-[#16202d]'
                        }`}
                        title={item.label}
                      >
                        <IconComp className="w-4 h-4" />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Folder Title (Left-click opens view, Right-click triggers inline title editing) */}
          {isEditingTitle ? (
            <input
              type="text"
              autoFocus
              value={editedTitle}
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => setEditedTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveTitle();
                if (e.key === 'Escape') {
                  handleSaveTitle();
                }
              }}
              onBlur={handleSaveTitle}
              className="bg-transparent border-none outline-none font-bold text-sm text-slate-100 p-0 m-0 w-auto min-w-[60px] max-w-[240px] focus:ring-0"
              style={{ width: `${Math.max(editedTitle.length, 1)}ch` }}
            />
          ) : (
            <span
              onClick={(e) => {
                e.stopPropagation();
                if (folder.id && onOpenFolder) {
                  onOpenFolder(folder.id);
                }
              }}
              onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setEditedTitle(folder.name);
                setIsEditingTitle(true);
              }}
              className="font-bold text-sm text-slate-200 hover:text-emerald-400 cursor-pointer truncate select-none transition-colors"
              title="Left-click to open folder • Right-click to edit name"
            >
              {folder.name}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          {tracks && tracks.length > 0 && (
            <button
              onClick={handlePlayAll}
              className="p-1.5 rounded-lg text-emerald-400 hover:bg-emerald-500/20 text-xs flex items-center gap-1 font-medium transition-colors"
              title="Play folder tracks"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span className="hidden sm:inline">Play</span>
            </button>
          )}

          <button
            onClick={() => {
              if (folder.id && confirm(`Delete folder "${folder.name}"?`)) {
                deleteFolder(folder.id);
              }
            }}
            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
            title="Delete folder"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Folder Contents */}
      {!isCollapsed && (
        <div className="p-4">
          {!tracks || tracks.length === 0 ? (
            <div
              className={`flex flex-col items-center justify-center p-8 rounded-xl border-2 border-dashed transition-colors ${
                isOver
                  ? 'border-emerald-400 bg-emerald-500/10 text-emerald-300'
                  : 'border-zinc-800 text-zinc-500'
              }`}
            >
              <FolderIcon className="w-8 h-8 mb-2 opacity-50" />
              <p className="text-xs font-medium">Drop audio tracks here to organize</p>
            </div>
          ) : viewMode === 'grid' ? (
            <TrackGrid
              tracks={tracks}
              selectedIds={selectedIds}
              onSelectTrack={onSelectTrack}
              onLongPressSelect={onLongPressSelect}
            />
          ) : (
            <TrackRowList
              tracks={tracks}
              density={density}
              selectedIds={selectedIds}
              onSelectTrack={onSelectTrack}
              onLongPressSelect={onLongPressSelect}
            />
          )}
        </div>
      )}
    </div>
  );
};
