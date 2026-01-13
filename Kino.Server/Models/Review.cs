using System.ComponentModel.DataAnnotations;

namespace Kino.Server.Models
{
    public class Review
    {
        public int Id { get; set; }

        [Required]
        public string Content { get; set; } = string.Empty;

        [Range(1, 5)]
        public int Rating { get; set; } // 1 to 5 stars

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Foreign Keys
        public int MovieId { get; set; }
        
        // Navigation Property (Links this review to the Movie table)
        // We use "ignore" on JSON to prevent infinite loops when fetching data
        [System.Text.Json.Serialization.JsonIgnore] 
        public Movie? Movie { get; set; }
    }
}