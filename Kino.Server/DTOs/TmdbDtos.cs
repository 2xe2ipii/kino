using System.Text.Json.Serialization;

namespace Kino.Server.DTOs
{
    // Result of searching for a movie
    public class TmdbSearchResponse
    {
        [JsonPropertyName("results")]
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

        [JsonPropertyName("release_date")]
        public string Release_Date { get; set; } = string.Empty; // Now maps "release_date" <-> "Release_Date"

        [JsonPropertyName("poster_path")]
        public string Poster_Path { get; set; } = string.Empty; // Now maps "poster_path" <-> "Poster_Path"
    }
}