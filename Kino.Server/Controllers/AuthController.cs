using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Authorization; // FIXED: Needed for [Authorize]
using Microsoft.EntityFrameworkCore;      // FIXED: Needed for async DB calls
using System.Security.Claims;             // FIXED: Needed for User.FindFirstValue
using Kino.Server.Data;                   // FIXED: Needed for AppDbContext
using Kino.Server.Models;
using Kino.Server.DTOs;
using Kino.Server.Services;

namespace Kino.Server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly UserManager<IdentityUser> _userManager;
        private readonly SignInManager<IdentityUser> _signInManager;
        private readonly ITokenService _tokenService;
        private readonly IEmailService _emailService;
        private readonly AppDbContext _context; // FIXED: Added Context field

        // FIXED: Inject AppDbContext in constructor
        public AuthController(
            UserManager<IdentityUser> userManager, 
            SignInManager<IdentityUser> signInManager, 
            ITokenService tokenService, 
            IEmailService emailService,
            AppDbContext context) 
        {
            _userManager = userManager;
            _signInManager = signInManager;
            _tokenService = tokenService;
            _emailService = emailService;
            _context = context; 
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register(RegisterDto request)
        {
            // --- 1. DETECT AND PURGE ZOMBIE USERS ---
            
            // Check Username
            var existingUser = await _userManager.FindByNameAsync(request.Username);
            if (existingUser != null)
            {
                if (!await _userManager.IsEmailConfirmedAsync(existingUser))
                {
                    await _userManager.DeleteAsync(existingUser);
                }
                else
                {
                    return BadRequest($"Username '{request.Username}' is already taken.");
                }
            }

            // Check Email
            var existingEmail = await _userManager.FindByEmailAsync(request.Email);
            if (existingEmail != null)
            {
                if (!await _userManager.IsEmailConfirmedAsync(existingEmail))
                {
                    await _userManager.DeleteAsync(existingEmail);
                }
                else
                {
                    return BadRequest($"Email '{request.Email}' is already in use.");
                }
            }

            // --- 2. CREATE NEW USER ---
            var user = new IdentityUser { UserName = request.Username, Email = request.Email };
            var result = await _userManager.CreateAsync(user, request.Password);

            if (result.Succeeded)
            {
                try 
                {
                    // --- 3. SEND EMAIL ---
                    var emailSent = await SendVerificationEmail(user);
                    
                    if (!emailSent)
                    {
                        await _userManager.DeleteAsync(user);
                        return StatusCode(500, "Email failed to send. Please check App Password. User deleted - try again.");
                    }

                    return Ok(new { message = "Registration successful! Verification code sent.", userId = user.Id });
                }
                catch (Exception ex)
                {
                    await _userManager.DeleteAsync(user);
                    return StatusCode(500, $"Email System Crash: {ex.Message}");
                }
            }

            return BadRequest(result.Errors);
        }

        [HttpPost("verify-email")]
        public async Task<IActionResult> VerifyEmail(VerifyEmailDto request)
        {
            var user = await _userManager.FindByIdAsync(request.UserId);
            if (user == null) return BadRequest("Invalid user ID.");

            var result = await _userManager.ConfirmEmailAsync(user, request.Token);

            if (result.Succeeded)
            {
                return Ok(new { message = "Email confirmed! Logging you in..." });
            }

            return BadRequest("Invalid or expired verification code.");
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login(LoginDto request)
        {
            var user = await _userManager.FindByNameAsync(request.Username);
            if (user == null) return Unauthorized("Invalid username or password.");

            if (!await _userManager.IsEmailConfirmedAsync(user))
            {
                return Unauthorized("Please check your email for the verification code.");
            }

            var result = await _signInManager.CheckPasswordSignInAsync(user, request.Password, false);

            if (!result.Succeeded) return Unauthorized("Invalid username or password.");

            var token = _tokenService.CreateToken(user);

            return Ok(new 
            { 
                username = user.UserName,
                email = user.Email,
                token = token
            });
        }

        private async Task<bool> SendVerificationEmail(IdentityUser user)
        {
            var token = await _userManager.GenerateEmailConfirmationTokenAsync(user);

            var emailBody = $@"
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset='utf-8'>
                <meta name='viewport' content='width=device-width, initial-scale=1.0'>
                <style>
                    body {{ margin: 0; padding: 0; background-color: #f8fafc; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; }}
                    .container {{ width: 100%; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.05); margin-top: 40px; margin-bottom: 40px; border: 1px solid #e2e8f0; }}
                    .header {{ background: linear-gradient(135deg, #fff1f2 0%, #ffffff 100%); padding: 40px 0; text-align: center; border-bottom: 1px solid #f1f5f9; }}
                    .content {{ padding: 40px 48px; text-align: center; }}
                    .code-box {{ background-color: #fff1f2; color: #be185d; font-size: 32px; letter-spacing: 8px; font-weight: bold; padding: 24px; border-radius: 16px; margin: 32px 0; border: 2px dashed #fbcfe8; display: inline-block; font-family: 'Courier New', monospace; }}
                    .footer {{ background-color: #f8fafc; padding: 24px; text-align: center; color: #94a3b8; font-size: 12px; border-top: 1px solid #e2e8f0; }}
                    h1 {{ color: #0f172a; font-size: 24px; margin: 0 0 16px 0; letter-spacing: -0.5px; }}
                    p {{ color: #475569; font-size: 16px; line-height: 1.6; margin: 0; }}
                </style>
            </head>
            <body>
                <div style='background-color: #f1f5f9; padding: 20px;'>
                    <div class='container'>
                        <div class='header'>
                            <h2 style='margin:0; font-family: Georgia, serif; color: #be185d; font-size: 36px; letter-spacing: -1px;'>kino.</h2>
                            <p style='color: #be185d; font-size: 11px; text-transform: uppercase; letter-spacing: 3px; margin-top: 8px; font-weight: 700; opacity: 0.8;'>The Movie Diary</p>
                        </div>

                        <div class='content'>
                            <h1>Verify your email</h1>
                            <p>Welcome to Kino, <strong>{user.UserName}</strong>.<br>Enter this code to start logging your films.</p>
                            
                            <div class='code-box'>{token}</div>
                            
                            <p style='font-size: 14px; color: #94a3b8;'>This code will expire in 10 minutes.<br>If you didn't request this, you can safely ignore this email.</p>
                        </div>

                        <div class='footer'>
                            <p>&copy; 2026 Kino App. All rights reserved.</p>
                        </div>
                    </div>
                </div>
            </body>
            </html>";

            return await _emailService.SendEmailAsync(user.Email!, "Your Kino Verification Code", emailBody);
        }

        // --- PROFILE ENDPOINTS (FIXED) ---

        [Authorize]
        [HttpGet("profile")]
        public async Task<IActionResult> GetProfile()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var profile = await _context.UserProfiles.FirstOrDefaultAsync(p => p.UserId == userId);
            
            return Ok(new 
            { 
                displayName = profile?.DisplayName ?? "",
                avatarUrl = profile?.AvatarUrl ?? "",
                bio = profile?.Bio ?? "", 
                favoriteMovie = profile?.FavoriteMovie ?? "" 
            });
        }

        [Authorize]
        [HttpPost("upload-avatar")]
        public async Task<IActionResult> UploadAvatar([FromForm] IFormFile file)
        {
            if (file == null || file.Length == 0) return BadRequest("No file uploaded.");

            // FIX: Strictly look for NameIdentifier (which is now the ID)
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (string.IsNullOrEmpty(userId)) return Unauthorized("User ID missing.");

            // ... Folder/Saving logic (Keep your existing file saving code here) ...
            var uploadsFolder = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads");
            if (!Directory.Exists(uploadsFolder)) Directory.CreateDirectory(uploadsFolder);

            var ext = Path.GetExtension(file.FileName);
            var filename = $"{userId}_{DateTime.UtcNow.Ticks}{ext}";
            var filePath = Path.Combine(uploadsFolder, filename);

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            // DB Update
            var profile = await _context.UserProfiles.FirstOrDefaultAsync(p => p.UserId == userId);
            if (profile == null)
            {
                profile = new UserProfile { UserId = userId };
                _context.UserProfiles.Add(profile);
            }

            var fileUrl = $"/uploads/{filename}";
            profile.AvatarUrl = fileUrl;
            
            await _context.SaveChangesAsync();
            return Ok(new { url = fileUrl });
        }

        [Authorize]
        [HttpPut("profile")]
        public async Task<IActionResult> UpdateProfile([FromBody] UserProfileDto dto)
        {
            // FIX: Strictly look for NameIdentifier
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            
            if (string.IsNullOrEmpty(userId)) return Unauthorized("User ID missing.");

            var profile = await _context.UserProfiles.FirstOrDefaultAsync(p => p.UserId == userId);

            if (profile == null)
            {
                profile = new UserProfile { UserId = userId };
                _context.UserProfiles.Add(profile);
            }

            profile.DisplayName = dto.DisplayName;
            profile.Bio = dto.Bio;
            profile.AvatarUrl = dto.AvatarUrl; 
            // Note: We don't overwrite FavoriteMovie here usually, unless you added it to the form
            
            await _context.SaveChangesAsync();
            return Ok(profile);
        }
        
    }

     public class UserProfileDto
        {
            public string DisplayName { get; set; } = string.Empty;
            public string AvatarUrl { get; set; } = string.Empty;
            public string Bio { get; set; } = string.Empty;
            public string FavoriteMovie { get; set; } = string.Empty;
        }
}