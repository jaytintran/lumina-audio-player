import React, { useEffect, useState } from 'react';
import { Music2 } from 'lucide-react';
import { readObjectUrl } from '../../db/opfs';

interface CoverArtProps {
  coverKey?: string;
  title?: string;
  artist?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showGlow?: boolean;
  isSpinning?: boolean;
}

export const CoverArt: React.FC<CoverArtProps> = ({
  coverKey,
  title = '',
  className = '',
  size = 'md',
  showGlow = false,
  isSpinning = false,
}) => {
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setLoadFailed(false);

    if (coverKey) {
      readObjectUrl(coverKey).then((url) => {
        if (isMounted) {
          setImgUrl(url);
        }
      }).catch(() => {
        if (isMounted) setLoadFailed(true);
      });
    } else {
      setImgUrl(null);
    }

    return () => {
      isMounted = false;
    };
  }, [coverKey]);

  const sizeClasses = {
    sm: 'w-10 h-10 rounded-lg text-xs',
    md: 'w-12 h-12 rounded-xl text-sm',
    lg: 'w-24 h-24 rounded-2xl text-base',
    xl: 'w-48 h-48 rounded-3xl text-lg',
    full: 'w-full h-full rounded-2xl',
  }[size];

  // Hash-based deterministic gradient background for tracks without covers
  const getGradient = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const colors = [
      'from-cyan-900/60 to-blue-950/80 border-cyan-500/20 text-cyan-400',
      'from-purple-900/60 to-indigo-950/80 border-purple-500/20 text-purple-400',
      'from-emerald-900/60 to-teal-950/80 border-emerald-500/20 text-emerald-400',
      'from-rose-900/60 to-pink-950/80 border-rose-500/20 text-rose-400',
      'from-amber-900/60 to-orange-950/80 border-amber-500/20 text-amber-400',
    ];
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <div
      className={`relative flex items-center justify-center shrink-0 overflow-hidden select-none transition-all duration-300 ${sizeClasses} ${className} ${
        showGlow ? 'ring-2 ring-cyan-500/30 shadow-lg shadow-cyan-500/10' : ''
      }`}
    >
      {imgUrl && !loadFailed ? (
        <img
          src={imgUrl}
          alt={title}
          onError={() => setLoadFailed(true)}
          className={`w-full h-full object-cover transition-transform duration-500 ${
            isSpinning ? 'animate-spin-slow' : ''
          }`}
          loading="lazy"
        />
      ) : (
        <div
          className={`w-full h-full bg-gradient-to-br border flex items-center justify-center ${getGradient(
            title || 'Lumina'
          )}`}
        >
          <Music2 className="w-1/2 h-1/2 opacity-70" />
        </div>
      )}
    </div>
  );
};
