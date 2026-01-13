using System.Text;
using Kino.Server.Data;
using Kino.Server.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using DotNetEnv; // <--- 1. IMPORTANT: Add this namespace

// --- 2. IMPORTANT: Load the .env file immediately ---
Env.Load();

var builder = WebApplication.CreateBuilder(args);

// --- 3. IMPORTANT: Overwrite Config with .env values ---
// This tells the app: "Don't use appsettings.json for these, use the .env file instead"
if (File.Exists(".env"))
{
    // Database
    builder.Configuration["ConnectionStrings:DefaultConnection"] = Environment.GetEnvironmentVariable("DATABASE_URL");
    
    // TMDB
    builder.Configuration["Tmdb:ApiKey"] = Environment.GetEnvironmentVariable("TMDB_API_KEY");
    
    // JWT
    builder.Configuration["Jwt:Key"] = Environment.GetEnvironmentVariable("JWT_KEY");
    builder.Configuration["Jwt:Issuer"] = Environment.GetEnvironmentVariable("JWT_ISSUER");
    builder.Configuration["Jwt:Audience"] = Environment.GetEnvironmentVariable("JWT_AUDIENCE");

    // Email
    builder.Configuration["Gmail:Email"] = Environment.GetEnvironmentVariable("GMAIL_EMAIL");
    builder.Configuration["Gmail:Password"] = Environment.GetEnvironmentVariable("GMAIL_PASSWORD");
}

// Add services to the container.
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// --- CORS ---
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp",
        policy =>
        {
            policy.AllowAnyOrigin() // <--- Change this
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
            // Now this will read the LONG key from your .env
            Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]!))
    };
});

// --- CUSTOM SERVICES ---
builder.Services.AddScoped<ITmdbService, TmdbService>();
builder.Services.AddScoped<ITokenService, TokenService>();
builder.Services.AddScoped<IEmailService, EmailService>();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseStaticFiles();
app.UseCors("AllowReactApp");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.Run();