// this is for searching TMDB

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
        public async Task<IActionResult> Search(string query)
        {
            if (string.IsNullOrWhiteSpace(query)) return BadRequest("Query cannot be empty.");
            
            var results = await _tmdbService.SearchMoviesAsync(query);
            return Ok(results);
        }
    }
}