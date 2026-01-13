using System.ComponentModel.DataAnnotations;

namespace Kino.Server.DTOs
{
    public class VerifyEmailDto
    {
        [Required]
        public string UserId { get; set; } = string.Empty;

        [Required]
        public string Token { get; set; } = string.Empty;
    }
}