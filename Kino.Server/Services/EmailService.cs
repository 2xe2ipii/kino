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
                
                // 1. Get Sender Email (Default to "no-reply" if missing)
                var fromEmail = _config["Smtp:From"] ?? "no-reply@kino.com";
                
                email.From.Add(MailboxAddress.Parse(fromEmail));
                email.To.Add(MailboxAddress.Parse(toEmail));
                email.Subject = subject;
                email.Body = new TextPart(TextFormat.Html) { Text = body };

                using var smtp = new SmtpClient();
                
                // 2. Get Host & Port from Config (Default to Brevo / 2525)
                var host = _config["Smtp:Host"] ?? "smtp-relay.brevo.com";
                var port = int.Parse(_config["Smtp:Port"] ?? "2525");

                // 3. Connect using StartTls (REQUIRED for Port 2525)
                await smtp.ConnectAsync(host, port, SecureSocketOptions.StartTls);

                // 4. Authenticate
                var user = _config["Smtp:User"];
                var pass = _config["Smtp:Pass"];
                
                if (!string.IsNullOrEmpty(user) && !string.IsNullOrEmpty(pass))
                {
                    await smtp.AuthenticateAsync(user, pass);
                }

                await smtp.SendAsync(email);
                await smtp.DisconnectAsync(true);

                return true;
            }
            catch (Exception ex)
            {
                // Logs error to Render console so you can debug
                Console.WriteLine($"[EMAIL ERROR]: {ex.Message}");
                return false;
            }
        }
    }
}