using RestSharp;
using Kino.Server.DTOs;

namespace Kino.Server.Services
{
    public class TmdbService : ITmdbService
    {
        private readonly string _apiKey;
        private readonly RestClient _client;

        public TmdbService(IConfiguration config)
        {
            _apiKey = config["Tmdb:ApiKey"] ?? throw new ArgumentNullException("Tmdb:ApiKey is missing");
            _client = new RestClient("https://api.themoviedb.org/3/");
        }

        public async Task<List<TmdbMovieResult>> SearchMoviesAsync(string query)
        {
            var request = new RestRequest("search/movie");
            request.AddQueryParameter("api_key", _apiKey);
            request.AddQueryParameter("query", query);

            var response = await _client.GetAsync<TmdbSearchResponse>(request);
            return response?.Results ?? new List<TmdbMovieResult>();
        }

        public async Task<List<TmdbMovieResult>> GetNowPlayingAsync()
        {
            var request = new RestRequest("movie/now_playing");
            request.AddQueryParameter("api_key", _apiKey);
            
            var response = await _client.GetAsync<TmdbSearchResponse>(request);
            return response?.Results ?? new List<TmdbMovieResult>();
        }

        
    }
}