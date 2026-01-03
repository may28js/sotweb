using System.Net.Http.Headers;
using System.Text;
using System.Xml.Linq;
using Microsoft.EntityFrameworkCore;
using StoryOfTime.Server.Data;

namespace StoryOfTime.Server.Services
{
    public interface ISoapService
    {
        Task<bool> SendCommandAsync(string command);
    }

    public class SoapService : ISoapService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<SoapService> _logger;

        public SoapService(IServiceProvider serviceProvider, ILogger<SoapService> logger)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        public async Task<bool> SendCommandAsync(string command)
        {
            using var scope = _serviceProvider.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            
            // Get SOAP settings
            var settings = await context.GameServerSettings.FirstOrDefaultAsync();
            if (settings == null)
            {
                _logger.LogError("Game server settings not found.");
                return false;
            }

            try
            {
                var soapUrl = $"http://{settings.SoapHost}:{settings.SoapPort}/";
                var soapEnvelope = $@"<?xml version=""1.0"" encoding=""utf-8""?>
<SOAP-ENV:Envelope xmlns:SOAP-ENV=""http://schemas.xmlsoap.org/soap/envelope/"" xmlns:ns1=""urn:AC"">
  <SOAP-ENV:Body>
    <ns1:executeCommand>
      <command>{command}</command>
    </ns1:executeCommand>
  </SOAP-ENV:Body>
</SOAP-ENV:Envelope>";

                using var client = new HttpClient();
                
                // Basic Auth
                var authValue = Convert.ToBase64String(Encoding.ASCII.GetBytes($"{settings.SoapUsername}:{settings.SoapPassword}"));
                client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Basic", authValue);

                var content = new StringContent(soapEnvelope, Encoding.UTF8, "text/xml"); // AC expects text/xml
                
                _logger.LogInformation($"Sending SOAP command to {soapUrl}: {command}");
                
                var response = await client.PostAsync(soapUrl, content);
                var responseContent = await response.Content.ReadAsStringAsync();

                if (response.IsSuccessStatusCode)
                {
                    _logger.LogInformation($"SOAP Response: {responseContent}");
                    
                    // Parse response to check for execution errors if needed
                    // Usually AC returns the command output in the response body
                    
                    return true;
                }
                else
                {
                    _logger.LogError($"SOAP Request failed: {response.StatusCode} - {responseContent}");
                    return false;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error sending SOAP command");
                return false;
            }
        }
    }
}
