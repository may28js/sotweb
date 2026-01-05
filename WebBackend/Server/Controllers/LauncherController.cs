using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using StoryOfTime.Server.Data;
using StoryOfTime.Server.Services;
using StoryOfTime.Server.DTOs;

namespace StoryOfTime.Server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class LauncherController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IGameServerService _gameServerService;

        public LauncherController(ApplicationDbContext context, IGameServerService gameServerService)
        {
            _context = context;
            _gameServerService = gameServerService;
        }

        [HttpGet("config")]
        public async Task<ActionResult<LauncherConfigDto>> GetConfig()
        {
            var settings = await _context.GameServerSettings.FirstOrDefaultAsync();
            
            // Use Host from DB settings if available, otherwise use default/fallback
            // Ideally this should be the public IP/Domain of the game server
            string realmlist = !string.IsNullOrEmpty(settings?.Host) ? settings.Host : "38.55.125.89"; 
            
            return new LauncherConfigDto
            {
                Realmlist = realmlist,
                WebsiteUrl = "https://shiguanggushi.xyz",
                RegisterUrl = "https://shiguanggushi.xyz/register",
                LatestVersion = "1.0.0", 
                DownloadUrl = "https://shiguanggushi.xyz/download/launcher.zip" 
            };
        }

        [HttpGet("status")]
        public async Task<ActionResult<ServerStatusDto>> GetStatus()
        {
            return await _gameServerService.GetStatusAsync();
        }
    }

    public class LauncherConfigDto
    {
        public string Realmlist { get; set; } = "";
        public string WebsiteUrl { get; set; } = "";
        public string RegisterUrl { get; set; } = "";
        public string LatestVersion { get; set; } = "";
        public string DownloadUrl { get; set; } = "";
    }
}
