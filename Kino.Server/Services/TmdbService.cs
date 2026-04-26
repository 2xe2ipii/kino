using RestSharp;
using Kino.Server.DTOs;
using Microsoft.Extensions.Caching.Memory;
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
        private readonly IMemoryCache _cache;

        // Refresh roughly 3× per day
        private static readonly TimeSpan CacheDuration = TimeSpan.FromHours(8);

        public TmdbService(IConfiguration config, IMemoryCache cache)
        {
            _apiKey = config["Tmdb:ApiKey"] ?? throw new ArgumentNullException("Tmdb:ApiKey is missing");
            _client = new RestClient("https://api.themoviedb.org/3/");
            _cache = cache;
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
            const string key = "tmdb:now-playing";
            if (_cache.TryGetValue(key, out List<TmdbMovieResult>? cached)) return cached!;

            var request = new RestRequest("movie/now_playing");
            request.AddQueryParameter("api_key", _apiKey);
            var response = await _client.GetAsync<TmdbSearchResponse>(request);
            var results = response?.Results ?? new List<TmdbMovieResult>();

            _cache.Set(key, results, CacheDuration);
            return results;
        }

        public async Task<List<TmdbMovieResult>> GetTopRatedAsync()
        {
            const string key = "tmdb:top-rated";
            if (_cache.TryGetValue(key, out List<TmdbMovieResult>? cached)) return cached!;

            var request = new RestRequest("movie/top_rated");
            request.AddQueryParameter("api_key", _apiKey);
            var response = await _client.GetAsync<TmdbSearchResponse>(request);
            var results = response?.Results ?? new List<TmdbMovieResult>();

            _cache.Set(key, results, CacheDuration);
            return results;
        }

        public async Task<List<TmdbMovieResult>> GetUpcomingAsync()
        {
            const string key = "tmdb:upcoming";
            if (_cache.TryGetValue(key, out List<TmdbMovieResult>? cached)) return cached!;

            var request = new RestRequest("movie/upcoming");
            request.AddQueryParameter("api_key", _apiKey);
            request.AddQueryParameter("region", "US");
            var response = await _client.GetAsync<TmdbSearchResponse>(request);
            var raw = response?.Results ?? new List<TmdbMovieResult>();

            var today = DateTime.Today;
            var results = raw
                .Where(m => !string.IsNullOrEmpty(m.Release_Date) &&
                            DateTime.TryParse(m.Release_Date, out var date) &&
                            date >= today)
                .OrderBy(m => m.Release_Date)
                .ToList();

            _cache.Set(key, results, CacheDuration);
            return results;
        }
    }
}