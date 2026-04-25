using Microsoft.EntityFrameworkCore;
using Kino.Server.Models;

namespace Kino.Server.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) {}

        public DbSet<User> Users { get; set; }
        public DbSet<UserTopMovie> UserTopMovies { get; set; }
        public DbSet<Movie> Movies { get; set; }
        public DbSet<Review> Reviews { get; set; }
        public DbSet<ReviewLike> ReviewLikes { get; set; }

        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);

            builder.Entity<User>().HasIndex(u => u.GoogleId).IsUnique();
            builder.Entity<User>().HasIndex(u => u.Username).IsUnique();
            builder.Entity<User>().HasIndex(u => u.Email).IsUnique();

            builder.Entity<UserTopMovie>()
                .HasIndex(utm => new { utm.UserId, utm.Rank })
                .IsUnique();

            builder.Entity<Review>().HasIndex(r => r.UserId);
            builder.Entity<Review>().HasIndex(r => new { r.UserId, r.CreatedAt });

            builder.Entity<ReviewLike>().HasIndex(rl => rl.ReviewId);
            builder.Entity<ReviewLike>()
                .HasIndex(rl => new { rl.ReviewId, rl.UserId })
                .IsUnique();
        }
    }
}
