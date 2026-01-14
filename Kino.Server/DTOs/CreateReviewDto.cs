using System.ComponentModel.DataAnnotations;

namespace Kino.Server.DTOs
{
    public class CreateReviewDto
    {
        [Required]
        public int MovieId { get; set; }

        [Required]
        public string MovieTitle { get; set; } = string.Empty;

        public string? PosterPath { get; set; }

        // --- FIXED: Updated to match the new Frontend ---
        [Range(0, 100)]
        public int RatingTechnical { get; set; }

        [Range(0, 100)]
        public int RatingEnjoyment { get; set; }

        public string? VibeTags { get; set; }

        // --- FIXED: Character Limit ---
        [MaxLength(500, ErrorMessage = "Thoughts cannot exceed 500 characters.")]
        public string Content { get; set; } = string.Empty;

        public DateTime DateWatched { get; set; }
    }
}