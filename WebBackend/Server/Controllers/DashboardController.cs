using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using StoryOfTime.Server.Data;
using StoryOfTime.Server.Models;
using StoryOfTime.Server.Services;

namespace StoryOfTime.Server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class DashboardController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IGameServerService _gameServerService;

        public DashboardController(ApplicationDbContext context, IGameServerService gameServerService)
        {
            _context = context;
            _gameServerService = gameServerService;
        }

        [HttpGet("stats")]
        public async Task<ActionResult<DashboardStatsDto>> GetStats()
        {
            var accessLevelClaim = User.FindFirst("AccessLevel");
            if (accessLevelClaim == null || int.Parse(accessLevelClaim.Value) < 1)
            {
                return Forbid();
            }

            var totalUsers = await _context.Users.CountAsync();
            var totalNews = await _context.News.CountAsync();
            var totalComments = await _context.Comments.CountAsync();
            var totalOrders = await _context.ShopOrders.CountAsync();
            
            var recentUsers = await _context.Users
                .OrderByDescending(u => u.CreatedAt)
                .Take(5)
                .Select(u => new DashboardUserDto { 
                    Id = u.Id, 
                    Username = u.Username, 
                    Email = u.Email,
                    CreatedAt = u.CreatedAt
                })
                .ToListAsync();

            return new DashboardStatsDto
            {
                TotalUsers = totalUsers,
                TotalNews = totalNews,
                TotalComments = totalComments,
                TotalOrders = totalOrders,
                RecentUsers = recentUsers
            };
        }
        [HttpGet("server/status")]
        public async Task<ActionResult<ServerStatusDto>> GetServerStatus()
        {
            return await _gameServerService.GetStatusAsync();
        }

        [HttpGet("server/history")]
        public async Task<ActionResult<List<OnlineHistoryDto>>> GetOnlineHistory([FromQuery] string period = "24h")
        {
            return await _gameServerService.GetHistoryAsync(period);
        }

        [HttpPost("server/control")]
        public async Task<IActionResult> ControlServer([FromBody] ServerControlDto control)
        {
            var accessLevelClaim = User.FindFirst("AccessLevel");
            if (accessLevelClaim == null || int.Parse(accessLevelClaim.Value) < 2) // Only Admins (Level 2+)
            {
                return Forbid();
            }

            var success = await _gameServerService.ControlServerAsync(control.Action);
            if (success)
            {
                 return Ok(new { message = $"Server {control.Action} command sent." });
            }
            return BadRequest(new { message = "Command failed." });
        }
    }

    public class DashboardStatsDto
    {
        public int TotalUsers { get; set; }
        public int TotalNews { get; set; }
        public int TotalComments { get; set; }
        public int TotalOrders { get; set; }
        public List<DashboardUserDto> RecentUsers { get; set; }
    }
    
    public class DashboardUserDto {
        public int Id { get; set; }
        public string Username { get; set; }
        public string Email { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class ServerStatusDto
    {
        public string Status { get; set; }
        public int CpuUsage { get; set; }
        public int MemoryUsage { get; set; }
        public int OnlinePlayers { get; set; }
        public int MaxPlayers { get; set; }
        public string Uptime { get; set; }
    }

    public class OnlineHistoryDto
    {
        public string Time { get; set; }
        public int? Players { get; set; }
    }

    public class ServerControlDto
    {
        public string Action { get; set; }
    }
}
