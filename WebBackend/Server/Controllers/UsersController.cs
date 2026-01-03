using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using StoryOfTime.Server.Data;
using StoryOfTime.Server.Models;
using System.Security.Claims;

namespace StoryOfTime.Server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class UsersController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public UsersController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/Users
        [HttpGet]
        public async Task<ActionResult<IEnumerable<User>>> GetUsers()
        {
            var accessLevelClaim = User.FindFirst("AccessLevel");
            if (accessLevelClaim == null || !int.TryParse(accessLevelClaim.Value, out int level) || level < StoryOfTime.Server.Models.User.Level_Moderator)
            {
                return Forbid();
            }

            return await _context.Users.Select(u => new User { 
                Id = u.Id,
                Username = u.Username,
                Email = u.Email,
                AccessLevel = u.AccessLevel,
                Points = u.Points,
                // PasswordHash is NOT returned
            }).ToListAsync();
        }

        // POST: api/Users/5/access-level
        [HttpPost("{id}/access-level")]
        public async Task<IActionResult> ChangeAccessLevel(int id, [FromBody] int newLevel)
        {
            var accessLevelClaim = User.FindFirst("AccessLevel");
            if (accessLevelClaim == null || !int.TryParse(accessLevelClaim.Value, out int level)) return Forbid();

            // Only Owner (Level 4) can change access levels
            if (level != StoryOfTime.Server.Models.User.Level_Owner)
            {
                return Forbid();
            }

            var user = await _context.Users.FindAsync(id);
            if (user == null) return NotFound();

            user.AccessLevel = newLevel;
            await _context.SaveChangesAsync();

            return Ok(new { message = $"User {user.Username} access level updated to {newLevel}" });
        }

        // POST: api/Users/5/points
        [HttpPost("{id}/points")]
        public async Task<IActionResult> ModifyPoints(int id, [FromBody] decimal amount)
        {
            var accessLevelClaim = User.FindFirst("AccessLevel");
            if (accessLevelClaim == null || !int.TryParse(accessLevelClaim.Value, out int level)) return Forbid();

            // Only Admin (Level 2) or Owner (Level 4) can modify points
            if (level != StoryOfTime.Server.Models.User.Level_Admin && level != StoryOfTime.Server.Models.User.Level_Owner)
            {
                return Forbid();
            }

            var user = await _context.Users.FindAsync(id);
            if (user == null) return NotFound();

            user.Points += amount;
            
            // Log this action
            _context.UserPointLogs.Add(new UserPointLog
            {
                UserId = user.Id,
                Amount = amount,
                Source = $"Admin Adjustment by {User.Identity?.Name}",
                CreatedAt = DateTime.UtcNow
            });

            await _context.SaveChangesAsync();

            return Ok(new { message = $"User {user.Username} points updated. New Balance: {user.Points}" });
        }
    }
}
