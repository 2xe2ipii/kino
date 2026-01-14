using System.Text;
using Kino.Server.Data;
using Kino.Server.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using DotNetEnv; 

// 1. Load .env if it exists (for Localhost)
Env.Load();

var builder = WebApplication.CreateBuilder(args);

// 2. CONFIGURATION MAPPING (Modified for Production)
// We removed 'if (File.Exists)' so this runs on Render too.
// We use '??' to keep existing values if the Env Var is missing (safety).

var dbUrl = Environment.GetEnvironmentVariable("DATABASE_URL");
if (!string.IsNullOrEmpty(dbUrl)) 
{
    builder.Configuration["ConnectionStrings:DefaultConnection"] = dbUrl;
}

var tmdbKey = Environment.GetEnvironmentVariable("TMDB_API_KEY");
if (!string.IsNullOrEmpty(tmdbKey))
{
    builder.Configuration["Tmdb:ApiKey"] = tmdbKey;
}

var jwtKey = Environment.GetEnvironmentVariable("JWT_KEY");
if (!string.IsNullOrEmpty(jwtKey))
{
    builder.Configuration["Jwt:Key"] = jwtKey;
    builder.Configuration["Jwt:Issuer"] = Environment.GetEnvironmentVariable("JWT_ISSUER");
    builder.Configuration["Jwt:Audience"] = Environment.GetEnvironmentVariable("JWT_AUDIENCE");
}

// Load SMTP settings from Environment Variables (Brevo)
var smtpHost = Environment.GetEnvironmentVariable("SMTP_HOST");
if (!string.IsNullOrEmpty(smtpHost))
{
    builder.Configuration["Smtp:Host"] = smtpHost;
    builder.Configuration["Smtp:Port"] = Environment.GetEnvironmentVariable("SMTP_PORT");
    builder.Configuration["Smtp:User"] = Environment.GetEnvironmentVariable("SMTP_USER");
    builder.Configuration["Smtp:Pass"] = Environment.GetEnvironmentVariable("SMTP_PASS");
    builder.Configuration["Smtp:From"] = Environment.GetEnvironmentVariable("SMTP_FROM");
}

// Add services to the container.
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// --- CORS (Verified for Vercel) ---
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp",
        policy =>
        {
            policy.AllowAnyOrigin() 
                  .AllowAnyHeader()
                  .AllowAnyMethod();
        });
});

// --- DB & IDENTITY ---
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(connectionString));

builder.Services.AddIdentity<IdentityUser, IdentityRole>(options => 
{
    options.User.RequireUniqueEmail = true;
    options.Password.RequireDigit = false;
    options.Password.RequireLowercase = false;
    options.Password.RequireUppercase = false;
    options.Password.RequireNonAlphanumeric = false;
    options.Password.RequiredLength = 6;
    options.Tokens.EmailConfirmationTokenProvider = TokenOptions.DefaultEmailProvider;
})
.AddEntityFrameworkStores<AppDbContext>()
.AddDefaultTokenProviders(); 

// --- AUTHENTICATION (JWT) ---
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

// --- CUSTOM SERVICES ---
builder.Services.AddScoped<ITmdbService, TmdbService>();
builder.Services.AddScoped<ITokenService, TokenService>();
builder.Services.AddScoped<IEmailService, EmailService>();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

// --- PIPELINE ORDER (Verified) ---
app.UseStaticFiles();         // 1. Static Files (Images)
app.UseCors("AllowReactApp"); // 2. CORS
app.UseAuthentication();      // 3. Auth
app.UseAuthorization();       // 4. Permissions

app.MapControllers();
// FIX: This tells .NET to serve the React App for any unknown routes (like /profile)
app.MapFallbackToFile("index.html");
app.Run();