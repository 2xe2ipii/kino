using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Kino.Server.Data;

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

        [HttpGet("search")]
        public async Task<IActionResult> Search(string query)
        {
            if (string.IsNullOrWhiteSpace(query)) return Ok(new List<object>());

            var users = await _context.UserProfiles
                .Where(u => u.DisplayName.ToLower().Contains(query.ToLower()))
                .Select(u => new { u.DisplayName, u.AvatarUrl, u.UserId })
                .Take(10)
                .ToListAsync();

            return Ok(users);
        }
    }
}