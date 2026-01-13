using System.ComponentModel.DataAnnotations;

namespace Kino.Server.Models
{
    public class Movie
    {
        public int Id { get; set; }
        [Required]
        public string Title { get; set; } = string.Empty;
        public int TmdbId { get; set; } // for fetching posters
        public int Year { get; set; }
        public string? PosterPath { get; set; } // because we might not always have a poster
        public string? Overview { get; set; } 
    }
}