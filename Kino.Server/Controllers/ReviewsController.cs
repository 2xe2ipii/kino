using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Kino.Server.Data;
using Kino.Server.Models;
using Kino.Server.DTOs;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization; // Required for [Authorize]

namespace Kino.Server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize] // <--- Forces user to be logged in
    public class ReviewsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ReviewsController(AppDbContext context)
        {
            _context = context;
        }

        [HttpPost]
        public async Task<IActionResult> PostReview(CreateReviewDto dto)
        {
            // Get the User ID from the valid Token
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            var movie = await _context.Movies.FirstOrDefaultAsync(m => m.TmdbId == dto.MovieId);

            if (movie == null)
            {
                movie = new Movie
                {
                    TmdbId = dto.MovieId,
                    Title = dto.MovieTitle,
                    PosterPath = dto.PosterPath,
                    Year = DateTime.UtcNow.Year
                };
                _context.Movies.Add(movie);
                await _context.SaveChangesAsync();
            }

            var review = new Review
            {
                MovieId = movie.Id,
                Rating = dto.Rating,
                Content = dto.Content,
                CreatedAt = dto.DateWatched.ToUniversalTime(),
                UserId = userId // <--- Save the User ID
            };

            _context.Reviews.Add(review);
            await _context.SaveChangesAsync();

            return Ok(review);
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<object>>> GetReviews()
        {
            // Get the User ID from the token
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            var reviews = await _context.Reviews
                .Include(r => r.Movie)
                .Where(r => r.UserId == userId) // <--- Filter: Only MY reviews
                .OrderByDescending(r => r.CreatedAt)
                .Select(r => new 
                {
                    r.Id,
                    r.Rating,
                    r.Content,
                    r.CreatedAt,
                    Movie = new {
                        Title = r.Movie!.Title,
                        PosterPath = r.Movie.PosterPath,
                        Year = r.Movie.Year,
                        TmdbId = r.Movie.TmdbId
                    }
                })
                .ToListAsync();

            return Ok(reviews);
        }
    }
}