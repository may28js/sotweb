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
    public class SettingsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public SettingsController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet("game")]
        public async Task<ActionResult<GameServerSetting>> GetGameSettings()
        {
            var accessLevelClaim = User.FindFirst("AccessLevel");
            if (accessLevelClaim == null || int.Parse(accessLevelClaim.Value) < 2) // Admin only
            {
                return Forbid();
            }
            
            var settings = await _context.GameServerSettings.FirstOrDefaultAsync();
            if (settings == null)
            {
                // Return default/empty settings instead of 404 to allow creating
                return new GameServerSetting();
            }
            return settings;
        }

        [HttpPost("game")]
        public async Task<IActionResult> UpdateGameSettings([FromBody] GameServerSetting newSettings)
        {
            var accessLevelClaim = User.FindFirst("AccessLevel");
            if (accessLevelClaim == null || int.Parse(accessLevelClaim.Value) < 2) // Admin only
            {
                return Forbid();
            }

            try
            {
                var existingSettings = await _context.GameServerSettings.FirstOrDefaultAsync();
                if (existingSettings == null)
                {
                    _context.GameServerSettings.Add(newSettings);
                }
                else
                {
                    // Update existing
                    existingSettings.Host = newSettings.Host;
                    existingSettings.Port = newSettings.Port;
                    existingSettings.Username = newSettings.Username;
                    existingSettings.Password = newSettings.Password;
                    existingSettings.AuthDatabase = newSettings.AuthDatabase;
                    existingSettings.CharactersDatabase = newSettings.CharactersDatabase;
                    
                    existingSettings.SoapHost = newSettings.SoapHost;
                    existingSettings.SoapPort = newSettings.SoapPort;
                    existingSettings.SoapUsername = newSettings.SoapUsername;
                    existingSettings.SoapPassword = newSettings.SoapPassword;

                    existingSettings.SshHost = newSettings.SshHost;
                    existingSettings.SshPort = newSettings.SshPort;
                    existingSettings.SshUsername = newSettings.SshUsername;
                    existingSettings.SshPassword = newSettings.SshPassword;
                    existingSettings.WorldServiceName = newSettings.WorldServiceName;
                    existingSettings.AuthServiceName = newSettings.AuthServiceName;
                }

                await _context.SaveChangesAsync();

                return Ok(new { message = "Settings updated successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error updating settings: {ex.Message}");
            }
        }
    }
}
