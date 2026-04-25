# Google-only Authentication Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace email/password + Identity auth with Google OAuth as the sole auth method, consolidating IdentityUser + UserProfile into a single User table, and adding a Top 10 movies list per user.

**Architecture:** Frontend gets a Google ID token via `@react-oauth/google`, posts it to `POST /api/auth/google`, backend validates with `Google.Apis.Auth` and returns a Kino JWT. New users complete a username-selection step before receiving their JWT. A single `User` table replaces ASP.NET Core Identity entirely.

**Tech Stack:** `Google.Apis.Auth` (NuGet), `@react-oauth/google` (npm), ASP.NET Core 10, EF Core 10, React 19 + Vite.

---

## File Map

**Create:**
- `Kino.Server/Models/User.cs`
- `Kino.Server/Models/UserTopMovie.cs`
- `kino-client/src/components/modals/UsernameModal.tsx`

**Rewrite completely:**
- `Kino.Server/Data/AppDbContext.cs`
- `Kino.Server/Services/ITokenService.cs`
- `Kino.Server/Services/TokenService.cs`
- `Kino.Server/Controllers/AuthController.cs`
- `Kino.Server/Controllers/UsersController.cs`
- `Kino.Server/Program.cs`
- `kino-client/src/context/AuthContext.tsx`
- `kino-client/src/components/modals/AuthModal.tsx`

**Modify:**
- `Kino.Server/Kino.Server.csproj`
- `Kino.Server/Models/Review.cs` (UserId type)
- `Kino.Server/Models/ReviewLike.cs` (UserId type)
- `Kino.Server/Controllers/ReviewsController.cs` (int userId + username lookup)
- `kino-client/src/main.tsx`
- `kino-client/src/App.tsx`
- `kino-client/src/components/layout/Navbar.tsx`
- `kino-client/src/pages/PublicProfile.tsx`
- `kino-client/src/pages/Profile.tsx`
- `kino-client/.env`

**Delete:**
- `Kino.Server/Models/UserProfile.cs`
- `Kino.Server/Services/EmailService.cs`
- `Kino.Server/Services/IEmailService.cs`
- `Kino.Server/DTOs/LoginDto.cs`
- `Kino.Server/DTOs/RegisterDto.cs`
- `Kino.Server/DTOs/VerifyEmailDto.cs`
- `Kino.Server/DTOs/ResendDto.cs`
- All files in `Kino.Server/Migrations/`

---

## Task 1: Google Cloud Console Setup (Manual)

This produces the `GOOGLE_CLIENT_ID` needed for all subsequent tasks.

- [ ] **Step 1: Create OAuth Client**

  Go to https://console.cloud.google.com → APIs & Services → Credentials → Create Credentials → OAuth 2.0 Client ID.
  - Application type: **Web application**
  - Name: `Kino`
  - Authorized JavaScript origins:
    - `http://localhost:5173`
    - `http://localhost:5002`
    - `https://<your-vercel-url>` (e.g. `https://kino-ochre.vercel.app`)
  - Leave redirect URIs empty (not needed for ID token flow)
  - Click Create. Copy the **Client ID** (looks like `123456789-abc.apps.googleusercontent.com`).

- [ ] **Step 2: Add to env files**

  `Kino.Server/.env` — append:
  ```
  GOOGLE_CLIENT_ID=<your-client-id>
  ```

  `kino-client/.env` — append:
  ```
  VITE_GOOGLE_CLIENT_ID=<your-client-id>
  ```

- [ ] **Step 3: Commit env template update**

  ```bash
  git add -p   # stage only the .env template/documentation changes, not actual secrets
  git commit -m "chore: add GOOGLE_CLIENT_ID to env variable documentation"
  ```

---

## Task 2: Update NuGet Packages

**Files:**
- Modify: `Kino.Server/Kino.Server.csproj`

- [ ] **Step 1: Remove Identity and MailKit; add Google.Apis.Auth**

  Run from the repo root:
  ```bash
  cd Kino.Server
  dotnet remove package Microsoft.AspNetCore.Identity.EntityFrameworkCore
  dotnet remove package MailKit
  dotnet add package Google.Apis.Auth
  ```

- [ ] **Step 2: Verify csproj looks correct**

  `Kino.Server/Kino.Server.csproj` should now read:
  ```xml
  <Project Sdk="Microsoft.NET.Sdk.Web">
    <PropertyGroup>
      <TargetFramework>net10.0</TargetFramework>
      <Nullable>enable</Nullable>
      <ImplicitUsings>enable</ImplicitUsings>
    </PropertyGroup>
    <ItemGroup>
      <PackageReference Include="DotNetEnv" Version="3.1.1" />
      <PackageReference Include="Google.Apis.Auth" Version="1.68.0" />
      <PackageReference Include="Microsoft.AspNetCore.Authentication.JwtBearer" Version="10.0.1" />
      <PackageReference Include="Microsoft.AspNetCore.OpenApi" Version="10.0.1" />
      <PackageReference Include="Microsoft.EntityFrameworkCore" Version="10.0.1" />
      <PackageReference Include="Microsoft.EntityFrameworkCore.Design" Version="10.0.1">
        <IncludeAssets>runtime; build; native; contentfiles; analyzers; buildtransitive</IncludeAssets>
        <PrivateAssets>all</PrivateAssets>
      </PackageReference>
      <PackageReference Include="Npgsql.EntityFrameworkCore.PostgreSQL" Version="10.0.0" />
      <PackageReference Include="RestSharp" Version="113.1.0" />
      <PackageReference Include="Swashbuckle.AspNetCore" Version="10.1.0" />
    </ItemGroup>
  </Project>
  ```
  (Google.Apis.Auth version may differ — use whatever `dotnet add` installed.)

- [ ] **Step 3: Verify restore**
  ```bash
  dotnet restore
  ```
  Expected: no errors.

- [ ] **Step 4: Commit**
  ```bash
  git add Kino.Server/Kino.Server.csproj
  git commit -m "chore: swap Identity+MailKit for Google.Apis.Auth"
  ```

---

## Task 3: Create New Models

**Files:**
- Create: `Kino.Server/Models/User.cs`
- Create: `Kino.Server/Models/UserTopMovie.cs`
- Modify: `Kino.Server/Models/Review.cs`
- Modify: `Kino.Server/Models/ReviewLike.cs`

- [ ] **Step 1: Create `User.cs`**

  ```csharp
  namespace Kino.Server.Models
  {
      public class User
      {
          public int Id { get; set; }
          public string GoogleId { get; set; } = string.Empty;
          public string Email { get; set; } = string.Empty;
          public string Username { get; set; } = string.Empty;
          public string DisplayName { get; set; } = string.Empty;
          public string AvatarUrl { get; set; } = string.Empty;
          public string Bio { get; set; } = string.Empty;
          public DateTime DateJoined { get; set; }
          public ICollection<UserTopMovie> TopMovies { get; set; } = new List<UserTopMovie>();
      }
  }
  ```

- [ ] **Step 2: Create `UserTopMovie.cs`**

  ```csharp
  namespace Kino.Server.Models
  {
      public class UserTopMovie
      {
          public int Id { get; set; }
          public int UserId { get; set; }
          public int Rank { get; set; }
          public int TmdbId { get; set; }
          public string Title { get; set; } = string.Empty;
          public string? PosterPath { get; set; }
          public User User { get; set; } = null!;
      }
  }
  ```

- [ ] **Step 3: Update `Review.cs` — change UserId from `string?` to `int`**

  Replace the UserId line:
  ```csharp
  // Before:
  public string? UserId { get; set; }
  // After:
  public int UserId { get; set; }
  ```

- [ ] **Step 4: Update `ReviewLike.cs` — change UserId from `string` to `int`**

  Full file after change:
  ```csharp
  namespace Kino.Server.Models
  {
      public class ReviewLike
      {
          public int Id { get; set; }
          public int ReviewId { get; set; }
          public int UserId { get; set; }
      }
  }
  ```

- [ ] **Step 5: Commit**
  ```bash
  git add Kino.Server/Models/
  git commit -m "feat: add User and UserTopMovie models, update FK types to int"
  ```

---

## Task 4: Rewrite AppDbContext

**Files:**
- Modify: `Kino.Server/Data/AppDbContext.cs`
- Delete: `Kino.Server/Models/UserProfile.cs`

- [ ] **Step 1: Rewrite `AppDbContext.cs`**

  ```csharp
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
  ```

- [ ] **Step 2: Delete `UserProfile.cs`**
  ```bash
  rm Kino.Server/Models/UserProfile.cs
  ```

- [ ] **Step 3: Commit**
  ```bash
  git add Kino.Server/Data/AppDbContext.cs Kino.Server/Models/UserProfile.cs
  git commit -m "feat: replace IdentityDbContext with plain DbContext, remove UserProfile"
  ```

---

## Task 5: Delete Old Migrations and Create Fresh One

All previous migrations are incompatible with the new schema. Drop the database and start fresh.

- [ ] **Step 1: Delete all migration files**
  ```bash
  rm Kino.Server/Migrations/*.cs
  ```

- [ ] **Step 2: Drop the database**
  ```bash
  cd Kino.Server
  dotnet ef database drop --force
  ```
  Expected output: `Dropping database ... Done.`

- [ ] **Step 3: Create the initial migration**
  ```bash
  dotnet ef migrations add InitialCreate
  ```
  Expected: new files appear in `Kino.Server/Migrations/`.

  If you see a build error about missing Identity/MailKit usages at this step, that means `Program.cs` or controller files still reference removed packages. Jump to Task 7 (update Program.cs) first, then return here.

- [ ] **Step 4: Apply migration**
  ```bash
  dotnet ef database update
  ```
  Expected: `Done.`

- [ ] **Step 5: Commit**
  ```bash
  git add Kino.Server/Migrations/
  git commit -m "feat: fresh migration — User, UserTopMovie, Review, ReviewLike with int FKs"
  ```

---

## Task 6: Update TokenService

**Files:**
- Modify: `Kino.Server/Services/ITokenService.cs`
- Modify: `Kino.Server/Services/TokenService.cs`

- [ ] **Step 1: Update `ITokenService.cs`**

  ```csharp
  using Kino.Server.Models;

  namespace Kino.Server.Services
  {
      public interface ITokenService
      {
          string CreateToken(User user);
      }
  }
  ```

- [ ] **Step 2: Update `TokenService.cs`**

  ```csharp
  using System.IdentityModel.Tokens.Jwt;
  using System.Security.Claims;
  using System.Text;
  using Kino.Server.Models;
  using Microsoft.IdentityModel.Tokens;

  namespace Kino.Server.Services
  {
      public class TokenService : ITokenService
      {
          private readonly IConfiguration _config;
          private readonly SymmetricSecurityKey _key;

          public TokenService(IConfiguration config)
          {
              _config = config;
              var secretKey = config["Jwt:Key"] ?? throw new ArgumentNullException("Jwt:Key is missing");
              _key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
          }

          public string CreateToken(User user)
          {
              var claims = new List<Claim>
              {
                  new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
                  new Claim(JwtRegisteredClaimNames.UniqueName, user.Username),
                  new Claim(JwtRegisteredClaimNames.Email, user.Email),
                  new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
              };

              var creds = new SigningCredentials(_key, SecurityAlgorithms.HmacSha512Signature);

              var tokenDescriptor = new SecurityTokenDescriptor
              {
                  Subject = new ClaimsIdentity(claims),
                  Expires = DateTime.UtcNow.AddDays(7),
                  SigningCredentials = creds,
                  Issuer = _config["Jwt:Issuer"],
                  Audience = _config["Jwt:Audience"]
              };

              var tokenHandler = new JwtSecurityTokenHandler();
              return tokenHandler.WriteToken(tokenHandler.CreateToken(tokenDescriptor));
          }
      }
  }
  ```

- [ ] **Step 3: Commit**
  ```bash
  git add Kino.Server/Services/ITokenService.cs Kino.Server/Services/TokenService.cs
  git commit -m "feat: update TokenService to accept User instead of IdentityUser"
  ```

---

## Task 7: Rewrite AuthController

**Files:**
- Modify: `Kino.Server/Controllers/AuthController.cs`
- Delete: `Kino.Server/DTOs/LoginDto.cs`, `RegisterDto.cs`, `VerifyEmailDto.cs`, `ResendDto.cs`
- Delete: `Kino.Server/Services/EmailService.cs`, `IEmailService.cs`

- [ ] **Step 1: Delete dead files**
  ```bash
  rm Kino.Server/DTOs/LoginDto.cs Kino.Server/DTOs/RegisterDto.cs
  rm Kino.Server/DTOs/VerifyEmailDto.cs Kino.Server/DTOs/ResendDto.cs
  rm Kino.Server/Services/EmailService.cs Kino.Server/Services/IEmailService.cs
  ```

- [ ] **Step 2: Rewrite `AuthController.cs`**

  ```csharp
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
  ```

- [ ] **Step 3: Build to check for compile errors**
  ```bash
  dotnet build
  ```
  Expected: 0 errors. If you see errors about `IdentityUser` or `EmailService`, those references are elsewhere — check Program.cs (Task 8).

- [ ] **Step 4: Commit**
  ```bash
  git add Kino.Server/Controllers/AuthController.cs Kino.Server/DTOs/ Kino.Server/Services/
  git commit -m "feat: replace email/password auth endpoints with Google OAuth endpoints"
  ```

---

## Task 8: Update Program.cs

**Files:**
- Modify: `Kino.Server/Program.cs`

- [ ] **Step 1: Rewrite `Program.cs`**

  ```csharp
  using System.Text;
  using System.Threading.RateLimiting;
  using Kino.Server.Data;
  using Kino.Server.Services;
  using Microsoft.AspNetCore.Authentication.JwtBearer;
  using Microsoft.AspNetCore.RateLimiting;
  using Microsoft.EntityFrameworkCore;
  using Microsoft.IdentityModel.Tokens;
  using DotNetEnv;

  Env.Load();

  var builder = WebApplication.CreateBuilder(args);

  // Map environment variables to config
  var dbUrl = Environment.GetEnvironmentVariable("DATABASE_URL");
  if (!string.IsNullOrEmpty(dbUrl))
      builder.Configuration["ConnectionStrings:DefaultConnection"] = dbUrl;

  var tmdbKey = Environment.GetEnvironmentVariable("TMDB_API_KEY");
  if (!string.IsNullOrEmpty(tmdbKey))
      builder.Configuration["Tmdb:ApiKey"] = tmdbKey;

  var jwtKey = Environment.GetEnvironmentVariable("JWT_KEY");
  if (!string.IsNullOrEmpty(jwtKey))
  {
      builder.Configuration["Jwt:Key"] = jwtKey;
      builder.Configuration["Jwt:Issuer"] = Environment.GetEnvironmentVariable("JWT_ISSUER");
      builder.Configuration["Jwt:Audience"] = Environment.GetEnvironmentVariable("JWT_AUDIENCE");
  }

  var googleClientId = Environment.GetEnvironmentVariable("GOOGLE_CLIENT_ID");
  if (!string.IsNullOrEmpty(googleClientId))
      builder.Configuration["Google:ClientId"] = googleClientId;

  builder.Services.AddControllers();
  builder.Services.AddEndpointsApiExplorer();
  builder.Services.AddSwaggerGen();

  // CORS
  var jwtAudience = builder.Configuration["Jwt:Audience"]?.TrimEnd('/') ?? "";
  var allowedOrigins = new[] { "http://localhost:5173", "http://localhost:3000" }
      .Concat(string.IsNullOrEmpty(jwtAudience) ? [] : new[] { jwtAudience })
      .ToArray();

  builder.Services.AddCors(options =>
  {
      options.AddPolicy("AllowReactApp", policy =>
          policy.WithOrigins(allowedOrigins).AllowAnyHeader().AllowAnyMethod());
  });

  builder.Services.AddMemoryCache();

  builder.Services.AddRateLimiter(options =>
  {
      options.AddFixedWindowLimiter("auth", o =>
      {
          o.PermitLimit = 10;
          o.Window = TimeSpan.FromMinutes(1);
          o.QueueLimit = 0;
      });
      options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
  });

  builder.Services.AddDbContext<AppDbContext>(options =>
      options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

  builder.Services.AddAuthentication(options =>
  {
      options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
      options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
      options.DefaultScheme = JwtBearerDefaults.AuthenticationScheme;
  })
  .AddJwtBearer(options =>
  {
      options.TokenValidationParameters = new TokenValidationParameters
      {
          ValidateIssuer = true,
          ValidateAudience = true,
          ValidateLifetime = true,
          ValidateIssuerSigningKey = true,
          ValidIssuer = builder.Configuration["Jwt:Issuer"],
          ValidAudience = builder.Configuration["Jwt:Audience"],
          IssuerSigningKey = new SymmetricSecurityKey(
              Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]!))
      };
  });

  builder.Services.AddScoped<ITmdbService, TmdbService>();
  builder.Services.AddScoped<ITokenService, TokenService>();

  var app = builder.Build();

  if (app.Environment.IsDevelopment())
  {
      app.UseSwagger();
      app.UseSwaggerUI();
  }

  app.UseStaticFiles();
  app.UseCors("AllowReactApp");
  app.UseRateLimiter();
  app.UseAuthentication();
  app.UseAuthorization();

  app.MapControllers();
  app.MapFallbackToFile("index.html");
  app.Run();
  ```

- [ ] **Step 2: Build**
  ```bash
  dotnet build
  ```
  Expected: 0 errors.

- [ ] **Step 3: Commit**
  ```bash
  git add Kino.Server/Program.cs
  git commit -m "feat: remove Identity DI, add Google:ClientId config"
  ```

---

## Task 9: Update ReviewsController and UsersController

**Files:**
- Modify: `Kino.Server/Controllers/ReviewsController.cs`
- Modify: `Kino.Server/Controllers/UsersController.cs`

- [ ] **Step 1: Update `ReviewsController.cs`**

  Three changes: (1) parse userId as int, (2) fix author lookup in GetFeed to use `Users` table, (3) change `GetUserReviews` to accept username string and look up user first.

  ```csharp
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

          public ReviewsController(AppDbContext context) => _context = context;

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
                      IsLikedByMe = currentUserId.HasValue && r.Likes.Any(l => l.UserId == currentUserId.Value),
                      Author = _context.Users
                          .Where(u => u.Id == r.UserId)
                          .Select(u => new { u.DisplayName, u.AvatarUrl, u.Username })
                          .FirstOrDefault()
                  })
                  .ToListAsync();

              return Ok(reviews);
          }

          [HttpPost]
          [Authorize]
          public async Task<IActionResult> PostReview(CreateReviewDto dto)
          {
              var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

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

          [HttpGet]
          [Authorize]
          public async Task<ActionResult<IEnumerable<object>>> GetReviews()
          {
              var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

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
                      Movie = new { r.Movie!.Title, r.Movie.PosterPath, r.Movie.Year, r.Movie.TmdbId }
                  })
                  .ToListAsync();

              return Ok(reviews);
          }

          [HttpPost("{id}/like")]
          [Authorize]
          public async Task<IActionResult> LikeReview(int id)
          {
              var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

              var existingLike = await _context.ReviewLikes
                  .FirstOrDefaultAsync(l => l.ReviewId == id && l.UserId == userId);

              if (existingLike != null) _context.ReviewLikes.Remove(existingLike);
              else _context.ReviewLikes.Add(new ReviewLike { ReviewId = id, UserId = userId });

              await _context.SaveChangesAsync();
              return Ok();
          }

          [HttpGet("user/{username}")]
          public async Task<ActionResult<IEnumerable<object>>> GetUserReviews(string username)
          {
              var user = await _context.Users.FirstOrDefaultAsync(u => u.Username == username);
              if (user == null) return Ok(new List<object>());

              var reviews = await _context.Reviews
                  .Include(r => r.Movie)
                  .Where(r => r.UserId == user.Id)
                  .OrderByDescending(r => r.CreatedAt)
                  .Select(r => new
                  {
                      r.Id,
                      r.RatingTechnical,
                      r.RatingEnjoyment,
                      r.VibeTags,
                      r.Content,
                      r.CreatedAt,
                      Movie = new { r.Movie!.Title, r.Movie.PosterPath, r.Movie.Year }
                  })
                  .ToListAsync();

              return Ok(reviews);
          }
      }
  }
  ```

- [ ] **Step 2: Rewrite `UsersController.cs`**

  Search now uses `Users` table and returns `username` instead of `userId`. Public profile looks up by username and includes `topMovies`.

  ```csharp
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

          public UsersController(AppDbContext context) => _context = context;

          [HttpGet("search")]
          public async Task<IActionResult> Search(string query)
          {
              if (string.IsNullOrWhiteSpace(query)) return Ok(new List<object>());

              var users = await _context.Users
                  .Where(u => u.DisplayName.ToLower().Contains(query.ToLower())
                           || u.Username.ToLower().Contains(query.ToLower()))
                  .Select(u => new { u.DisplayName, u.AvatarUrl, u.Username })
                  .Take(5)
                  .ToListAsync();

              return Ok(users);
          }

          [HttpGet("{username}")]
          public async Task<IActionResult> GetPublicProfile(string username)
          {
              var user = await _context.Users
                  .Include(u => u.TopMovies)
                  .FirstOrDefaultAsync(u => u.Username == username);

              if (user == null) return NotFound("User not found");

              return Ok(new
              {
                  user.Id,
                  user.DisplayName,
                  user.AvatarUrl,
                  user.Bio,
                  user.Username,
                  user.DateJoined,
                  topMovies = user.TopMovies
                      .OrderBy(m => m.Rank)
                      .Select(m => new { m.Rank, m.TmdbId, m.Title, m.PosterPath })
              });
          }
      }
  }
  ```

- [ ] **Step 3: Build**
  ```bash
  dotnet build
  ```
  Expected: 0 errors.

- [ ] **Step 4: Run and do a quick manual check**
  ```bash
  dotnet watch run
  ```
  Open http://localhost:5002/swagger and verify the new endpoints appear: `POST /api/auth/google`, `POST /api/auth/complete-profile`, `GET /api/auth/check-username`.

- [ ] **Step 5: Commit**
  ```bash
  git add Kino.Server/Controllers/ReviewsController.cs Kino.Server/Controllers/UsersController.cs
  git commit -m "feat: update controllers to use int userId and username-based lookups"
  ```

---

## Task 10: Install Frontend Package and Update Env

**Files:**
- Modify: `kino-client/package.json`
- Modify: `kino-client/.env`

- [ ] **Step 1: Install `@react-oauth/google`**
  ```bash
  cd kino-client
  npm install @react-oauth/google
  ```

- [ ] **Step 2: Verify install**
  ```bash
  npm run build
  ```
  Expected: build succeeds (may have TypeScript errors from AuthContext changes not yet made — that's OK at this point).

- [ ] **Step 3: Commit**
  ```bash
  git add kino-client/package.json kino-client/package-lock.json
  git commit -m "chore: add @react-oauth/google"
  ```

---

## Task 11: Rewrite AuthContext

**Files:**
- Modify: `kino-client/src/context/AuthContext.tsx`

- [ ] **Step 1: Rewrite `AuthContext.tsx`**

  ```tsx
  import { createContext, useState, useEffect, type ReactNode } from 'react';
  import api from '../api/axios';

  interface User {
      id: string;
      username: string;
      email: string;
  }

  interface UserProfile {
      displayName: string;
      avatarUrl: string;
      bio: string;
      topMovies: { rank: number; tmdbId: number; title: string; posterPath: string | null }[];
  }

  interface PendingGoogle {
      googleId: string;
      email: string;
      displayName: string;
  }

  interface AuthContextType {
      user: User | null;
      userProfile: UserProfile | null;
      isAuthenticated: boolean;
      token: string | null;
      pendingGoogle: PendingGoogle | null;
      loginWithGoogle: (idToken: string) => Promise<void>;
      completeProfile: (username: string) => Promise<void>;
      logout: () => void;
      modalType: 'LOGIN' | 'REGISTER' | null;
      openModal: (type: 'LOGIN' | 'REGISTER') => void;
      closeModal: () => void;
      refreshProfile: () => void;
  }

  export const AuthContext = createContext<AuthContextType | undefined>(undefined);

  export const AuthProvider = ({ children }: { children: ReactNode }) => {
      const [user, setUser] = useState<User | null>(null);
      const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
      const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
      const [modalType, setModalType] = useState<'LOGIN' | 'REGISTER' | null>(null);
      const [pendingGoogle, setPendingGoogle] = useState<PendingGoogle | null>(null);

      useEffect(() => {
          if (token) {
              try {
                  const payload = JSON.parse(atob(token.split('.')[1]));
                  setUser({ id: payload.sub, username: payload.unique_name ?? '', email: payload.email ?? '' });
                  api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                  fetchProfile();
              } catch {
                  logout();
              }
          }
      }, [token]);

      const fetchProfile = async () => {
          try {
              const res = await api.get('/auth/profile');
              setUserProfile(res.data);
          } catch {
              console.error('Failed to fetch profile');
          }
      };

      const storeToken = (newToken: string) => {
          localStorage.setItem('token', newToken);
          api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
          const payload = JSON.parse(atob(newToken.split('.')[1]));
          setUser({ id: payload.sub, username: payload.unique_name ?? '', email: payload.email ?? '' });
          setToken(newToken);
          fetchProfile();
      };

      const loginWithGoogle = async (idToken: string) => {
          const res = await api.post('/auth/google', { idToken });
          if (res.data.isNewUser) {
              setPendingGoogle({
                  googleId: res.data.googleId,
                  email: res.data.email,
                  displayName: res.data.displayName,
              });
              closeModal();
          } else {
              storeToken(res.data.token);
              closeModal();
          }
      };

      const completeProfile = async (username: string) => {
          if (!pendingGoogle) throw new Error('No pending Google sign-in');
          const res = await api.post('/auth/complete-profile', {
              googleId: pendingGoogle.googleId,
              email: pendingGoogle.email,
              displayName: pendingGoogle.displayName,
              username,
          });
          setPendingGoogle(null);
          storeToken(res.data.token);
      };

      const logout = () => {
          localStorage.removeItem('token');
          setToken(null);
          setUser(null);
          setUserProfile(null);
          setPendingGoogle(null);
          delete api.defaults.headers.common['Authorization'];
      };

      const openModal = (type: 'LOGIN' | 'REGISTER') => setModalType(type);
      const closeModal = () => setModalType(null);

      return (
          <AuthContext.Provider value={{
              user,
              userProfile,
              isAuthenticated: !!user,
              token,
              pendingGoogle,
              loginWithGoogle,
              completeProfile,
              logout,
              modalType,
              openModal,
              closeModal,
              refreshProfile: fetchProfile,
          }}>
              {children}
          </AuthContext.Provider>
      );
  };
  ```

- [ ] **Step 2: Commit**
  ```bash
  git add kino-client/src/context/AuthContext.tsx
  git commit -m "feat: rewrite AuthContext for Google OAuth — loginWithGoogle, completeProfile"
  ```

---

## Task 12: Replace AuthModal and Create UsernameModal

**Files:**
- Modify: `kino-client/src/components/modals/AuthModal.tsx`
- Create: `kino-client/src/components/modals/UsernameModal.tsx`

- [ ] **Step 1: Replace `AuthModal.tsx`**

  ```tsx
  import { useContext } from 'react';
  import { GoogleLogin } from '@react-oauth/google';
  import { AuthContext } from '../../context/AuthContext';

  export const AuthModal = () => {
      const { modalType, closeModal, loginWithGoogle } = useContext(AuthContext)!;

      if (!modalType) return null;

      return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
              <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-12 flex flex-col items-center gap-8 relative">

                  <button
                      onClick={closeModal}
                      className="absolute top-8 right-8 text-slate-300 hover:text-slate-800 transition-colors p-2 hover:bg-slate-50 rounded-full"
                  >
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                  </button>

                  <div className="text-center">
                      <h2 className="text-4xl font-black text-rose-500 tracking-tighter mb-2">kino.</h2>
                      <p className="text-slate-500 font-medium text-lg">Your personal film diary.</p>
                  </div>

                  <GoogleLogin
                      onSuccess={({ credential }) => loginWithGoogle(credential!)}
                      onError={() => console.error('Google login failed')}
                      text="continue_with"
                      shape="rectangular"
                      size="large"
                  />
              </div>
          </div>
      );
  };
  ```

- [ ] **Step 2: Create `UsernameModal.tsx`**

  ```tsx
  import { useContext, useState, useEffect } from 'react';
  import { AuthContext } from '../../context/AuthContext';
  import api from '../../api/axios';

  export const UsernameModal = () => {
      const { pendingGoogle, completeProfile } = useContext(AuthContext)!;
      const [username, setUsername] = useState('');
      const [available, setAvailable] = useState<boolean | null>(null);
      const [checking, setChecking] = useState(false);
      const [loading, setLoading] = useState(false);
      const [error, setError] = useState('');

      const isValidFormat = /^[a-zA-Z0-9_-]{3,20}$/.test(username);

      useEffect(() => {
          if (!isValidFormat) { setAvailable(null); return; }
          const timeout = setTimeout(async () => {
              setChecking(true);
              try {
                  const res = await api.get(`/auth/check-username?username=${username}`);
                  setAvailable(res.data.available);
              } catch {
                  setAvailable(null);
              } finally {
                  setChecking(false);
              }
          }, 300);
          return () => clearTimeout(timeout);
      }, [username, isValidFormat]);

      const handleSubmit = async (e: React.FormEvent) => {
          e.preventDefault();
          if (!available || !isValidFormat || loading) return;
          setLoading(true);
          setError('');
          try {
              await completeProfile(username);
          } catch {
              setError('Something went wrong. Please try again.');
              setLoading(false);
          }
      };

      if (!pendingGoogle) return null;

      return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
              <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-12 flex flex-col items-center gap-6">

                  <div className="text-center">
                      <h2 className="text-4xl font-black text-slate-800 tracking-tighter mb-2">One last thing.</h2>
                      <p className="text-slate-500 font-medium">
                          Welcome, <strong>{pendingGoogle.displayName}</strong>.<br />
                          Pick your Kino username.
                      </p>
                  </div>

                  <form onSubmit={handleSubmit} className="w-full space-y-4">
                      <div className="relative">
                          <input
                              type="text"
                              placeholder="username"
                              value={username}
                              onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-zA-Z0-9_-]/g, ''))}
                              className="w-full bg-slate-50 border-2 border-transparent p-4 rounded-2xl font-bold text-slate-800 outline-none focus:bg-white focus:border-rose-100 focus:ring-4 focus:ring-rose-50 transition-all placeholder:text-slate-400"
                              autoFocus
                          />
                          {username.length >= 3 && (
                              <span className={`absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold transition-colors ${
                                  checking ? 'text-slate-400' : available ? 'text-green-500' : 'text-rose-500'
                              }`}>
                                  {checking ? '…' : available ? '✓ available' : '✗ taken'}
                              </span>
                          )}
                      </div>

                      <p className="text-xs text-slate-400 font-medium text-center">
                          3–20 characters · letters, numbers, _ and -
                      </p>

                      {error && (
                          <p className="text-rose-500 text-sm font-bold text-center">{error}</p>
                      )}

                      <button
                          type="submit"
                          disabled={!available || !isValidFormat || loading}
                          className="w-full bg-rose-500 hover:bg-rose-600 text-white py-5 rounded-2xl font-bold text-lg shadow-xl shadow-rose-200 transition-all transform active:scale-[0.98] disabled:opacity-50 disabled:scale-100"
                      >
                          {loading ? 'Creating account…' : 'Get Started'}
                      </button>
                  </form>
              </div>
          </div>
      );
  };
  ```

- [ ] **Step 3: Commit**
  ```bash
  git add kino-client/src/components/modals/
  git commit -m "feat: replace AuthModal with Google sign-in, add UsernameModal for onboarding"
  ```

---

## Task 13: Update main.tsx and App.tsx

**Files:**
- Modify: `kino-client/src/main.tsx`
- Modify: `kino-client/src/App.tsx`

- [ ] **Step 1: Update `main.tsx` — add `GoogleOAuthProvider`**

  ```tsx
  import React from 'react';
  import ReactDOM from 'react-dom/client';
  import App from './App.tsx';
  import './index.css';
  import { AuthProvider } from './context/AuthContext';
  import { GoogleOAuthProvider } from '@react-oauth/google';

  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
        <AuthProvider>
          <App />
        </AuthProvider>
      </GoogleOAuthProvider>
    </React.StrictMode>,
  );
  ```

- [ ] **Step 2: Update `App.tsx` — add `UsernameModal`, fix route `/member/:userId` → `/u/:username`**

  ```tsx
  import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
  import { AuthModal } from './components/modals/AuthModal';
  import { UsernameModal } from './components/modals/UsernameModal';
  import Home from './pages/Home';
  import Profile from './pages/Profile';
  import PublicProfile from './pages/PublicProfile';
  import Diary from './pages/Diary';

  function App() {
    return (
      <Router>
          <AuthModal />
          <UsernameModal />
          <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/u/:username" element={<PublicProfile />} />
              <Route path="/diary" element={<Diary />} />
              <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
      </Router>
    );
  }

  export default App;
  ```

- [ ] **Step 3: Commit**
  ```bash
  git add kino-client/src/main.tsx kino-client/src/App.tsx
  git commit -m "feat: add GoogleOAuthProvider, UsernameModal to app root; fix public profile route"
  ```

---

## Task 14: Update Navbar

**Files:**
- Modify: `kino-client/src/components/layout/Navbar.tsx`

Two changes: `handleResultClick` navigates to `/u/${username}` instead of `/member/${userId}`, and search results now use `u.username` as the key.

- [ ] **Step 1: Update `handleResultClick` and search result rendering**

  Replace the `handleResultClick` function:
  ```tsx
  const handleResultClick = (username: string) => {
      navigate(`/u/${username}`);
      setShowResults(false);
      setSearchQuery('');
  };
  ```

  Replace the search results map (the `{searchResults.map(...)}` block):
  ```tsx
  {searchResults.map(u => (
      <div key={u.username} onClick={() => handleResultClick(u.username)} className="flex items-center gap-3 px-4 py-3 hover:bg-rose-50 cursor-pointer transition-colors">
          <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden border border-slate-200">
              {u.avatarUrl && <img src={u.avatarUrl.startsWith('/') ? `${BASE_URL}${u.avatarUrl}` : u.avatarUrl} className="w-full h-full object-cover"/>}
          </div>
          <div>
              <div className="text-xs font-bold text-slate-700">{u.displayName}</div>
              <div className="text-[10px] text-slate-400">@{u.username}</div>
          </div>
      </div>
  ))}
  ```

- [ ] **Step 2: Commit**
  ```bash
  git add kino-client/src/components/layout/Navbar.tsx
  git commit -m "fix: navbar member search navigates by username"
  ```

---

## Task 15: Update PublicProfile

**Files:**
- Modify: `kino-client/src/pages/PublicProfile.tsx`

Route param changes from `userId` to `username`. API calls now use username. Response now includes `topMovies`.

- [ ] **Step 1: Rewrite `PublicProfile.tsx`**

  ```tsx
  import { useEffect, useState } from 'react';
  import { Navbar } from '../components/layout/Navbar';
  import { useParams } from 'react-router-dom';
  import api from '../api/axios';

  const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5002';

  export default function PublicProfile() {
      const { username } = useParams();
      const [profile, setProfile] = useState<any>(null);
      const [reviews, setReviews] = useState<any[]>([]);
      const [loading, setLoading] = useState(true);

      useEffect(() => {
          async function loadData() {
              try {
                  const [profileRes, reviewsRes] = await Promise.all([
                      api.get(`/users/${username}`),
                      api.get(`/reviews/user/${username}`),
                  ]);
                  setProfile(profileRes.data);
                  setReviews(reviewsRes.data);
              } catch {
                  console.error('Failed to load user');
              } finally {
                  setLoading(false);
              }
          }
          if (username) loadData();
      }, [username]);

      if (loading) return <div className="min-h-screen bg-pink-50 flex items-center justify-center font-bold text-rose-400 animate-pulse">Loading Member...</div>;
      if (!profile) return <div className="min-h-screen bg-pink-50 flex items-center justify-center font-bold text-slate-400">User Not Found</div>;

      const avatarSrc = profile.avatarUrl
          ? (profile.avatarUrl.startsWith('/') ? `${BASE_URL}${profile.avatarUrl}` : profile.avatarUrl)
          : null;

      return (
          <div className="min-h-screen bg-pink-50 pb-20 font-sans text-slate-800">
              <Navbar />

              <div className="bg-white border-b border-slate-100 pt-32 pb-10 px-6">
                  <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center md:items-end gap-8">
                      <div className="w-32 h-32 rounded-full bg-slate-200 p-1 ring-4 ring-white shadow-xl overflow-hidden">
                          {avatarSrc ? (
                              <img src={avatarSrc} className="w-full h-full object-cover rounded-full" />
                          ) : (
                              <div className="w-full h-full flex items-center justify-center bg-slate-300 text-4xl font-black text-white">
                                  {profile.displayName?.[0] || '?'}
                              </div>
                          )}
                      </div>
                      <div className="flex-1 text-center md:text-left">
                          <h1 className="text-3xl font-black text-slate-800 tracking-tight">{profile.displayName}</h1>
                          <p className="text-slate-400 text-sm font-bold uppercase tracking-wider mt-1">@{profile.username}</p>
                          <div className="flex justify-center md:justify-start gap-8 mt-6">
                              <div><div className="text-2xl font-black text-rose-500">{reviews.length}</div><div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Films</div></div>
                          </div>
                      </div>
                  </div>
              </div>

              <div className="max-w-4xl mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-3 gap-12">
                  <div className="space-y-6">
                      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">About</h3>
                          <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{profile.bio || 'No bio.'}</p>
                      </div>

                      {profile.topMovies?.length > 0 && (
                          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Top Films</h3>
                              <div className="space-y-2">
                                  {profile.topMovies.map((m: any) => (
                                      <div key={m.rank} className="flex items-center gap-3">
                                          <span className="text-xs font-black text-slate-300 w-4">{m.rank}</span>
                                          {m.posterPath && (
                                              <img src={`https://image.tmdb.org/t/p/w92${m.posterPath}`} className="w-8 h-12 object-cover rounded" alt={m.title} />
                                          )}
                                          <span className="text-sm font-bold text-slate-700 line-clamp-1">{m.title}</span>
                                      </div>
                                  ))}
                              </div>
                          </div>
                      )}
                  </div>

                  <div className="lg:col-span-2 space-y-6">
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Recent Activity</h3>
                      {reviews.length === 0 && <p className="text-slate-400 text-sm">No reviews yet.</p>}
                      <div className="space-y-4">
                          {reviews.map((review) => (
                              <div key={review.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex gap-4">
                                  <div className="w-16 h-24 shrink-0 bg-slate-200 rounded-lg overflow-hidden">
                                      <img src={`https://image.tmdb.org/t/p/w200${review.movie.posterPath}`} className="w-full h-full object-cover" />
                                  </div>
                                  <div>
                                      <div className="text-sm font-bold text-slate-800 mb-1">{review.movie.title} <span className="font-normal text-slate-400">({review.movie.year})</span></div>
                                      <div className="flex gap-2 mb-2">
                                          <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 rounded text-slate-600">Tech: {review.ratingTechnical}%</span>
                                          <span className="text-[10px] font-bold px-2 py-0.5 bg-rose-50 rounded text-rose-500">Fun: {review.ratingEnjoyment}%</span>
                                      </div>
                                      <p className="text-sm text-slate-600 line-clamp-2">{review.content}</p>
                                  </div>
                              </div>
                          ))}
                      </div>
                  </div>
              </div>
          </div>
      );
  }
  ```

- [ ] **Step 2: Commit**
  ```bash
  git add kino-client/src/pages/PublicProfile.tsx
  git commit -m "feat: public profile uses username param, shows top movies"
  ```

---

## Task 16: Update Profile Page

**Files:**
- Modify: `kino-client/src/pages/Profile.tsx`

Remove `favoriteMovie`. Add a Top Films section: a ranked list in view mode, and an edit mode with TMDB search to add/remove entries. Calls `PUT /api/auth/top-movies` to save.

- [ ] **Step 1: Rewrite `Profile.tsx`**

  ```tsx
  import { useContext, useEffect, useState, useRef } from 'react';
  import { Navbar } from '../components/layout/Navbar';
  import { AuthContext } from '../context/AuthContext';
  import { Link } from 'react-router-dom';
  import api from '../api/axios';
  import Cropper from 'react-easy-crop';
  import { getCroppedImg } from '../utils/canvasUtils';

  const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5002';

  interface TopMovie { rank: number; tmdbId: number; title: string; posterPath: string | null; }
  interface ProfileData { displayName: string; avatarUrl: string; bio: string; topMovies: TopMovie[]; }
  interface ProfileStats { totalMovies: number; thisYear: number; }

  export default function Profile() {
      const { user, refreshProfile } = useContext(AuthContext)!;

      const [stats, setStats] = useState<ProfileStats>({ totalMovies: 0, thisYear: 0 });
      const [recentReviews, setRecentReviews] = useState<any[]>([]);
      const [profileData, setProfileData] = useState<ProfileData>({
          displayName: '', avatarUrl: '', bio: '', topMovies: []
      });
      const [isEditing, setIsEditing] = useState(false);

      // Top movies edit state
      const [editTopMovies, setEditTopMovies] = useState<TopMovie[]>([]);
      const [movieSearch, setMovieSearch] = useState('');
      const [movieResults, setMovieResults] = useState<any[]>([]);
      const [savingTopMovies, setSavingTopMovies] = useState(false);

      // Cropper state
      const [cropModalOpen, setCropModalOpen] = useState(false);
      const [tempImgSrc, setTempImgSrc] = useState<string | null>(null);
      const [crop, setCrop] = useState({ x: 0, y: 0 });
      const [zoom, setZoom] = useState(1);
      const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

      const nameRef = useRef<HTMLInputElement>(null);
      const bioRef = useRef<HTMLTextAreaElement>(null);
      const fileInputRef = useRef<HTMLInputElement>(null);

      useEffect(() => {
          api.get('/reviews').then(res => {
              const allReviews = res.data;
              const currentYear = new Date().getFullYear();
              setStats({
                  totalMovies: allReviews.length,
                  thisYear: allReviews.filter((r: any) => new Date(r.createdAt).getFullYear() === currentYear).length
              });
              setRecentReviews(allReviews.slice(0, 4));
          });

          api.get('/auth/profile')
              .then(res => setProfileData(res.data))
              .catch(() => {});
      }, []);

      // Sync editTopMovies when entering edit mode
      useEffect(() => {
          if (isEditing) setEditTopMovies([...profileData.topMovies]);
      }, [isEditing]);

      // TMDB search for top movies editor
      useEffect(() => {
          if (!movieSearch.trim()) { setMovieResults([]); return; }
          const timeout = setTimeout(async () => {
              try {
                  const res = await api.get(`/tmdb/search?query=${encodeURIComponent(movieSearch)}`);
                  setMovieResults(res.data.results?.slice(0, 5) ?? []);
              } catch {}
          }, 300);
          return () => clearTimeout(timeout);
      }, [movieSearch]);

      const addTopMovie = (movie: any) => {
          if (editTopMovies.length >= 10) return;
          if (editTopMovies.some(m => m.tmdbId === movie.id)) return;
          const nextRank = editTopMovies.length + 1;
          setEditTopMovies(prev => [...prev, {
              rank: nextRank,
              tmdbId: movie.id,
              title: movie.title,
              posterPath: movie.poster_path ?? null,
          }]);
          setMovieSearch('');
          setMovieResults([]);
      };

      const removeTopMovie = (tmdbId: number) => {
          setEditTopMovies(prev => {
              const filtered = prev.filter(m => m.tmdbId !== tmdbId);
              return filtered.map((m, i) => ({ ...m, rank: i + 1 }));
          });
      };

      const handleSaveTopMovies = async () => {
          setSavingTopMovies(true);
          try {
              await api.put('/auth/top-movies', { movies: editTopMovies });
              const res = await api.get('/auth/profile');
              setProfileData(res.data);
          } catch {
              alert('Failed to save top movies.');
          } finally {
              setSavingTopMovies(false);
          }
      };

      const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
          if (e.target.files && e.target.files.length > 0) {
              const imageDataUrl = await new Promise<string>((resolve) => {
                  const reader = new FileReader();
                  reader.addEventListener('load', () => resolve(reader.result as string));
                  reader.readAsDataURL(e.target.files![0]);
              });
              setTempImgSrc(imageDataUrl);
              setCropModalOpen(true);
          }
      };

      const handleUploadCroppedImage = async () => {
          if (!tempImgSrc || !croppedAreaPixels) return;
          try {
              const blob = await getCroppedImg(tempImgSrc, croppedAreaPixels);
              if (!blob) return;
              const formData = new FormData();
              formData.append('file', new File([blob], 'avatar.jpg', { type: 'image/jpeg' }));
              await api.post('/auth/upload-avatar', formData);
              refreshProfile();
              const res = await api.get('/auth/profile');
              setProfileData(res.data);
              setCropModalOpen(false);
              setTempImgSrc(null);
          } catch {
              alert('Failed to upload image');
          }
      };

      const handleSaveProfile = async () => {
          try {
              await api.put('/auth/profile', {
                  displayName: nameRef.current?.value || '',
                  avatarUrl: profileData.avatarUrl,
                  bio: bioRef.current?.value || '',
              });
              const res = await api.get('/auth/profile');
              setProfileData(res.data);
              setIsEditing(false);
          } catch {
              alert('Failed to save profile');
          }
      };

      const displayName = profileData.displayName || user?.username || 'Member';
      const avatarSrc = profileData.avatarUrl
          ? (profileData.avatarUrl.startsWith('/') ? `${BASE_URL}${profileData.avatarUrl}` : profileData.avatarUrl)
          : null;

      return (
          <div className="min-h-screen bg-pink-50 pb-20 font-sans text-slate-800">
              <Navbar />

              {/* Crop Modal */}
              {cropModalOpen && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
                      <div className="bg-white w-full max-w-md rounded-2xl overflow-hidden shadow-2xl">
                          <div className="h-64 relative bg-slate-100">
                              <Cropper image={tempImgSrc!} crop={crop} zoom={zoom} aspect={1}
                                  onCropChange={setCrop} onCropComplete={(_, p) => setCroppedAreaPixels(p)}
                                  onZoomChange={setZoom} cropShape="round" />
                          </div>
                          <div className="p-6">
                              <h3 className="text-lg font-bold text-slate-800 mb-4">Adjust Photo</h3>
                              <div className="flex gap-3">
                                  <button onClick={handleUploadCroppedImage} className="flex-1 py-2.5 bg-rose-500 text-white font-bold rounded-xl hover:bg-rose-600">Save Photo</button>
                                  <button onClick={() => setCropModalOpen(false)} className="flex-1 py-2.5 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200">Cancel</button>
                              </div>
                          </div>
                      </div>
                  </div>
              )}

              {/* Header */}
              <div className="bg-white border-b border-slate-100 pt-32 pb-10 px-6">
                  <div className="max-w-4xl mx-auto">
                      <div className="flex flex-col md:flex-row items-center md:items-end gap-6 md:gap-8">
                          <div className="relative group shrink-0 cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                              <div className="w-32 h-32 rounded-full bg-rose-100 p-1 ring-4 ring-white shadow-xl overflow-hidden relative">
                                  {avatarSrc ? (
                                      <img src={avatarSrc} alt="Avatar" className="w-full h-full object-cover rounded-full" />
                                  ) : (
                                      <div className="w-full h-full rounded-full bg-gradient-to-tr from-rose-400 to-orange-400 flex items-center justify-center text-5xl text-white font-black">
                                          {displayName[0]?.toUpperCase()}
                                      </div>
                                  )}
                                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
                                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8 text-white">
                                          <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
                                      </svg>
                                  </div>
                              </div>
                              <input type="file" ref={fileInputRef} onChange={onFileChange} accept="image/*" className="hidden" />
                          </div>

                          <div className="flex-1 text-center md:text-left w-full">
                              <div className="flex flex-col md:flex-row justify-between items-center mb-4">
                                  <div>
                                      <h1 className="text-3xl font-black text-slate-800 tracking-tight">{displayName}</h1>
                                      <p className="text-slate-400 text-sm font-bold uppercase tracking-wider mt-1">@{user?.username}</p>
                                  </div>
                                  {!isEditing && (
                                      <button onClick={() => setIsEditing(true)} className="mt-4 md:mt-0 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold uppercase tracking-wider rounded-lg transition-colors">
                                          Edit Profile
                                      </button>
                                  )}
                              </div>
                              <div className="flex justify-center md:justify-start gap-8 border-t border-slate-100 pt-4 md:border-none md:pt-0">
                                  <div><div className="text-2xl font-black text-rose-500">{stats.totalMovies}</div><div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Films</div></div>
                                  <div><div className="text-2xl font-black text-slate-700">{stats.thisYear}</div><div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">This Year</div></div>
                              </div>
                          </div>
                      </div>

                      {/* Edit Form */}
                      {isEditing && (
                          <div className="mt-8 p-6 bg-slate-50 rounded-2xl border border-slate-200 animate-in fade-in slide-in-from-top-4 space-y-4">
                              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-200 pb-2">Edit Profile</h3>
                              <div>
                                  <label className="text-xs font-bold text-slate-500 block mb-1">Display Name</label>
                                  <input ref={nameRef} defaultValue={profileData.displayName} className="w-full p-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-rose-500 outline-none text-sm" />
                              </div>
                              <div>
                                  <label className="text-xs font-bold text-slate-500 block mb-1">Bio</label>
                                  <textarea ref={bioRef} defaultValue={profileData.bio} rows={3} className="w-full p-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-rose-500 outline-none text-sm" />
                              </div>
                              <div className="flex gap-3">
                                  <button onClick={handleSaveProfile} className="px-6 py-2 bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold rounded-lg transition-colors">Save Changes</button>
                                  <button onClick={() => setIsEditing(false)} className="px-6 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-600 text-xs font-bold rounded-lg transition-colors">Cancel</button>
                              </div>
                          </div>
                      )}
                  </div>
              </div>

              {/* Body */}
              <div className="max-w-4xl mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-3 gap-12">
                  <div className="space-y-6">
                      {!isEditing && (
                          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">About</h3>
                              <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{profileData.bio || 'No bio yet.'}</p>
                          </div>
                      )}

                      {/* Top Films */}
                      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                          <div className="flex items-center justify-between mb-4">
                              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Top Films</h3>
                              {!isEditing && (
                                  <button onClick={() => setIsEditing(true)} className="text-[10px] font-bold text-rose-400 hover:text-rose-600 uppercase tracking-widest">Edit</button>
                              )}
                          </div>

                          {!isEditing ? (
                              profileData.topMovies.length === 0 ? (
                                  <p className="text-sm text-slate-400">No top films yet.</p>
                              ) : (
                                  <div className="space-y-2">
                                      {profileData.topMovies.map(m => (
                                          <div key={m.rank} className="flex items-center gap-3">
                                              <span className="text-xs font-black text-slate-300 w-4">{m.rank}</span>
                                              {m.posterPath && <img src={`https://image.tmdb.org/t/p/w92${m.posterPath}`} className="w-8 h-12 object-cover rounded" alt={m.title} />}
                                              <span className="text-sm font-bold text-slate-700 line-clamp-1">{m.title}</span>
                                          </div>
                                      ))}
                                  </div>
                              )
                          ) : (
                              <div className="space-y-3">
                                  {/* Current top movies list */}
                                  {editTopMovies.map(m => (
                                      <div key={m.tmdbId} className="flex items-center gap-2">
                                          <span className="text-xs font-black text-slate-300 w-4">{m.rank}</span>
                                          {m.posterPath && <img src={`https://image.tmdb.org/t/p/w92${m.posterPath}`} className="w-7 h-10 object-cover rounded" alt={m.title} />}
                                          <span className="text-xs font-bold text-slate-700 flex-1 line-clamp-1">{m.title}</span>
                                          <button onClick={() => removeTopMovie(m.tmdbId)} className="text-slate-300 hover:text-rose-500 transition-colors text-lg leading-none">×</button>
                                      </div>
                                  ))}

                                  {/* Search to add */}
                                  {editTopMovies.length < 10 && (
                                      <div className="relative pt-2">
                                          <input
                                              type="text"
                                              placeholder="Search to add a film..."
                                              value={movieSearch}
                                              onChange={e => setMovieSearch(e.target.value)}
                                              className="w-full p-2 rounded-lg border border-slate-200 text-xs outline-none focus:ring-2 focus:ring-rose-500"
                                          />
                                          {movieResults.length > 0 && (
                                              <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-10">
                                                  {movieResults.map((m: any) => (
                                                      <div key={m.id} onClick={() => addTopMovie(m)} className="flex items-center gap-2 px-3 py-2 hover:bg-rose-50 cursor-pointer">
                                                          {m.poster_path && <img src={`https://image.tmdb.org/t/p/w92${m.poster_path}`} className="w-6 h-9 object-cover rounded" alt={m.title} />}
                                                          <span className="text-xs font-bold text-slate-700">{m.title}</span>
                                                          <span className="text-[10px] text-slate-400 ml-auto">{m.release_date?.split('-')[0]}</span>
                                                      </div>
                                                  ))}
                                              </div>
                                          )}
                                      </div>
                                  )}

                                  <button
                                      onClick={handleSaveTopMovies}
                                      disabled={savingTopMovies}
                                      className="w-full py-2 bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold rounded-lg transition-colors disabled:opacity-50"
                                  >
                                      {savingTopMovies ? 'Saving…' : 'Save Top Films'}
                                  </button>
                              </div>
                          )}
                      </div>
                  </div>

                  <div className="lg:col-span-2 space-y-6">
                      <div className="flex items-center justify-between">
                          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Recent Activity</h3>
                          <Link to="/diary" className="text-xs font-bold text-rose-500 hover:text-rose-600 hover:underline">View Full Diary →</Link>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                          {recentReviews.map((review) => (
                              <div key={review.id} className="group relative aspect-[2/3] bg-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all cursor-pointer">
                                  <img src={`https://image.tmdb.org/t/p/w300${review.movie.posterPath}`} alt={review.movie.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                              </div>
                          ))}
                      </div>
                  </div>
              </div>
          </div>
      );
  }
  ```

- [ ] **Step 2: Commit**
  ```bash
  git add kino-client/src/pages/Profile.tsx
  git commit -m "feat: replace favoriteMovie with Top 10 films editor on profile page"
  ```

---

## Task 17: End-to-End Verification

No test framework exists — verify manually by running both servers.

- [ ] **Step 1: Start backend**
  ```bash
  cd Kino.Server
  dotnet watch run
  ```
  Verify no startup errors in console.

- [ ] **Step 2: Start frontend**
  ```bash
  cd kino-client
  npm run dev
  ```
  Open http://localhost:5173.

- [ ] **Step 3: New user flow**
  1. Click "Join Club" or "Sign In" in Navbar → AuthModal opens showing only "Continue with Google".
  2. Click "Continue with Google" → Google popup appears.
  3. Sign in with a Google account → `UsernameModal` appears with your Google display name shown.
  4. Type a username → check that "✓ available" appears after 300ms.
  5. Type an already-taken username → "✗ taken" appears.
  6. Submit valid username → modal closes, you are now logged in.
  7. Verify: your display name appears in Navbar, profile page loads.

- [ ] **Step 4: Returning user flow**
  1. Log out.
  2. Click "Sign In" → Google popup → immediately logged in (no username step).

- [ ] **Step 5: Top movies**
  1. Go to `/profile`.
  2. Click "Edit" on Top Films section.
  3. Search for a movie (e.g. "Inception") → results appear.
  4. Click a result → it appears in the ranked list.
  5. Add up to 10 movies, click "Save Top Films".
  6. Exit edit mode → the list shows in view mode.
  7. Visit `/u/<your-username>` → top films section shows there too.

- [ ] **Step 6: Member search**
  1. In Navbar search, type a display name → results appear.
  2. Click a result → navigates to `/u/<username>`.

- [ ] **Step 7: Final commit**
  ```bash
  git add .
  git commit -m "feat: Google-only authentication — complete implementation"
  ```
