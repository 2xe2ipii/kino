using Google.Apis.Auth;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using System.Text.RegularExpressions;
using Kino.Server.Data;
using Kino.Server.Models;
using Kino.Server.Services;

namespace Kino.Server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly ITokenService _tokenService;
        private readonly IConfiguration _config;

        public AuthController(AppDbContext context, ITokenService tokenService, IConfiguration config)
        {
            _context = context;
            _tokenService = tokenService;
            _config = config;
        }

        [HttpPost("google")]
        [EnableRateLimiting("auth")]
        public async Task<IActionResult> GoogleSignIn([FromBody] GoogleSignInDto dto)
        {
            GoogleJsonWebSignature.Payload payload;
            try
            {
                var settings = new GoogleJsonWebSignature.ValidationSettings
                {
                    Audience = new[] { _config["Google:ClientId"] }
                };
                payload = await GoogleJsonWebSignature.ValidateAsync(dto.IdToken, settings);
            }
            catch
            {
                return Unauthorized("Invalid Google token.");
            }

            var user = await _context.Users.FirstOrDefaultAsync(u => u.GoogleId == payload.Subject);
            if (user != null)
                return Ok(new { token = _tokenService.CreateToken(user) });

            return Ok(new
            {
                isNewUser = true,
                googleId = payload.Subject,
                email = payload.Email,
                displayName = payload.Name
            });
        }

        [HttpPost("complete-profile")]
        [EnableRateLimiting("auth")]
        public async Task<IActionResult> CompleteProfile([FromBody] CompleteProfileDto dto)
        {
            if (!Regex.IsMatch(dto.Username, @"^[a-zA-Z0-9_-]{3,20}$"))
                return BadRequest("Username must be 3–20 characters: letters, numbers, underscores, hyphens only.");

            if (await _context.Users.AnyAsync(u => u.Username == dto.Username))
                return BadRequest("Username is already taken.");

            var user = new User
            {
                GoogleId = dto.GoogleId,
                Email = dto.Email,
                Username = dto.Username,
                DisplayName = dto.DisplayName,
                AvatarUrl = "https://placehold.co/400",
                Bio = "No bio yet.",
                DateJoined = DateTime.UtcNow
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            return Ok(new { token = _tokenService.CreateToken(user) });
        }

        [HttpGet("check-username")]
        [EnableRateLimiting("auth")]
        public async Task<IActionResult> CheckUsername([FromQuery] string username)
        {
            var taken = await _context.Users.AnyAsync(u => u.Username == username);
            return Ok(new { available = !taken });
        }

        [Authorize]
        [HttpGet("profile")]
        public async Task<IActionResult> GetProfile()
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var user = await _context.Users
                .Include(u => u.TopMovies)
                .FirstOrDefaultAsync(u => u.Id == userId);

            if (user == null) return NotFound();

            return Ok(new
            {
                displayName = user.DisplayName,
                avatarUrl = user.AvatarUrl,
                bio = user.Bio,
                topMovies = user.TopMovies
                    .OrderBy(m => m.Rank)
                    .Select(m => new { m.Rank, m.TmdbId, m.Title, m.PosterPath })
            });
        }

        [Authorize]
        [HttpPut("profile")]
        public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileDto dto)
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);
            if (user == null) return NotFound();

            if (!string.IsNullOrWhiteSpace(dto.DisplayName)) user.DisplayName = dto.DisplayName;
            if (!string.IsNullOrWhiteSpace(dto.Bio)) user.Bio = dto.Bio;
            if (!string.IsNullOrWhiteSpace(dto.AvatarUrl)) user.AvatarUrl = dto.AvatarUrl;

            await _context.SaveChangesAsync();
            return Ok(new { user.DisplayName, user.AvatarUrl, user.Bio });
        }

        [Authorize]
        [HttpPut("top-movies")]
        public async Task<IActionResult> UpdateTopMovies([FromBody] UpdateTopMoviesDto dto)
        {
            if (dto.Movies.Count > 10)
                return BadRequest("Maximum 10 top movies allowed.");

            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

            var existing = _context.UserTopMovies.Where(m => m.UserId == userId);
            _context.UserTopMovies.RemoveRange(existing);

            foreach (var m in dto.Movies)
            {
                _context.UserTopMovies.Add(new UserTopMovie
                {
                    UserId = userId,
                    Rank = m.Rank,
                    TmdbId = m.TmdbId,
                    Title = m.Title,
                    PosterPath = m.PosterPath
                });
            }

            await _context.SaveChangesAsync();
            return Ok();
        }

        [Authorize]
        [HttpPost("upload-avatar")]
        public async Task<IActionResult> UploadAvatar([FromForm] IFormFile file)
        {
            if (file == null || file.Length == 0) return BadRequest("No file uploaded.");

            var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".webp", ".gif" };
            var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
            if (!allowedExtensions.Contains(ext))
                return BadRequest("Only jpg, png, webp, and gif files are allowed.");

            if (file.Length > 5 * 1024 * 1024)
                return BadRequest("File size must be under 5MB.");

            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

            var uploadsFolder = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads");
            if (!Directory.Exists(uploadsFolder)) Directory.CreateDirectory(uploadsFolder);

            var filename = $"{userId}_{DateTime.UtcNow.Ticks}{ext}";
            var filePath = Path.Combine(uploadsFolder, filename);

            using (var stream = new FileStream(filePath, FileMode.Create))
                await file.CopyToAsync(stream);

            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);
            if (user == null) return NotFound();

            user.AvatarUrl = $"/uploads/{filename}";
            await _context.SaveChangesAsync();

            return Ok(new { url = user.AvatarUrl });
        }
    }

    public class GoogleSignInDto { public string IdToken { get; set; } = string.Empty; }

    public class CompleteProfileDto
    {
        public string GoogleId { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string DisplayName { get; set; } = string.Empty;
        public string Username { get; set; } = string.Empty;
    }

    public class UpdateProfileDto
    {
        public string DisplayName { get; set; } = string.Empty;
        public string AvatarUrl { get; set; } = string.Empty;
        public string Bio { get; set; } = string.Empty;
    }

    public class TopMovieDto
    {
        public int Rank { get; set; }
        public int TmdbId { get; set; }
        public string Title { get; set; } = string.Empty;
        public string? PosterPath { get; set; }
    }

    public class UpdateTopMoviesDto { public List<TopMovieDto> Movies { get; set; } = new(); }
}
