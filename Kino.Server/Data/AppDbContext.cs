using Microsoft.EntityFrameworkCore;
using Kino.Server.Models;

namespace Kino.Server.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }

        // this will tell EF Core to create a table named Movies based on the Movie class
        public DbSet<Movie> Movies { get; set; }
        public DbSet<Review> Reviews { get; set; }
    }
}