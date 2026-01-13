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
                // 1. Create the email object
                var email = new MimeMessage();
                email.From.Add(MailboxAddress.Parse(_config["Gmail:Email"]));
                email.To.Add(MailboxAddress.Parse(toEmail));
                email.Subject = subject;
                email.Body = new TextPart(TextFormat.Html) { Text = body };

                // 2. Connect to Gmail's SMTP Server
                using var smtp = new SmtpClient();
                
                // Connect to smtp.gmail.com on port 587 using StartTLS security
                await smtp.ConnectAsync("smtp.gmail.com", 587, SecureSocketOptions.StartTls);

                // Authenticate with your App Password
                await smtp.AuthenticateAsync(_config["Gmail:Email"], _config["Gmail:Password"]);

                // Send
                await smtp.SendAsync(email);
                
                // Disconnect cleanly
                await smtp.DisconnectAsync(true);

                return true;
            }
            catch (Exception ex)
            {
                // In a real app, log this error!
                Console.WriteLine($"Email send failed: {ex.Message}");
                return false;
            }
        }
    }
}