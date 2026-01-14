using System.ComponentModel.DataAnnotations;

namespace Kino.Server.DTOs
{
    public class ResendDto
    {
        [Required]
        public string UserId { get; set; } = string.Empty;
    }
}