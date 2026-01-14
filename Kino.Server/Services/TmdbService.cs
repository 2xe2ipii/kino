using RestSharp;
using Kino.Server.DTOs;
using Microsoft.Extensions.Configuration;
using System.Collections.Generic;
using System.Threading.Tasks;
using System;
using System.Linq;

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

        public async Task<List<TmdbMovieResult>> GetTopRatedAsync()
        {
            var request = new RestRequest("movie/top_rated");
            request.AddQueryParameter("api_key", _apiKey);

            var response = await _client.GetAsync<TmdbSearchResponse>(request);
            return response?.Results ?? new List<TmdbMovieResult>();
        }

        public async Task<List<TmdbMovieResult>> GetUpcomingAsync()
        {
            var request = new RestRequest("movie/upcoming");
            request.AddQueryParameter("api_key", _apiKey);
            request.AddQueryParameter("region", "US"); // Helps filter international re-releases

            var response = await _client.GetAsync<TmdbSearchResponse>(request);
            var results = response?.Results ?? new List<TmdbMovieResult>();

            // FIX: Filter out movies released in the past
            // Uses 'Release_Date' matching your DTO
            var today = DateTime.Today;

            return results
                .Where(m => !string.IsNullOrEmpty(m.Release_Date) && 
                            DateTime.TryParse(m.Release_Date, out var date) && 
                            date >= today)
                .OrderBy(m => m.Release_Date)
                .ToList();
        }
    }
}