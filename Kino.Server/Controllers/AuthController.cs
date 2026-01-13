using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Kino.Server.DTOs;
using Kino.Server.Services;
using System.Text.Encodings.Web;

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

        public AuthController(UserManager<IdentityUser> userManager, SignInManager<IdentityUser> signInManager, ITokenService tokenService, IEmailService emailService)
        {
            _userManager = userManager;
            _signInManager = signInManager;
            _tokenService = tokenService;
            _emailService = emailService;
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
                    // Found a Zombie! (Exists but not verified). Delete it.
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
                    // Found a Zombie Email! Delete it.
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
                        // ROLLBACK: If email fails, delete the user immediately so we don't create a new Zombie.
                        await _userManager.DeleteAsync(user);
                        return StatusCode(500, "Email failed to send. Please check App Password. User deleted - try again.");
                    }

                    return Ok(new { message = "Registration successful! Verification code sent.", userId = user.Id });
                }
                catch (Exception ex)
                {
                    // CRASH ROLLBACK
                    await _userManager.DeleteAsync(user);
                    return StatusCode(500, $"Email System Crash: {ex.Message}");
                }
            }

            // Return detailed validation errors (e.g., Password too short)
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

            // This check is now safe to keep because we fixed the Registration flow!
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

            // PREMIUM HTML EMAIL TEMPLATE
            var emailBody = $@"
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset='utf-8'>
                <meta name='viewport' content='width=device-width, initial-scale=1.0'>
                <style>
                    /* Reset */
                    body {{ margin: 0; padding: 0; background-color: #f8fafc; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; }}
                    .container {{ width: 100%; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.05); margin-top: 40px; margin-bottom: 40px; border: 1px solid #e2e8f0; }}
                    .header {{ background: linear-gradient(135deg, #fff1f2 0%, #ffffff 100%); padding: 40px 0; text-align: center; border-bottom: 1px solid #f1f5f9; }}
                    .content {{ padding: 40px 48px; text-align: center; }}
                    .code-box {{ background-color: #fff1f2; color: #be185d; font-size: 32px; letter-spacing: 8px; font-weight: bold; padding: 24px; border-radius: 16px; margin: 32px 0; border: 2px dashed #fbcfe8; display: inline-block; font-family: 'Courier New', monospace; }}
                    .footer {{ background-color: #f8fafc; padding: 24px; text-align: center; color: #94a3b8; font-size: 12px; border-top: 1px solid #e2e8f0; }}
                    .btn {{ display: inline-block; padding: 12px 24px; background-color: #be185d; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; margin-top: 20px; }}
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
    }
}