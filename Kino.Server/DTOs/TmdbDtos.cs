using System.Text.Json.Serialization; // <--- ADD THIS

namespace Kino.Server.DTOs
{
    public class TmdbSearchResponse
    {
        [JsonPropertyName("results")] // Matches TMDB JSON
        public List<TmdbMovieResult> Results { get; set; } = new();
    }

    public class TmdbMovieResult
    {
        [JsonPropertyName("id")]
        public int Id { get; set; }

        [JsonPropertyName("title")]
        public string Title { get; set; } = string.Empty;

        [JsonPropertyName("overview")]
        public string Overview { get; set; } = string.Empty;

        [JsonPropertyName("release_date")] // Maps "release_date" <-> "Release_Date"
        public string Release_Date { get; set; } = string.Empty;

        [JsonPropertyName("poster_path")] // Maps "poster_path" <-> "Poster_Path"
        public string Poster_Path { get; set; } = string.Empty;
    }
}