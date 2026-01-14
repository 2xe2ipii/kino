using System.ComponentModel.DataAnnotations;

namespace Kino.Server.Models
{
    public class Review
    {
        public int Id { get; set; }

        [Required]
        public string Content { get; set; } = string.Empty;

        // The "Head vs Heart" System ---
        // Scale 0-100 (percentage)
        public int RatingTechnical { get; set; } 
        public int RatingEnjoyment { get; set; } 

        // Comma-separated tags (e.g., "VisuallyStunning,Tearjerker")
        public string? VibeTags { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public string? UserId { get; set; } 

        public int MovieId { get; set; }
        
        [System.Text.Json.Serialization.JsonIgnore] 
        public Movie? Movie { get; set; }

        // Navigation for Likes
        public ICollection<ReviewLike> Likes { get; set; } = new List<ReviewLike>();
    }
}