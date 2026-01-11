using MailKit.Net.Smtp;
using MimeKit;
using Microsoft.Extensions.Options;

namespace StoryOfTime.Server.Services
{
    public class EmailSettings
    {
        public string SmtpServer { get; set; } = string.Empty;
        public int SmtpPort { get; set; } = 587;
        public string SenderName { get; set; } = "Story Of Time";
        public string SenderEmail { get; set; } = string.Empty;
        public string SenderPassword { get; set; } = string.Empty;
        public bool EnableSsl { get; set; } = true;
    }

    public interface IEmailService
    {
        Task SendEmailAsync(string toEmail, string subject, string body);
    }

    public class SmtpEmailService : IEmailService
    {
        private readonly EmailSettings _settings;
        private readonly ILogger<SmtpEmailService> _logger;

        public SmtpEmailService(IOptions<EmailSettings> settings, ILogger<SmtpEmailService> logger)
        {
            _settings = settings.Value;
            _logger = logger;
        }

        public async Task SendEmailAsync(string toEmail, string subject, string body)
        {
            try
            {
                var message = new MimeMessage();
                message.From.Add(new MailboxAddress(_settings.SenderName, _settings.SenderEmail));
                message.To.Add(MailboxAddress.Parse(toEmail));
                message.Subject = subject;

                var bodyBuilder = new BodyBuilder { HtmlBody = body };
                message.Body = bodyBuilder.ToMessageBody();

                using var client = new SmtpClient();
                // For demo/dev purposes, accept all SSL certificates (in production, use valid certs)
                client.ServerCertificateValidationCallback = (s, c, h, e) => true;

                await client.ConnectAsync(_settings.SmtpServer, _settings.SmtpPort, _settings.EnableSsl);
                
                // Note: handling authentication
                if (!string.IsNullOrEmpty(_settings.SenderPassword))
                {
                     await client.AuthenticateAsync(_settings.SenderEmail, _settings.SenderPassword);
                }

                await client.SendAsync(message);
                await client.DisconnectAsync(true);
                
                _logger.LogInformation($"Email sent to {toEmail} successfully.");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Failed to send email to {toEmail}");
                throw; // Re-throw to let controller handle it
            }
        }
    }
}
