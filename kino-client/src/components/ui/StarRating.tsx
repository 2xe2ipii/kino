import { useState } from 'react';

interface StarRatingProps {
    rating: number;
    setRating: (rating: number) => void;
    editable?: boolean;
}

export const StarRating = ({ rating, setRating, editable = true }: StarRatingProps) => {
    const [hover, setHover] = useState(0);

    return (
        <div className="flex space-x-1">
            {[...Array(5)].map((_, index) => {
                const starValue = index + 1;
                return (
                    <button
                        type="button"
                        key={index}
                        disabled={!editable}
                        className={`text-2xl transition-colors ${
                            starValue <= (hover || rating) 
                                ? "text-rose-500 drop-shadow-[0_0_8px_rgba(244,63,94,0.4)]" 
                                : "text-slate-300"
                        }`}
                        onClick={() => setRating(starValue)}
                        onMouseEnter={() => editable && setHover(starValue)}
                        onMouseLeave={() => editable && setHover(rating)}
                    >
                        ★
                    </button>
                );
            })}
        </div>
    );
};