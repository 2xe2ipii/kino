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
                await SendVerificationEmail(user);
                return Ok(new { message = "Registration successful! Please check your email for the verification code.", userId = user.Id });
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

            await SendVerificationEmail(user);
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
        private async Task SendVerificationEmail(IdentityUser user)
        {
            var token = await _userManager.GenerateEmailConfirmationTokenAsync(user);

            // A cleaner HTML email template
            var emailBody = $@"
                <div style='font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; border-radius: 10px; overflow: hidden;'>
                    <div style='background-color: #1a1a1a; color: #ffffff; padding: 20px; text-align: center;'>
                        <h1 style='margin: 0;'>Welcome to Kino</h1>
                    </div>
                    <div style='padding: 30px; background-color: #ffffff; color: #333333;'>
                        <p style='font-size: 16px;'>Hi <strong>{user.UserName}</strong>,</p>
                        <p style='font-size: 16px;'>Thanks for joining Kino! To start logging your movies, please verify your email address using the code below:</p>
                        
                        <div style='background-color: #f4f4f4; padding: 15px; text-align: center; border-radius: 5px; margin: 20px 0;'>
                            <code style='font-size: 24px; font-weight: bold; color: #1a1a1a; letter-spacing: 2px;'>{token}</code>
                        </div>

                        <p style='font-size: 14px; color: #666;'>If you didn't create an account, you can safely ignore this email.</p>
                    </div>
                    <div style='background-color: #f9f9f9; padding: 15px; text-align: center; font-size: 12px; color: #999;'>
                        &copy; 2026 Kino App
                    </div>
                </div>";

            await _emailService.SendEmailAsync(user.Email!, "Verify your Kino Account", emailBody);
        }
    }
}