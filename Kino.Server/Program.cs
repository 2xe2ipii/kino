using Kino.Server.Data;
using Kino.Server.Services;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// --- DATABASE & IDENTITY CONFIGURATION ---
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(connectionString));

// Add Identity (User/Role management)
builder.Services.AddIdentity<IdentityUser, IdentityRole>(options => 
{
    options.User.RequireUniqueEmail = true;
    options.Password.RequireDigit = false; // Easier for testing
    options.Password.RequiredLength = 6;
    options.Password.RequireNonAlphanumeric = false;
    options.Password.RequireUppercase = false;
})
.AddEntityFrameworkStores<AppDbContext>();
// ----------------------------------------

// --- CUSTOM SERVICES ---
builder.Services.AddScoped<ITmdbService, TmdbService>();
// -----------------------

// --- CORS POLICY ---
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp",
        policy =>
        {
            policy.WithOrigins("http://localhost:5173") 
                  .AllowAnyHeader()
                  .AllowAnyMethod();
        });
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseCors("AllowReactApp");

// Must be in this order!
app.UseAuthentication(); // Who are you?
app.UseAuthorization();  // What are you allowed to do?

app.MapControllers();

app.Run();