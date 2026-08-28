import React from 'react';
import { Play } from 'lucide-react';
import { usePlayerStore } from '../../stores/playerStore';

interface MarkdownRendererProps {
  content: string;
  className?: string;
  onSeekTo?: (seconds: number) => void;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
  className = '',
  onSeekTo,
}) => {
  const { seek } = usePlayerStore();

  const handleTimestampClick = (timeStr: string) => {
    const parts = timeStr.split(':').map((p) => parseInt(p, 10));
    let seconds = 0;
    if (parts.length === 2) {
      seconds = parts[0] * 60 + parts[1];
    } else if (parts.length === 3) {
      seconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
    }
    if (onSeekTo) {
      onSeekTo(seconds);
    } else {
      seek(seconds);
    }
  };

  if (!content || !content.trim()) {
    return (
      <div className="text-slate-500 italic text-xs py-4">
        No description or notes added for this audio track.
      </div>
    );
  }

  // Parse markdown lines into formatted blocks with interactive timestamp triggers
  const lines = content.split('\n');

  const renderFormattedText = (text: string) => {
    // Match timestamps like 01:23, 1:23:45, 00:45
    const timestampRegex = /\b(\d{1,2}:\d{2}(?::\d{2})?)\b/g;

    // Replace bold **text** or *italic*
    const tokens = text.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`|\b\d{1,2}:\d{2}(?::\d{2})?\b)/g);

    return tokens.map((token, i) => {
      if (token.startsWith('**') && token.endsWith('**')) {
        return (
          <strong key={i} className="font-bold text-slate-100">
            {token.slice(2, -2)}
          </strong>
        );
      }
      if (token.startsWith('*') && token.endsWith('*')) {
        return (
          <em key={i} className="italic text-slate-300">
            {token.slice(1, -1)}
          </em>
        );
      }
      if (token.startsWith('`') && token.endsWith('`')) {
        return (
          <code
            key={i}
            className="px-1.5 py-0.5 rounded bg-[#131b26] border border-[#223244] text-[11px] text-emerald-400 font-mono"
          >
            {token.slice(1, -1)}
          </code>
        );
      }
      if (timestampRegex.test(token)) {
        return (
          <button
            key={i}
            type="button"
            onClick={() => handleTimestampClick(token)}
            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-500/30 text-emerald-400 font-mono text-[11px] font-semibold transition-colors mx-0.5 cursor-pointer"
            title={`Seek to ${token}`}
          >
            <Play className="w-2.5 h-2.5 fill-current" />
            <span>{token}</span>
          </button>
        );
      }
      return token;
    });
  };

  return (
    <div className={`space-y-2.5 text-xs text-slate-300 leading-relaxed ${className}`}>
      {lines.map((line, idx) => {
        const trimmed = line.trim();

        // Empty line
        if (!trimmed) {
          return <div key={idx} className="h-2" />;
        }

        // Heading 1
        if (line.startsWith('# ')) {
          return (
            <h1
              key={idx}
              className="text-base sm:text-lg font-extrabold text-slate-100 border-b border-[#1b2633] pb-1.5 pt-2"
            >
              {renderFormattedText(line.replace('# ', ''))}
            </h1>
          );
        }

        // Heading 2
        if (line.startsWith('## ')) {
          return (
            <h2 key={idx} className="text-sm font-bold text-emerald-400 pt-1.5">
              {renderFormattedText(line.replace('## ', ''))}
            </h2>
          );
        }

        // Heading 3
        if (line.startsWith('### ')) {
          return (
            <h3 key={idx} className="text-xs font-bold text-slate-200 uppercase tracking-wide pt-1">
              {renderFormattedText(line.replace('### ', ''))}
            </h3>
          );
        }

        // Checklist / Task items
        if (line.startsWith('- [ ] ') || line.startsWith('- [x] ') || line.startsWith('- [X] ')) {
          const isChecked = line.startsWith('- [x] ') || line.startsWith('- [X] ');
          const taskText = line.replace(/- \[[ xX]\] /, '');
          return (
            <div key={idx} className="flex items-start gap-2 pl-1">
              <input
                type="checkbox"
                readOnly
                checked={isChecked}
                className="mt-0.5 w-3.5 h-3.5 rounded bg-[#101721] border-[#223040] text-emerald-500 accent-emerald-500"
              />
              <span className={isChecked ? 'line-through text-slate-500' : 'text-slate-200'}>
                {renderFormattedText(taskText)}
              </span>
            </div>
          );
        }

        // Bullet List
        if (line.startsWith('- ') || line.startsWith('* ')) {
          return (
            <div key={idx} className="flex items-start gap-2 pl-2">
              <span className="text-emerald-400 text-sm leading-none mt-0.5">•</span>
              <span className="flex-1">{renderFormattedText(line.replace(/^[-*]\s+/, ''))}</span>
            </div>
          );
        }

        // Blockquote
        if (line.startsWith('> ')) {
          return (
            <blockquote
              key={idx}
              className="border-l-2 border-emerald-500/60 pl-3 py-1 bg-emerald-950/20 text-slate-300 italic rounded-r-lg"
            >
              {renderFormattedText(line.replace('> ', ''))}
            </blockquote>
          );
        }

        // Standard Paragraph Line
        return (
          <p key={idx} className="text-slate-300">
            {renderFormattedText(line)}
          </p>
        );
      })}
    </div>
  );
};
