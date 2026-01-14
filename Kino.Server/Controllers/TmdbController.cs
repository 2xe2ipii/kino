using Microsoft.AspNetCore.Mvc;
using Kino.Server.Services;

namespace Kino.Server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class TmdbController : ControllerBase
    {
        private readonly ITmdbService _tmdbService;

        public TmdbController(ITmdbService tmdbService)
        {
            _tmdbService = tmdbService;
        }

        [HttpGet("search")]
        public async Task<IActionResult> Search([FromQuery] string query)
        {
            if (string.IsNullOrWhiteSpace(query)) return BadRequest();
            var results = await _tmdbService.SearchMoviesAsync(query);
            return Ok(results); 
        }

        [HttpGet("now-playing")]
        public async Task<IActionResult> GetNowPlaying()
        {
            var results = await _tmdbService.GetNowPlayingAsync();
            return Ok(results);
        }

        // --- NEW ENDPOINTS ---

        [HttpGet("top-rated")]
        public async Task<IActionResult> GetTopRated()
        {
            var results = await _tmdbService.GetTopRatedAsync();
            return Ok(results);
        }

        [HttpGet("upcoming")]
        public async Task<IActionResult> GetUpcoming()
        {
            var results = await _tmdbService.GetUpcomingAsync();
            return Ok(results);
        }
    }
}