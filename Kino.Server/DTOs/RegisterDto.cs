using System.ComponentModel.DataAnnotations;

namespace Kino.Server.DTOs
{
    public class RegisterDto
    {
        [Required]
        public string Username { get; set; } = string.Empty;

        // FIX: Added DisplayName so it can be passed from the Registration form
        public string DisplayName { get; set; } = string.Empty;

        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;

        [Required]
        public string Password { get; set; } = string.Empty;
    }
}