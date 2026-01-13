using System.ComponentModel.DataAnnotations;

namespace Kino.Server.DTOs
{
    public class CreateReviewDto
    {
        [Required]
        public int MovieId { get; set; } // This is the TMDB ID

        [Required]
        public string MovieTitle { get; set; } = string.Empty;

        public string? PosterPath { get; set; }

        [Range(1, 5)]
        public int Rating { get; set; }

        public string Content { get; set; } = string.Empty;

        public DateTime DateWatched { get; set; }
    }
}