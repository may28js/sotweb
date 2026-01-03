using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using StoryOfTime.Server.Data;
using StoryOfTime.Server.Models;

namespace StoryOfTime.Server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class GameSettingsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public GameSettingsController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/GameSettings
        [HttpGet]
        public async Task<ActionResult<GameServerSetting>> GetSettings()
        {
            // Check Access Level (Admin or Owner only)
            var accessLevelClaim = User.FindFirst("AccessLevel");
            if (accessLevelClaim == null || !int.TryParse(accessLevelClaim.Value, out int level))
            {
                return Forbid();
            }

            if (level != StoryOfTime.Server.Models.User.Level_Admin && level != StoryOfTime.Server.Models.User.Level_Owner)
            {
                return Forbid();
            }

            var settings = await _context.GameServerSettings.FirstOrDefaultAsync();
            if (settings == null)
            {
                // Return default/empty settings if not configured
                return new GameServerSetting();
            }

            // Security: Mask passwords when sending to client
            settings.Password = "********";
            settings.SoapPassword = "********";

            return settings;
        }

        // POST: api/GameSettings
        [HttpPost]
        public async Task<ActionResult<GameServerSetting>> SaveSettings(GameServerSetting settings)
        {
            // Check Access Level (Admin or Owner only)
            var accessLevelClaim = User.FindFirst("AccessLevel");
            if (accessLevelClaim == null || !int.TryParse(accessLevelClaim.Value, out int level))
            {
                return Forbid();
            }

            if (level != StoryOfTime.Server.Models.User.Level_Admin && level != StoryOfTime.Server.Models.User.Level_Owner)
            {
                return Forbid();
            }

            var existingSettings = await _context.GameServerSettings.FirstOrDefaultAsync();
            
            if (existingSettings == null)
            {
                _context.GameServerSettings.Add(settings);
            }
            else
            {
                existingSettings.Host = settings.Host;
                existingSettings.Port = settings.Port;
                existingSettings.Username = settings.Username;
                existingSettings.AuthDatabase = settings.AuthDatabase;
                existingSettings.CharactersDatabase = settings.CharactersDatabase;
                
                // Only update password if it's not the mask
                if (settings.Password != "********")
                {
                    existingSettings.Password = settings.Password;
                }

                existingSettings.SoapHost = settings.SoapHost;
                existingSettings.SoapPort = settings.SoapPort;
                existingSettings.SoapUsername = settings.SoapUsername;

                if (settings.SoapPassword != "********")
                {
                    existingSettings.SoapPassword = settings.SoapPassword;
                }
            }

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }

            return Ok(settings);
        }

        // POST: api/GameSettings/Test
        [HttpPost("Test")]
        public async Task<IActionResult> TestConnection(GameServerSetting settings)
        {
            // Check Access Level
            var accessLevelClaim = User.FindFirst("AccessLevel");
            if (accessLevelClaim == null || int.Parse(accessLevelClaim.Value) < 10)
            {
                return Forbid();
            }

            // If passwords are masked, fetch from DB
            if (settings.Password == "********" || settings.SoapPassword == "********")
            {
                var dbSettings = await _context.GameServerSettings.FirstOrDefaultAsync();
                if (dbSettings != null)
                {
                    if (settings.Password == "********") settings.Password = dbSettings.Password;
                    if (settings.SoapPassword == "********") settings.SoapPassword = dbSettings.SoapPassword;
                }
            }

            var results = new { Database = "Pending", Soap = "Pending", Message = "" };
            
            // 1. Test Database Connection
            try 
            {
                var connectionString = $"Server={settings.Host};Port={settings.Port};Database={settings.AuthDatabase};User={settings.Username};Password={settings.Password};";
                
                // Use a transient DbContext or raw connection to test
                // Here we use MySqlConnector directly for a lightweight test
                using var connection = new MySqlConnector.MySqlConnection(connectionString);
                await connection.OpenAsync();
                
                // Verify by counting accounts
                using var command = connection.CreateCommand();
                command.CommandText = "SELECT COUNT(*) FROM account";
                var count = await command.ExecuteScalarAsync();

                results = new { Database = "Success", Soap = "Pending", Message = $"Database Connected. Account Count: {count}" };
            }
            catch (Exception ex)
            {
                return Ok(new { Database = "Failed", Soap = "Skipped", Message = $"Database Error: {ex.Message}" });
            }

            // 2. Test SOAP Connection (Real Request)
            try
            {
                var auth = Convert.ToBase64String(System.Text.Encoding.ASCII.GetBytes($"{settings.SoapUsername}:{settings.SoapPassword}"));
                var requestXml = @"<?xml version=""1.0"" encoding=""utf-8""?>
<SOAP-ENV:Envelope xmlns:SOAP-ENV=""http://schemas.xmlsoap.org/soap/envelope/"" xmlns:ns1=""urn:TC"">
<SOAP-ENV:Body>
<ns1:executeCommand>
<command>.server info</command>
</ns1:executeCommand>
</SOAP-ENV:Body>
</SOAP-ENV:Envelope>";

                using var client = new HttpClient();
                client.Timeout = TimeSpan.FromSeconds(5);
                var request = new HttpRequestMessage(HttpMethod.Post, $"http://{settings.SoapHost}:{settings.SoapPort}/")
                {
                    Content = new StringContent(requestXml, System.Text.Encoding.UTF8, "text/xml")
                };
                request.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Basic", auth);

                var response = await client.SendAsync(request);
                
                if (response.IsSuccessStatusCode)
                {
                    var responseString = await response.Content.ReadAsStringAsync();
                    // Simple parsing to extract command output if needed, or just success
                    // The response is usually XML wrapped, let's just indicate success
                    results = new { Database = "Success", Soap = "Success", Message = $"All Connections Successful. DB Accounts: {results.Message.Split(':').Last().Trim()}. SOAP Response: OK" };
                }
                else
                {
                    results = new { Database = "Success", Soap = "Failed", Message = $"SOAP HTTP Error: {response.StatusCode}" };
                }
            }
            catch (Exception ex)
            {
                results = new { Database = "Success", Soap = "Failed", Message = $"SOAP Error: {ex.Message}" };
            }

            return Ok(results);
        }
    }
}
