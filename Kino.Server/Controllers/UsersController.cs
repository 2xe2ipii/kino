using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Kino.Server.Data;
using Kino.Server.Models;

namespace Kino.Server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UsersController : ControllerBase
    {
        private readonly AppDbContext _context;

        public UsersController(AppDbContext context)
        {
            _context = context;
        }

        // 1. Search Members
        [HttpGet("search")]
        public async Task<IActionResult> Search(string query)
        {
            if (string.IsNullOrWhiteSpace(query)) return Ok(new List<object>());

            var users = await _context.Users
                .Where(u => u.DisplayName.ToLower().Contains(query.ToLower()) ||
                            u.Username.ToLower().Contains(query.ToLower()))
                .Select(u => new { u.DisplayName, u.AvatarUrl, u.Username, u.Id })
                .Take(5)
                .ToListAsync();

            return Ok(users);
        }

        // 2. Get Public Profile (by username)
        [HttpGet("{username}")]
        public async Task<IActionResult> GetPublicProfile(string username)
        {
            var user = await _context.Users
                .Include(u => u.TopMovies)
                .FirstOrDefaultAsync(u => u.Username == username);

            if (user == null) return NotFound("User not found");

            return Ok(new
            {
                user.DisplayName,
                user.AvatarUrl,
                user.Bio,
                user.Username,
                user.Id,
                topMovies = user.TopMovies
                    .OrderBy(m => m.Rank)
                    .Select(m => new { m.Rank, m.TmdbId, m.Title, m.PosterPath })
            });
        }
    }
}
