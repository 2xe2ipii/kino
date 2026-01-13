using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Kino.Server.Data;
using Kino.Server.Models;
using Kino.Server.DTOs;
using System.Security.Claims;

namespace Kino.Server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
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
            // 1. Check if the movie already exists in our local DB by TmdbId
            var movie = await _context.Movies
                .FirstOrDefaultAsync(m => m.TmdbId == dto.MovieId);

            // 2. If it doesn't exist, create it
            if (movie == null)
            {
                movie = new Movie
                {
                    TmdbId = dto.MovieId,
                    Title = dto.MovieTitle,
                    PosterPath = dto.PosterPath,
                    // We default Year to 0 or current year since the frontend 
                    // didn't send the release date in this specific payload.
                    Year = DateTime.UtcNow.Year 
                };

                _context.Movies.Add(movie);
                await _context.SaveChangesAsync();
            }

            // 3. Create the review linked to the internal MovieId
            var review = new Review
            {
                MovieId = movie.Id, // Link to the internal Primary Key
                Rating = dto.Rating,
                Content = dto.Content,
                CreatedAt = dto.DateWatched.ToUniversalTime() // Use the user's selected date
            };

            _context.Reviews.Add(review);
            await _context.SaveChangesAsync();

            return Ok(review);
        }
        
        // Optional: Get all reviews to see your diary
        [HttpGet]
        public async Task<ActionResult<IEnumerable<object>>> GetReviews()
        {
            var reviews = await _context.Reviews
                .Include(r => r.Movie)
                .OrderByDescending(r => r.CreatedAt)
                .Select(r => new 
                {
                    r.Id,
                    r.Rating,
                    r.Content,
                    r.CreatedAt,
                    // Use '!' to suppress the nullable warning
                    Movie = new {
                        Title = r.Movie!.Title,
                        PosterPath = r.Movie.PosterPath,
                        Year = r.Movie.Year
                    }
                })
                .ToListAsync();

            return Ok(reviews);
        }
    }
}