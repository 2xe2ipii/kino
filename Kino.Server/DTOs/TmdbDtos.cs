namespace Kino.Server.DTOs
{
    // Result of searching for a movie
    public class TmdbSearchResponse
    {
        public List<TmdbMovieResult> Results { get; set; } = new();
    }

    public class TmdbMovieResult
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Overview { get; set; } = string.Empty;
        public string Release_Date { get; set; } = string.Empty; // Format: "2023-12-25"
        public string Poster_Path { get; set; } = string.Empty;
    }
}