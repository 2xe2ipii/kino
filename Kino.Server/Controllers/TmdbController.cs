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
            
            // FIX: Return 'results' directly (Array) instead of 'new { results }' (Object)
            return Ok(results); 
        }

        [HttpGet("now-playing")]
        public async Task<IActionResult> GetNowPlaying()
        {
            var results = await _tmdbService.GetNowPlayingAsync();
            return Ok(results);
        }
    }
}