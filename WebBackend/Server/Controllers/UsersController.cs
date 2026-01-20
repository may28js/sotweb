using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using StoryOfTime.Server.Data;
using StoryOfTime.Server.Models;
using StoryOfTime.Server.DTOs;
using System.Security.Claims;
using Microsoft.Extensions.Caching.Memory;

namespace StoryOfTime.Server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class UsersController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly Microsoft.Extensions.Caching.Memory.IMemoryCache _cache;

        public UsersController(ApplicationDbContext context, Microsoft.Extensions.Caching.Memory.IMemoryCache cache)
        {
            _context = context;
            _cache = cache;
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
                CreatedAt = u.CreatedAt,
                AvatarUrl = u.AvatarUrl
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

        // PUT: api/Users/avatar
        [HttpPut("avatar")]
        public async Task<IActionResult> UpdateAvatar([FromBody] UpdateAvatarDto request)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier) ?? User.FindFirst("nameid");
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId)) return Unauthorized();

            var user = await _context.Users.FindAsync(userId);
            if (user == null) return NotFound();

            user.AvatarUrl = request.AvatarUrl;
            await _context.SaveChangesAsync();

            return Ok(new { message = "Avatar updated successfully", avatarUrl = user.AvatarUrl });
        }

        // GET: api/Users/profile/{userId?}
        [HttpGet("profile/{userId?}")]
        public async Task<ActionResult<UserProfileDto>> GetProfile(int? userId = null)
        {
            if (userId == null)
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier) ?? User.FindFirst("nameid");
                if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int id)) return Unauthorized();
                userId = id;
            }

            var user = await _context.Users
                .Include(u => u.CommunityRoles)
                .ThenInclude(ur => ur.CommunityRole)
                .FirstOrDefaultAsync(u => u.Id == userId);
                
            if (user == null) return NotFound();

            var allRoles = await _cache.GetOrCreateAsync("CommunityRoles", async entry =>
            {
                entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(10);
                return await _context.CommunityRoles.OrderByDescending(r => r.SortOrder).ToListAsync();
            }) ?? new List<CommunityRole>();

            string roleColor = GetUserRoleColor(user, allRoles);

            return new UserProfileDto
            {
                Id = user.Id,
                Username = user.Username,
                Nickname = user.Nickname,
                AboutMe = user.AboutMe,
                AvatarUrl = user.AvatarUrl,
                PreferredStatus = user.PreferredStatus,
                RoleColor = roleColor,
                CreatedAt = user.CreatedAt
            };
        }

        private string GetUserRoleColor(User user, List<CommunityRole> allRoles)
        {
            if (user == null) return "#ffffff";
            
            var userRoleIds = user.CommunityRoles?.Select(ur => ur.CommunityRoleId).ToList() ?? new List<int>();
            
            // Combine Explicit Roles and Implicit System Roles (based on AccessLevel)
            var effectiveRoles = allRoles
                .Where(r => userRoleIds.Contains(r.Id) || (r.AccessLevel.HasValue && r.AccessLevel == user.AccessLevel))
                .OrderByDescending(r => r.SortOrder)
                .ToList();

            var topRole = effectiveRoles.FirstOrDefault();
            return topRole?.Color ?? "#ffffff";
        }

        // PUT: api/Users/profile
        [HttpPut("profile")]
        public async Task<IActionResult> UpdateProfile([FromBody] UpdateUserProfileDto request)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier) ?? User.FindFirst("nameid");
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId)) return Unauthorized();

            var user = await _context.Users.FindAsync(userId);
            if (user == null) return NotFound();

            if (request.Nickname != null) user.Nickname = request.Nickname;
            if (request.AboutMe != null) user.AboutMe = request.AboutMe;
            if (request.AvatarUrl != null) user.AvatarUrl = request.AvatarUrl;
            if (request.PreferredStatus.HasValue) user.PreferredStatus = request.PreferredStatus.Value;

            await _context.SaveChangesAsync();

            // Fetch roles to calculate RoleColor
            // We need to reload CommunityRoles to be safe, but since this is just profile update (name/bio),
            // roles likely didn't change. But we need to call GetUserRoleColor which needs CommunityRoles loaded on user.
            // _context.Users.FindAsync doesn't include related data.
            // We can explicitly load it or just re-fetch.
            
            await _context.Entry(user).Collection(u => u.CommunityRoles).LoadAsync();
            foreach (var cr in user.CommunityRoles)
            {
                await _context.Entry(cr).Reference(r => r.CommunityRole).LoadAsync();
            }

            var allRoles = await _cache.GetOrCreateAsync("CommunityRoles", async entry =>
            {
                entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(10);
                return await _context.CommunityRoles.OrderByDescending(r => r.SortOrder).ToListAsync();
            }) ?? new List<CommunityRole>();

            string roleColor = GetUserRoleColor(user, allRoles);

            return Ok(new { message = "Profile updated successfully", profile = new UserProfileDto
            {
                Id = user.Id,
                Username = user.Username,
                Nickname = user.Nickname,
                AboutMe = user.AboutMe,
                AvatarUrl = user.AvatarUrl,
                PreferredStatus = user.PreferredStatus,
                RoleColor = roleColor,
                CreatedAt = user.CreatedAt
            }});
        }
    }

    public class UpdateAvatarDto
    {
        public string AvatarUrl { get; set; } = string.Empty;
    }
}
