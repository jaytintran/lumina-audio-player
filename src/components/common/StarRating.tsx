import React, { useState } from 'react';
import { Star } from 'lucide-react';

interface StarRatingProps {
  rating: number; // 0 - 5
  onChange?: (rating: number) => void;
  size?: 'sm' | 'md';
  readonly?: boolean;
}

export const StarRating: React.FC<StarRatingProps> = ({
  rating,
  onChange,
  size = 'sm',
  readonly = false,
}) => {
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  const starSize = size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4';
  const displayRating = hoverRating !== null ? hoverRating : rating;

  return (
    <div
      className="flex items-center gap-0.5"
      onMouseLeave={() => !readonly && setHoverRating(null)}
      onClick={(e) => e.stopPropagation()}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onMouseEnter={() => !readonly && setHoverRating(star)}
          onClick={() => {
            if (!readonly && onChange) {
              onChange(star === rating ? 0 : star);
            }
          }}
          className={`p-0.5 rounded transition-colors ${
            readonly ? 'cursor-default' : 'cursor-pointer'
          } ${
            star <= displayRating
              ? 'text-amber-400 fill-amber-400'
              : 'text-zinc-600 hover:text-zinc-400'
          }`}
          title={readonly ? `${rating} stars` : `Rate ${star} star${star > 1 ? 's' : ''}`}
        >
          <Star className={`${starSize} ${star <= displayRating ? 'fill-amber-400' : ''}`} />
        </button>
      ))}
    </div>
  );
};
