import React, { useRef } from 'react';
import {
  Search,
  X,
  Upload,
  FolderUp,
  LayoutGrid,
  List,
  BarChart2,
  Heart,
  Headphones,
  Flame,
  CheckCircle2,
  Settings,
  Video,
} from 'lucide-react';
import { StatCard } from './StatCard';
import { useLibraryStats } from '../../hooks/useTracks';

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  viewMode: 'grid' | 'row';
  onViewModeChange: (mode: 'grid' | 'row') => void;
  density: 'compact' | 'comfortable';
  onDensityChange: (density: 'compact' | 'comfortable') => void;
  onFilesSelected: (files: File[]) => void;
  onOpenImportUrl?: () => void;
  onNavigateView: (view: string) => void;
  onOpenSettings: () => void;
  currentView: string;
}

export const Header: React.FC<HeaderProps> = ({
  searchQuery,
  onSearchChange,
  viewMode,
  onViewModeChange,
  onFilesSelected,
  onOpenImportUrl,
  onNavigateView,
  onOpenSettings,
  currentView,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const stats = useLibraryStats();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFilesSelected(Array.from(e.target.files));
      e.target.value = '';
    }
  };

  return (
    <header className="space-y-4 mb-6">
      {/* Top Search & Actions Row */}
      <div className="flex items-center justify-between gap-4">
        {/* Mobile / Responsive Brand Badge */}
        <div className="flex md:hidden items-center gap-2 shrink-0">
          <img
            src="/logo.svg"
            alt="Lumina Logo"
            className="w-8 h-8 rounded-lg border border-[#16222f]"
          />
        </div>

        {/* Search Bar */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search titles, artists, albums, or category tags..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-8 py-2 rounded-2xl bg-[#090d12] border border-[#17232e] text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500/60 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Action icons in top right matching screenshot */}
        <div className="flex items-center gap-2">
          {/* Import YouTube / URL Button */}
          {onOpenImportUrl && (
            <button
              onClick={onOpenImportUrl}
              className="p-2 rounded-xl bg-[#0d1218] border border-[#17232e] text-red-400/90 hover:text-red-400 hover:border-red-500/40 hover:bg-red-950/20 transition-all flex items-center gap-1.5"
              title="Import YouTube Audio / URL"
            >
              <Video className="w-4 h-4 text-red-400" />
              <span className="hidden md:inline text-xs font-semibold text-slate-300">Import URL</span>
            </button>
          )}

          {/* Import Files Button */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="audio/*,.mp3,.flac,.wav,.m4a,.aac,.ogg"
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2 rounded-xl bg-[#0d1218] border border-[#17232e] text-slate-400 hover:text-slate-100 hover:border-slate-600 transition-colors"
            title="Upload Files"
          >
            <Upload className="w-4 h-4" />
          </button>

          {/* Import Folder Button */}
          <input
            ref={folderInputRef}
            type="file"
            // @ts-ignore
            webkitdirectory="true"
            directory="true"
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            onClick={() => folderInputRef.current?.click()}
            className="p-2 rounded-xl bg-[#0d1218] border border-[#17232e] text-slate-400 hover:text-slate-100 hover:border-slate-600 transition-colors"
            title="Import Folder"
          >
            <FolderUp className="w-4 h-4" />
          </button>

          {/* View Mode Toggle */}
          <div className="flex items-center p-0.5 rounded-xl bg-[#0d1218] border border-[#17232e]">
            <button
              onClick={() => onViewModeChange('grid')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'grid'
                  ? 'bg-[#122b1f] text-emerald-400'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onViewModeChange('row')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'row'
                  ? 'bg-[#122b1f] text-emerald-400'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Row View"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Settings Button */}
          <button
            onClick={onOpenSettings}
            className="p-2 rounded-xl bg-[#0d1218] border border-[#17232e] text-slate-400 hover:text-slate-100 hover:border-slate-600 transition-colors"
            title="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 5 Stat Cards Row matching screenshot */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <StatCard
          label="Total Tracks"
          value={stats?.totalTracks || 0}
          icon={BarChart2}
          iconBgColor="bg-[#10243a]"
          iconTextColor="text-[#38bdf8]"
          isActive={currentView === '/'}
          onClick={() => onNavigateView('/')}
        />
        <StatCard
          label="Favorites"
          value={stats?.favoritesCount || 0}
          icon={Heart}
          iconBgColor="bg-[#2e1018]"
          iconTextColor="text-[#f43f5e]"
          isActive={currentView === '/favorites'}
          onClick={() => onNavigateView('/favorites')}
        />
        <StatCard
          label="Recently Played"
          value={stats?.totalTracks ? Math.min(stats.totalTracks, 5) : 0}
          icon={Headphones}
          iconBgColor="bg-[#0f1f38]"
          iconTextColor="text-[#3b82f6]"
          isActive={currentView === '/recently-played'}
          onClick={() => onNavigateView('/recently-played')}
        />
        <StatCard
          label="Most Played"
          value={stats?.uniqueArtists || 0}
          icon={Flame}
          iconBgColor="bg-[#2a200f]"
          iconTextColor="text-[#eab308]"
          isActive={currentView === '/most-played'}
          onClick={() => onNavigateView('/most-played')}
        />
        <StatCard
          label="Albums"
          value={stats?.uniqueAlbums || 0}
          icon={CheckCircle2}
          iconBgColor="bg-[#0e271c]"
          iconTextColor="text-[#10b981]"
          isActive={currentView === '/albums'}
          onClick={() => onNavigateView('/albums')}
        />
      </div>
    </header>
  );
};
