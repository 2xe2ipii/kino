using System.ComponentModel.DataAnnotations;

namespace Kino.Server.Models
{
    public class UserProfile
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public string UserId { get; set; } = string.Empty; 

        public string DisplayName { get; set; } = string.Empty;
        
        public string AvatarUrl { get; set; } = string.Empty;
        public string Bio { get; set; } = string.Empty;
        public string FavoriteMovie { get; set; } = string.Empty;

        // FIX: Added DateJoined property
        public DateTime DateJoined { get; set; } = DateTime.UtcNow;
    }
}