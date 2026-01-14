using System.ComponentModel.DataAnnotations;

namespace Kino.Server.Models
{
    public class ReviewLike
    {
        public int Id { get; set; }
        public int ReviewId { get; set; }
        
        [Required]
        public string UserId { get; set; } = string.Empty; // <--- FIX: Initialize to Empty
    }
}