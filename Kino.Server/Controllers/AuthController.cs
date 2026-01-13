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
            // 1. Check if user exists
            var userExists = await _userManager.FindByNameAsync(request.Username);
            if (userExists != null) return BadRequest("Username already taken");

            var emailExists = await _userManager.FindByEmailAsync(request.Email);
            if (emailExists != null) return BadRequest("Email already registered");

            // 2. Create User
            var user = new IdentityUser { UserName = request.Username, Email = request.Email };
            var result = await _userManager.CreateAsync(user, request.Password);

            if (result.Succeeded)
            {
                // Wrap Email Sending in Try/Catch to prevent 500 Crashes
                try 
                {
                    var emailSent = await SendVerificationEmail(user);
                    if (!emailSent)
                    {
                        // Verify this string is what you see in the frontend now
                        return StatusCode(500, "User created, but Email Service failed (Check App Password/Connection).");
                    }
                }
                catch (Exception ex)
                {
                    // This catches SMTP crashes (e.g., bad password, firewall)
                    return StatusCode(500, $"Email System Error: {ex.Message}");
                }

                return Ok(new { message = "Registration successful! Please check your email.", userId = user.Id });
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
                return Ok(new { message = "Email confirmed successfully! You can now login." });
            }

            return BadRequest("Error confirming email. The token might be invalid or expired.");
        }

        [HttpPost("resend-verification")]
        public async Task<IActionResult> ResendVerification([FromBody] string email)
        {
            var user = await _userManager.FindByEmailAsync(email);
            if (user == null) return BadRequest("User not found.");

            if (await _userManager.IsEmailConfirmedAsync(user))
                return BadRequest("Email is already verified.");

            var sent = await SendVerificationEmail(user);
            if (!sent) return StatusCode(500, "Failed to send email.");

            return Ok("Verification email sent.");
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login(LoginDto request)
        {
            var user = await _userManager.FindByNameAsync(request.Username);
            if (user == null) return Unauthorized("Invalid username or password.");

            // Enforce Email Verification
            if (!await _userManager.IsEmailConfirmedAsync(user))
            {
                return Unauthorized("Please confirm your email address before logging in.");
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

        // --- Helper Method to Send Nice Emails ---
        // Returns bool so we know if it worked
        private async Task<bool> SendVerificationEmail(IdentityUser user)
        {
            var token = await _userManager.GenerateEmailConfirmationTokenAsync(user);

            // THEME: Girlsy Minimalism (Pink/Rose/White)
            var emailBody = $@"
            <div style='font-family: ""Helvetica Neue"", Helvetica, Arial, sans-serif; background-color: #fff1f2; padding: 40px 0;'>
                <div style='max-width: 500px; margin: 0 auto; background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 40px rgba(251, 113, 133, 0.15);'>
                    
                    <div style='background: linear-gradient(to bottom, #fdf2f8, #ffffff); padding: 40px 20px 20px 20px; text-align: center;'>
                        <h1 style='margin: 0; font-family: ""Georgia"", serif; color: #be185d; font-size: 42px; letter-spacing: -2px; font-weight: 900;'>kino.</h1>
                        <p style='color: #db2777; font-size: 10px; text-transform: uppercase; letter-spacing: 3px; margin-top: 5px; font-weight: bold;'>The Movie Diary</p>
                    </div>

                    <div style='padding: 20px 40px 50px 40px; text-align: center; color: #334155;'>
                        <p style='font-size: 18px; margin-bottom: 10px; font-weight: 700; color: #1e293b;'>Hi, {user.UserName}</p>
                        <p style='font-size: 15px; line-height: 1.6; color: #64748b; margin-bottom: 30px;'>
                            Your screening is about to start. Please copy the verification code below to activate your account.
                        </p>
                        
                        <div style='background-color: #fff0f5; border: 2px dashed #fbcfe8; border-radius: 16px; padding: 25px; margin: 0 auto;'>
                            <span style='display: block; font-size: 10px; color: #be185d; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 10px; font-weight: bold;'>Verification Token</span>
                            <code style='font-family: ""Courier New"", monospace; display: block; font-size: 18px; color: #9d174d; word-break: break-all; line-height: 1.4; font-weight: bold;'>
                                {token}
                            </code>
                        </div>
                    </div>
                </div>
                
                <div style='text-align: center; margin-top: 30px;'>
                    <p style='margin: 0; font-size: 12px; color: #fb7185; letter-spacing: 1px; font-weight: 600;'>DEVELOPED BY 2XE2IPI</p>
                </div>
            </div>";

            // Return the result of the email send
            return await _emailService.SendEmailAsync(user.Email!, "Your Kino Ticket", emailBody);
        }
    }
}