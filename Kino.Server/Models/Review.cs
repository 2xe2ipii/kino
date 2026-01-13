using System.ComponentModel.DataAnnotations;

namespace Kino.Server.Models
{
    public class Review
    {
        public int Id { get; set; }

        [Required]
        public string Content { get; set; } = string.Empty;

        [Range(1, 5)]
        public int Rating { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // --- NEW: Link to the User ---
        public string? UserId { get; set; } 

        // Foreign Keys
        public int MovieId { get; set; }
        
        [System.Text.Json.Serialization.JsonIgnore] 
        public Movie? Movie { get; set; }
    }
}