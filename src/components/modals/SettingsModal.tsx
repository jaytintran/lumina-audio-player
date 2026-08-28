import React, { useState, useEffect } from 'react';
import {
  X,
  Sliders,
  Palette,
  Volume2,
  HardDrive,
  Moon,
  Sun,
  Trash2,
  Check,
  ShieldCheck,
  RotateCw,
} from 'lucide-react';
import { db, getAppSettings, updateAppSettings } from '../../db/db';
import type { AppSettings } from '../../db/schema';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'general' | 'appearance' | 'playback' | 'sources'>('appearance');
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [savedToast, setSavedToast] = useState(false);

  // Storage Stats State
  const [storageUsageBytes, setStorageUsageBytes] = useState<number>(0);
  const [storageQuotaBytes, setStorageQuotaBytes] = useState<number>(0);
  const [trackCount, setTrackCount] = useState<number>(0);
  const [isRefreshingStorage, setIsRefreshingStorage] = useState(false);

  const fetchStorageStats = async () => {
    setIsRefreshingStorage(true);
    try {
      if (navigator.storage && navigator.storage.estimate) {
        const estimate = await navigator.storage.estimate();
        setStorageUsageBytes(estimate.usage || 0);
        setStorageQuotaBytes(estimate.quota || 0);
      }
      const count = await db.tracks.count();
      setTrackCount(count);
    } catch (err) {
      console.error('Failed to estimate storage:', err);
    } finally {
      setIsRefreshingStorage(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      getAppSettings().then(setSettings);
      fetchStorageStats();
    }
  }, [isOpen]);

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  if (!isOpen || !settings) return null;

  const handleUpdate = async (partial: Partial<AppSettings>) => {
    const updated = { ...settings, ...partial };
    setSettings(updated);
    await updateAppSettings(partial);
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 2000);
  };

  const handleClearAllData = async () => {
    if (confirm('Are you sure you want to completely clear the local database and OPFS audio storage?')) {
      await db.tracks.clear();
      await db.playlists.clear();
      await db.folders.clear();
      await db.trackPlaylists.clear();
      await db.trackFolders.clear();
      window.location.reload();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-[#090d12] rounded-3xl p-6 shadow-2xl border border-[#17232e] flex flex-col min-h-[560px] max-h-[88vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#17232e]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">Lumina Audio Settings</h2>
              <p className="text-xs text-slate-400">Customize player appearance, audio engine, and privacy</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 py-3 border-b border-[#17232e] text-xs">
          {[
            { id: 'appearance', label: 'Appearance', icon: Palette },
            { id: 'playback', label: 'Playback', icon: Volume2 },
            { id: 'sources', label: 'Storage & Privacy', icon: HardDrive },
            { id: 'general', label: 'General', icon: Sliders },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Contents - Scrollable */}
        <div className="flex-1 overflow-y-auto py-5 space-y-5 pr-2 text-xs custom-scrollbar">
          {/* APPEARANCE TAB */}
          {activeTab === 'appearance' && (
            <div className="space-y-4">
              {/* View Mode */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-card/60 border border-border">
                <div>
                  <p className="font-semibold text-foreground">Default Library View Mode</p>
                  <p className="text-muted-foreground text-[11px]">
                    Choose between vertical card grid or horizontal list rows
                  </p>
                </div>
                <div className="flex items-center gap-1 bg-neutral-900 p-1 rounded-xl border border-border">
                  <button
                    onClick={() => handleUpdate({ viewMode: 'grid' })}
                    className={`px-3 py-1 rounded-lg transition-all ${
                      settings.viewMode === 'grid' ? 'bg-primary/20 text-primary font-bold shadow-sm' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Grid (Vertical)
                  </button>
                  <button
                    onClick={() => handleUpdate({ viewMode: 'row' })}
                    className={`px-3 py-1 rounded-lg transition-all ${
                      settings.viewMode === 'row' ? 'bg-primary/20 text-primary font-bold shadow-sm' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Row (Horizontal)
                  </button>
                </div>
              </div>

              {/* Tracks Per Row */}
              <div className="p-3.5 rounded-2xl bg-card/60 border border-border space-y-2.5">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-foreground">Cards Per Row</p>
                    <p className="text-muted-foreground text-[11px]">
                      {settings.viewMode === 'row'
                        ? 'Choose column count for horizontal track rows (1 gives a full-width classic music player list)'
                        : 'Choose column count for vertical card grid (2 – 6)'}
                    </p>
                  </div>
                  <span className="font-mono text-primary font-bold text-xs px-2.5 py-0.5 rounded-md bg-primary/10 border border-primary/20">
                    {settings.tracksPerRow || (settings.viewMode === 'row' ? 1 : 4)} {((settings.tracksPerRow || 1) === 1) ? 'Row' : 'Columns'}
                  </span>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  {(settings.viewMode === 'row' ? [1, 2, 3, 4, 5, 6] : [2, 3, 4, 5, 6]).map((num) => (
                    <button
                      key={num}
                      onClick={() => handleUpdate({ tracksPerRow: num })}
                      className={`flex-1 py-1.5 rounded-xl font-mono text-xs font-semibold transition-all border ${
                        (settings.tracksPerRow || (settings.viewMode === 'row' ? 1 : 4)) === num
                          ? 'bg-primary/20 border-primary/40 text-primary shadow-sm'
                          : 'bg-neutral-900/60 border-border text-muted-foreground hover:text-foreground hover:border-border/80'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>

              {/* Theme Selector */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-card/60 border border-border">
                <div>
                  <p className="font-semibold text-foreground">Color Theme</p>
                  <p className="text-muted-foreground text-[11px]">Glassmorphism dark theme optimized for OLED</p>
                </div>
                <div className="flex items-center gap-1 bg-neutral-900 p-1 rounded-xl border border-border">
                  <button
                    onClick={() => handleUpdate({ theme: 'dark' })}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all ${
                      settings.theme === 'dark' ? 'bg-primary/20 text-primary font-bold' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Moon className="w-3.5 h-3.5" />
                    <span>Dark</span>
                  </button>
                  <button
                    onClick={() => handleUpdate({ theme: 'light' })}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all ${
                      settings.theme === 'light' ? 'bg-primary/20 text-primary font-bold' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Sun className="w-3.5 h-3.5" />
                    <span>Light</span>
                  </button>
                </div>
              </div>

              {/* Metadata Visibility Section */}
              <div className="p-4 rounded-2xl bg-card/60 border border-border space-y-3.5">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">Metadata Visibility</h4>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Toggle what info appears across track cards and rows</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    { key: "showArtist", label: "Artist Name", defaultVal: true },
                    { key: "showAlbum", label: "Album Title", defaultVal: true },
                    { key: "showDuration", label: "Track Duration", defaultVal: true },
                    { key: "showBitrate", label: "Format & Quality", defaultVal: true },
                    { key: "showRating", label: "Star Ratings", defaultVal: true },
                    { key: "showGenre", label: "Genre Tag", defaultVal: true },
                    { key: "showTags", label: "Category Tags", defaultVal: true },
                    { key: "showPlayCount", label: "Play Count", defaultVal: false },
                  ].map(({ key, label, defaultVal }) => {
                    const isChecked = Boolean(settings[key as keyof AppSettings] ?? defaultVal);
                    return (
                      <div
                        key={key}
                        onClick={() => handleUpdate({ [key]: !isChecked })}
                        className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl border transition-all cursor-pointer select-none ${
                          isChecked
                            ? 'bg-[#0f241a] border-emerald-500/40 text-slate-100 shadow-sm'
                            : 'bg-[#090d12]/60 border-[#151e28]/70 text-slate-500 opacity-40 hover:opacity-75 hover:border-[#1e2a38]'
                        }`}
                      >
                        <span className={`text-xs font-medium truncate ${isChecked ? 'text-slate-100 font-semibold' : 'text-slate-500'}`}>
                          {label}
                        </span>
                        <div className="w-5 h-5 flex items-center justify-center shrink-0">
                          {isChecked && <Check className="w-4 h-4 text-emerald-400 stroke-[2.5]" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* PLAYBACK TAB */}
          {activeTab === 'playback' && (
            <div className="space-y-4">
              {/* Gapless Playback */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-card/60 border border-border">
                <div>
                  <p className="font-semibold text-foreground">Gapless Playback</p>
                  <p className="text-muted-foreground text-[11px]">Seamless audio transitions without silence gaps</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.gaplessPlayback}
                  onChange={(e) => handleUpdate({ gaplessPlayback: e.target.checked })}
                  className="w-4 h-4 rounded bg-neutral-900 border-border text-primary focus:ring-0 cursor-pointer"
                />
              </div>

              {/* Crossfade */}
              <div className="p-3.5 rounded-2xl bg-card/60 border border-border space-y-2">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-foreground">Crossfade Transition</p>
                    <p className="text-muted-foreground text-[11px]">Smoothly blend between consecutive tracks</p>
                  </div>
                  <span className="font-mono text-primary font-bold">{settings.crossfade}s</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={12}
                  value={settings.crossfade}
                  onChange={(e) => handleUpdate({ crossfade: parseInt(e.target.value, 10) })}
                  className="w-full h-1.5 rounded-lg bg-neutral-800 appearance-none cursor-pointer"
                />
              </div>

              {/* Default Speed */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-card/60 border border-border">
                <div>
                  <p className="font-semibold text-foreground">Default Playback Speed</p>
                  <p className="text-muted-foreground text-[11px]">Useful for podcasts and audiobooks</p>
                </div>
                <select
                  value={settings.playbackRate}
                  onChange={(e) => handleUpdate({ playbackRate: parseFloat(e.target.value) })}
                  className="bg-neutral-900 border border-border text-foreground rounded-xl px-3 py-1.5 focus:outline-none cursor-pointer font-mono"
                >
                  <option value={0.75}>0.75x</option>
                  <option value={1.0}>1.0x (Normal)</option>
                  <option value={1.25}>1.25x</option>
                  <option value={1.5}>1.5x</option>
                  <option value={2.0}>2.0x</option>
                </select>
              </div>
            </div>
          )}

          {/* STORAGE & PRIVACY */}
          {activeTab === 'sources' && (
            <div className="space-y-4">
              {/* Storage & Data Section matching screenshot */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <HardDrive className="w-4 h-4 text-emerald-400" />
                    <h4 className="text-xs font-bold text-slate-100">Storage & Data</h4>
                  </div>
                  <button
                    onClick={fetchStorageStats}
                    disabled={isRefreshingStorage}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-[#141d27] transition-all disabled:opacity-50"
                    title="Refresh Storage Usage"
                  >
                    <RotateCw className={`w-3.5 h-3.5 ${isRefreshingStorage ? 'animate-spin text-emerald-400' : ''}`} />
                  </button>
                </div>

                {/* Storage Card Container matching screenshot */}
                <div className="p-4 rounded-2xl bg-[#090d12] border border-[#17232e] space-y-3 shadow-inner">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-slate-100 font-mono">
                      {formatBytes(storageUsageBytes)} used
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      Initial pool: {storageQuotaBytes > 0 ? formatBytes(storageQuotaBytes) : '2.0 GB'} (Auto-expandable)
                    </span>
                  </div>

                  {/* Emerald Progress Bar */}
                  <div className="w-full h-1.5 rounded-full bg-[#141d27] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-emerald-500 transition-all duration-500 shadow-sm shadow-emerald-500/50"
                      style={{
                        width: `${Math.max(
                          Math.min(
                            storageQuotaBytes > 0
                              ? (storageUsageBytes / storageQuotaBytes) * 100
                              : 0,
                            100
                          ),
                          storageUsageBytes > 0 ? 3 : 0
                        )}%`,
                      }}
                    />
                  </div>

                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Stores {trackCount} {trackCount === 1 ? 'audio track' : 'audio tracks'}, cached metadata, playlists, and OPFS files. Storage dynamically grows on your disk as more songs are imported.
                  </p>
                </div>
              </div>

              {/* Local-First Guarantee Notice */}
              <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-emerald-300">100% Local-First & Private</p>
                  <p className="text-zinc-400 text-[11px] mt-0.5 leading-relaxed">
                    All audio binaries, ID3 tags, and cover images are stored exclusively inside your browser's
                    Origin Private File System (OPFS) and IndexedDB. No files or metadata ever leave your machine.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* GENERAL TAB */}
          {activeTab === 'general' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-card/60 border border-border">
                <p className="font-semibold text-foreground">About Lumina Audio</p>
                <p className="text-muted-foreground text-[11px] mt-0.5">
                  Version 1.0.0 • Built with React 19, TypeScript, Dexie.js, OPFS & Web Audio API
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-rose-950/20 border border-rose-500/30 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-rose-300">Clear Library Data</p>
                  <p className="text-zinc-400 text-[11px]">Deletes all tracks, playlists, and cached audio files</p>
                </div>
                <button
                  onClick={handleClearAllData}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 border border-rose-500/40 font-bold text-xs transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Reset App</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-border">
          {savedToast ? (
            <span className="flex items-center gap-1 text-emerald-400 text-xs font-semibold animate-in fade-in">
              <Check className="w-3.5 h-3.5" />
              <span>Settings Saved</span>
            </span>
          ) : (
            <span />
          )}

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
