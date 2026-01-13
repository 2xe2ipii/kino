using System.ComponentModel.DataAnnotations;

namespace Kino.Server.Models
{
    public class UserProfile
    {
        public int Id { get; set; }
        
        [Required]
        public string UserId { get; set; } = string.Empty; // Links to IdentityUser

        public string DisplayName { get; set; } = string.Empty; // New: Custom Name
        public string AvatarUrl { get; set; } = string.Empty;   // New: Photo URL
        
        public string Bio { get; set; } = string.Empty;
        public string FavoriteMovie { get; set; } = string.Empty;
    }
}