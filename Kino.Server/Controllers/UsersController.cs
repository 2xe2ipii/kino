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

            var users = await _context.UserProfiles
                .Where(u => u.DisplayName.ToLower().Contains(query.ToLower()))
                .Select(u => new { u.DisplayName, u.AvatarUrl, u.UserId })
                .Take(5)
                .ToListAsync();

            return Ok(users);
        }

        // 2. Get Public Profile (by ID)
        [HttpGet("{userId}")]
        public async Task<IActionResult> GetPublicProfile(string userId)
        {
            var profile = await _context.UserProfiles
                .FirstOrDefaultAsync(u => u.UserId == userId);

            if (profile == null) return NotFound("User not found");

            return Ok(new 
            {
                profile.DisplayName,
                profile.AvatarUrl,
                profile.Bio,
                profile.FavoriteMovie,
                profile.UserId
            });
        }
    }
}