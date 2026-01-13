using Kino.Server.DTOs;

namespace Kino.Server.Services
{
    public interface ITmdbService
    {
        Task<List<TmdbMovieResult>> SearchMoviesAsync(string query);
        Task<List<TmdbMovieResult>> GetNowPlayingAsync(); // <--- This was missing
    }
}