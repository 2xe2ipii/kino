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
