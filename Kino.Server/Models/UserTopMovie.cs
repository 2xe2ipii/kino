namespace Kino.Server.Models
{
    public class UserTopMovie
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public int Rank { get; set; }
        public int TmdbId { get; set; }
        public string Title { get; set; } = string.Empty;
        public string? PosterPath { get; set; }
        public User User { get; set; } = null!;
    }
}
