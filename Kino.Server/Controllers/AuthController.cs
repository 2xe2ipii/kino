using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
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
            var user = new IdentityUser { UserName = request.Username, Email = request.Email };
            var result = await _userManager.CreateAsync(user, request.Password);

            if (result.Succeeded)
            {
                var token = await _userManager.GenerateEmailConfirmationTokenAsync(user);

                // Send the Real Email
                var emailBody = $"<h3>Welcome to Kino!</h3><p>Here is your verification code: <strong>{token}</strong></p>";
                await _emailService.SendEmailAsync(request.Email, "Verify your Kino Account", emailBody);

                return Ok(new { message = "Registration successful! Please check your email for the verification code." });
            }

            return BadRequest(result.Errors);
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login(LoginDto request)
        {
            var user = await _userManager.FindByNameAsync(request.Username);
            if (user == null) return Unauthorized("Invalid username or password.");

            // NOTE: We are temporarily allowing login without email confirmation 
            // so you can test the JWT generation immediately. 
            // We will uncomment this when we implement SendGrid in the next step.
            /* if (!await _userManager.IsEmailConfirmedAsync(user))
            {
                return Unauthorized("Please confirm your email address before logging in.");
            }
            */

            var result = await _signInManager.CheckPasswordSignInAsync(user, request.Password, false);

            if (!result.Succeeded) return Unauthorized("Invalid username or password.");

            // Generate the token
            var token = _tokenService.CreateToken(user);

            return Ok(new 
            { 
                username = user.UserName,
                email = user.Email,
                token = token
            });
        }
    }
}