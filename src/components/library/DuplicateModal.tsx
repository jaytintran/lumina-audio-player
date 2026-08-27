import React, { useState } from 'react';
import { AlertCircle, ArrowRight, RefreshCw, SkipForward, Copy } from 'lucide-react';
import type { Track } from '../../db/schema';
import type { DuplicateAction } from '../../services/importer';
import { CoverArt } from '../common/CoverArt';
import { formatDuration } from '../../utils/formatters';

interface DuplicateModalProps {
  incomingFile: File;
  existingTrack: Track;
  onResolve: (action: DuplicateAction, applyToAll: boolean) => void;
}

export const DuplicateModal: React.FC<DuplicateModalProps> = ({
  incomingFile,
  existingTrack,
  onResolve,
}) => {
  const [applyToAll, setApplyToAll] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg glass-panel rounded-3xl p-6 shadow-2xl border border-amber-500/30 space-y-5">
        <div className="flex items-center gap-3 text-amber-400">
          <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/20">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-base text-zinc-100">Duplicate Audio Detected</h3>
            <p className="text-xs text-zinc-400">
              An identical audio file already exists in your local library.
            </p>
          </div>
        </div>

        {/* Comparison card */}
        <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-3">
          <div className="flex items-center gap-3">
            <CoverArt coverKey={existingTrack.coverKey} title={existingTrack.title} size="md" />
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm text-zinc-200 truncate">{existingTrack.title}</p>
              <p className="text-xs text-zinc-400 truncate">{existingTrack.artist}</p>
              <p className="text-[11px] text-zinc-500 font-mono">
                Duration: {formatDuration(existingTrack.duration)} • Format: {existingTrack.format.toUpperCase()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-zinc-400 pt-2 border-t border-zinc-800/80">
            <span className="text-amber-400 font-semibold">Incoming File:</span>
            <span className="font-mono text-zinc-300 truncate">{incomingFile.name}</span>
          </div>
        </div>

        {/* Options */}
        <div className="space-y-2">
          <button
            onClick={() => onResolve('skip', applyToAll)}
            className="w-full flex items-center justify-between p-3 rounded-2xl bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-700/60 text-left transition-colors"
          >
            <div className="flex items-center gap-3">
              <SkipForward className="w-4 h-4 text-cyan-400" />
              <div>
                <p className="font-semibold text-xs text-zinc-200">Skip Incoming File (Recommended)</p>
                <p className="text-[11px] text-zinc-500">Keep current library track and ignore duplicate</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-zinc-500" />
          </button>

          <button
            onClick={() => onResolve('replace', applyToAll)}
            className="w-full flex items-center justify-between p-3 rounded-2xl bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-700/60 text-left transition-colors"
          >
            <div className="flex items-center gap-3">
              <RefreshCw className="w-4 h-4 text-amber-400" />
              <div>
                <p className="font-semibold text-xs text-zinc-200">Replace Existing Metadata</p>
                <p className="text-[11px] text-zinc-500">Re-extract tags from new file and update track</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-zinc-500" />
          </button>

          <button
            onClick={() => onResolve('keepBoth', applyToAll)}
            className="w-full flex items-center justify-between p-3 rounded-2xl bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-700/60 text-left transition-colors"
          >
            <div className="flex items-center gap-3">
              <Copy className="w-4 h-4 text-purple-400" />
              <div>
                <p className="font-semibold text-xs text-zinc-200">Keep Both</p>
                <p className="text-[11px] text-zinc-500">Create a separate library entry</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-zinc-500" />
          </button>
        </div>

        {/* Apply to all remaining conflicts */}
        <label className="flex items-center gap-2.5 text-xs text-zinc-400 cursor-pointer select-none pt-1">
          <input
            type="checkbox"
            checked={applyToAll}
            onChange={(e) => setApplyToAll(e.target.checked)}
            className="w-4 h-4 rounded bg-zinc-900 border-zinc-700 text-cyan-500 focus:ring-0 focus:outline-none"
          />
          <span>Apply this decision to all remaining duplicates in this batch</span>
        </label>
      </div>
    </div>
  );
};
