import React, { useState, useRef, useEffect } from 'react';

interface AutoSuggestInputProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  suggestions: { value: string; count: number }[];
  placeholder?: string;
  required?: boolean;
  className?: string;
  inputClassName?: string;
  icon?: React.ReactNode;
}

export const AutoSuggestInput: React.FC<AutoSuggestInputProps> = ({
  label,
  value,
  onChange,
  suggestions,
  placeholder,
  required = false,
  className = '',
  inputClassName = '',
  icon,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  // Filter suggestions matching current input
  const filteredSuggestions = (suggestions || []).filter((s) => {
    if (!value || !value.trim()) return true;
    return s.value.toLowerCase().includes(value.toLowerCase());
  }).slice(0, 7);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || filteredSuggestions.length === 0) {
      if (e.key === 'ArrowDown') {
        setIsOpen(true);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev + 1) % filteredSuggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev - 1 + filteredSuggestions.length) % filteredSuggestions.length);
    } else if (e.key === 'Enter' && highlightedIndex >= 0) {
      e.preventDefault();
      handleSelect(filteredSuggestions[highlightedIndex].value);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setHighlightedIndex(-1);
    }
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && (
        <label className="flex items-center gap-1.5 text-[11px] text-slate-400 mb-1">
          {icon}
          <span>{label}</span>
        </label>
      )}

      <input
        type="text"
        required={required}
        value={value}
        placeholder={placeholder}
        onFocus={() => setIsOpen(true)}
        onChange={(e) => {
          onChange(e.target.value);
          setIsOpen(true);
          setHighlightedIndex(-1);
        }}
        onKeyDown={handleKeyDown}
        className={`w-full px-3 py-2 rounded-lg bg-[#141b24] border border-[#223040] text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500/80 transition-colors ${inputClassName}`}
      />

      {/* Suggestion Popover */}
      {isOpen && filteredSuggestions.length > 0 && (
        <div className="absolute left-0 top-full mt-1 w-full bg-[#0d141d] border border-[#1e2d3e] rounded-xl shadow-2xl z-50 py-1 max-h-40 overflow-y-auto custom-scrollbar animate-in fade-in zoom-in-95 duration-100">
          {filteredSuggestions.map((item, idx) => {
            const isHighlighted = idx === highlightedIndex;
            const isExactMatch = item.value.toLowerCase() === value.trim().toLowerCase();

            return (
              <button
                key={item.value}
                type="button"
                onClick={() => handleSelect(item.value)}
                onMouseEnter={() => setHighlightedIndex(idx)}
                className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between transition-colors ${
                  isHighlighted
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : isExactMatch
                    ? 'text-emerald-400 font-semibold bg-emerald-950/20'
                    : 'text-slate-300 hover:bg-[#151f2b] hover:text-slate-100'
                }`}
              >
                <span className="truncate">{item.value}</span>
                <span className="text-[10px] font-mono text-slate-500 shrink-0 ml-2">
                  {item.count} {item.count === 1 ? 'track' : 'tracks'}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
