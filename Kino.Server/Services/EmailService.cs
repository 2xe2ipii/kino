using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;
using MimeKit.Text;

namespace Kino.Server.Services
{
    public class EmailService : IEmailService
    {
        private readonly IConfiguration _config;

        public EmailService(IConfiguration config)
        {
            _config = config;
        }

        public async Task<bool> SendEmailAsync(string toEmail, string subject, string body)
        {
            try
            {
                var email = new MimeMessage();
                // Ensure the "From" address is not empty to avoid a crash if config is missing
                var fromEmail = _config["Gmail:Email"] ?? "no-reply@kino.com"; 
                email.From.Add(MailboxAddress.Parse(fromEmail));
                email.To.Add(MailboxAddress.Parse(toEmail));
                email.Subject = subject;
                email.Body = new TextPart(TextFormat.Html) { Text = body };

                using var smtp = new SmtpClient();
                
                // FIX: Use Port 465 with SslOnConnect (Bypasses most firewall/AV hangs)
                await smtp.ConnectAsync("smtp.gmail.com", 465, SecureSocketOptions.SslOnConnect);

                // Authenticate
                await smtp.AuthenticateAsync(_config["Gmail:Email"], _config["Gmail:Password"]);

                await smtp.SendAsync(email);
                await smtp.DisconnectAsync(true);

                return true;
            }
            catch (Exception ex)
            {
                // Log the actual error to your server console so you can see it!
                Console.WriteLine($"[EMAIL ERROR]: {ex.Message}"); 
                return false;
            }
        }
    }
}