namespace Kino.Server.Models
{
    public class User
    {
        public int Id { get; set; }
        public string GoogleId { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Username { get; set; } = string.Empty;
        public string DisplayName { get; set; } = string.Empty;
        public string AvatarUrl { get; set; } = string.Empty;
        public string Bio { get; set; } = string.Empty;
        public DateTime DateJoined { get; set; }
        public ICollection<UserTopMovie> TopMovies { get; set; } = new List<UserTopMovie>();
    }
}
