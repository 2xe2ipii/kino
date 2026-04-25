using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Kino.Server.Data;
using Kino.Server.Models;
using Kino.Server.DTOs;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;

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

        // 1. GET FEED (Global)
        [HttpGet("feed")]
        public async Task<ActionResult<IEnumerable<object>>> GetFeed()
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            int? currentUserId = userIdStr != null ? int.Parse(userIdStr) : null;

            var reviews = await _context.Reviews
                .Include(r => r.Movie)
                .Include(r => r.Likes)
                .OrderByDescending(r => r.CreatedAt)
                .Take(20)
                .Select(r => new
                {
                    r.Id,
                    r.RatingTechnical,
                    r.RatingEnjoyment,
                    r.VibeTags,
                    r.Content,
                    r.CreatedAt,
                    r.UserId,
                    Movie = new { r.Movie!.Title, r.Movie.PosterPath, r.Movie.Year },
                    Likes = r.Likes.Count,
                    IsLikedByMe = currentUserId != null && r.Likes.Any(l => l.UserId == currentUserId),
                    Author = _context.Users
                        .Where(u => u.Id == r.UserId)
                        .Select(u => new { u.DisplayName, u.AvatarUrl })
                        .FirstOrDefault()
                })
                .ToListAsync();

            return Ok(reviews);
        }

        // 2. POST REVIEW (Log Entry)
        [HttpPost]
        [Authorize]
        public async Task<IActionResult> PostReview(CreateReviewDto dto)
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdStr)) return Unauthorized();
            var userId = int.Parse(userIdStr);

            // Check if movie exists, if not, create snapshot
            var movie = await _context.Movies.FirstOrDefaultAsync(m => m.TmdbId == dto.MovieId);
            if (movie == null)
            {
                movie = new Movie
                {
                    TmdbId = dto.MovieId,
                    Title = dto.MovieTitle,
                    PosterPath = dto.PosterPath,
                    Year = dto.DateWatched.Year
                };
                _context.Movies.Add(movie);
                await _context.SaveChangesAsync();
            }

            var review = new Review
            {
                MovieId = movie.Id,
                RatingTechnical = dto.RatingTechnical,
                RatingEnjoyment = dto.RatingEnjoyment,
                VibeTags = dto.VibeTags,
                Content = dto.Content,
                CreatedAt = dto.DateWatched.ToUniversalTime(),
                UserId = userId
            };

            _context.Reviews.Add(review);
            await _context.SaveChangesAsync();

            return Ok(review);
        }

        // 3. GET MY REVIEWS (Profile)
        [HttpGet]
        [Authorize]
        public async Task<ActionResult<IEnumerable<object>>> GetReviews()
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var userId = int.Parse(userIdStr!);

            var reviews = await _context.Reviews
                .Include(r => r.Movie)
                .Where(r => r.UserId == userId)
                .OrderByDescending(r => r.CreatedAt)
                .Select(r => new
                {
                    r.Id,
                    r.RatingTechnical,
                    r.RatingEnjoyment,
                    r.VibeTags,
                    r.Content,
                    r.CreatedAt,
                    Movie = new
                    {
                        Title = r.Movie!.Title,
                        PosterPath = r.Movie.PosterPath,
                        Year = r.Movie.Year,
                        TmdbId = r.Movie.TmdbId
                    }
                })
                .ToListAsync();

            return Ok(reviews);
        }

        [HttpPost("{id}/like")]
        [Authorize]
        public async Task<IActionResult> LikeReview(int id)
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userIdStr == null) return Unauthorized();
            var userId = int.Parse(userIdStr);

            var existingLike = await _context.ReviewLikes
               .FirstOrDefaultAsync(l => l.ReviewId == id && l.UserId == userId);

            if (existingLike != null) _context.ReviewLikes.Remove(existingLike);
            else _context.ReviewLikes.Add(new ReviewLike { ReviewId = id, UserId = userId });

            await _context.SaveChangesAsync();
            return Ok();
        }

        [HttpGet("user/{userId}")]
        public async Task<ActionResult<IEnumerable<object>>> GetUserReviews(int userId)
        {
            var reviews = await _context.Reviews
                .Include(r => r.Movie)
                .Where(r => r.UserId == userId)
                .OrderByDescending(r => r.CreatedAt)
                .Select(r => new
                {
                    r.Id,
                    r.RatingTechnical,
                    r.RatingEnjoyment,
                    r.VibeTags,
                    r.Content,
                    r.CreatedAt,
                    Movie = new
                    {
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
