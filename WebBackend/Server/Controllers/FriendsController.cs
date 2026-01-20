using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using StoryOfTime.Server.Data;
using StoryOfTime.Server.Models;
using StoryOfTime.Server.Hubs;
using Microsoft.AspNetCore.SignalR;
using System.Security.Claims;

namespace StoryOfTime.Server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class FriendsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IHubContext<CommunityHub> _hubContext;

        public FriendsController(ApplicationDbContext context, IHubContext<CommunityHub> hubContext)
        {
            _context = context;
            _hubContext = hubContext;
        }

        // POST: api/Friends/request/{addresseeId}
        [HttpPost("request/{addresseeId}")]
        public async Task<IActionResult> SendRequest(int addresseeId)
        {
            var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("id")?.Value;
            if (!int.TryParse(userIdStr, out int requesterId)) return Unauthorized();

            if (requesterId == addresseeId) return BadRequest("Cannot add yourself as friend.");

            var exists = await _context.Friendships
                .AnyAsync(f => (f.RequesterId == requesterId && f.AddresseeId == addresseeId) ||
                               (f.RequesterId == addresseeId && f.AddresseeId == requesterId));

            if (exists) return BadRequest("Friendship request already exists or you are already friends.");

            var friendship = new Friendship
            {
                RequesterId = requesterId,
                AddresseeId = addresseeId,
                Status = 0 // Pending
            };

            _context.Friendships.Add(friendship);
            await _context.SaveChangesAsync();

            // Notify Addressee
            var requester = await _context.Users.FindAsync(requesterId);
            if (requester != null)
            {
                await _hubContext.Clients.User(addresseeId.ToString()).SendAsync("ReceiveFriendRequest", new
                {
                    id = friendship.Id,
                    requester = new
                    {
                        id = requester.Id,
                        username = requester.Username,
                        nickname = requester.Nickname,
                        avatarUrl = requester.AvatarUrl
                    },
                    createdAt = DateTime.UtcNow
                });
            }

            return Ok(new { message = "Friend request sent." });
        }

        // POST: api/Friends/request-by-name/{username}
        [HttpPost("request-by-name/{username}")]
        public async Task<IActionResult> SendRequestByUsername(string username)
        {
            var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("id")?.Value;
            if (!int.TryParse(userIdStr, out int requesterId)) return Unauthorized();

            var addressee = await _context.Users.FirstOrDefaultAsync(u => u.Username == username);
            if (addressee == null) return NotFound("User not found.");

            if (requesterId == addressee.Id) return BadRequest("Cannot add yourself as friend.");

            var exists = await _context.Friendships
                .AnyAsync(f => (f.RequesterId == requesterId && f.AddresseeId == addressee.Id) ||
                               (f.RequesterId == addressee.Id && f.AddresseeId == requesterId));

            if (exists) return BadRequest("Friendship request already exists or you are already friends.");

            var friendship = new Friendship
            {
                RequesterId = requesterId,
                AddresseeId = addressee.Id,
                Status = 0 // Pending
            };

            _context.Friendships.Add(friendship);
            await _context.SaveChangesAsync();

            // Notify Addressee
            var requester = await _context.Users.FindAsync(requesterId);
            if (requester != null)
            {
                await _hubContext.Clients.User(addressee.Id.ToString()).SendAsync("ReceiveFriendRequest", new
                {
                    id = friendship.Id,
                    requester = new
                    {
                        id = requester.Id,
                        username = requester.Username,
                        nickname = requester.Nickname,
                        avatarUrl = requester.AvatarUrl
                    },
                    createdAt = DateTime.UtcNow
                });
            }

            return Ok(new { message = "Friend request sent." });
        }

        // POST: api/Friends/accept/{requesterId}
        [HttpPost("accept/{requesterId}")]
        public async Task<IActionResult> AcceptRequest(int requesterId)
        {
            var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("id")?.Value;
            if (!int.TryParse(userIdStr, out int userId)) return Unauthorized();

            var friendship = await _context.Friendships
                .FirstOrDefaultAsync(f => f.RequesterId == requesterId && f.AddresseeId == userId && f.Status == 0);

            if (friendship == null) return NotFound("Friend request not found.");

            friendship.Status = 1; // Accepted
            await _context.SaveChangesAsync();

            return Ok(new { message = "Friend request accepted." });
        }

        // DELETE: api/Friends/{friendId}
        [HttpDelete("{friendId}")]
        public async Task<IActionResult> RemoveFriend(int friendId)
        {
            var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("id")?.Value;
            if (!int.TryParse(userIdStr, out int userId)) return Unauthorized();

            var friendship = await _context.Friendships
                .FirstOrDefaultAsync(f => (f.RequesterId == userId && f.AddresseeId == friendId) ||
                                          (f.RequesterId == friendId && f.AddresseeId == userId));

            if (friendship == null) return NotFound("Friendship not found.");

            _context.Friendships.Remove(friendship);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        // GET: api/Friends/status/{otherUserId}
        [HttpGet("status/{otherUserId}")]
        public async Task<IActionResult> GetStatus(int otherUserId)
        {
            var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("id")?.Value;
            if (!int.TryParse(userIdStr, out int userId)) return Unauthorized();

            var friendship = await _context.Friendships
                .FirstOrDefaultAsync(f => (f.RequesterId == userId && f.AddresseeId == otherUserId) ||
                                          (f.RequesterId == otherUserId && f.AddresseeId == userId));

            string status = "None";
            if (friendship != null)
            {
                if (friendship.Status == 1) status = "Friend";
                else if (friendship.Status == 0)
                {
                    status = friendship.RequesterId == userId ? "RequestSent" : "RequestReceived";
                }
                else if (friendship.Status == 2) status = "Declined";
                else if (friendship.Status == 3) status = "Blocked";
            }

            return Ok(new { status });
        }

        // GET: api/Friends/pending
        [HttpGet("pending")]
        public async Task<ActionResult<IEnumerable<object>>> GetPendingRequests()
        {
            var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("id")?.Value;
            if (!int.TryParse(userIdStr, out int userId)) return Unauthorized();

            var threshold = DateTime.UtcNow.AddMinutes(-2);

            var requests = await _context.Friendships
                .Where(f => f.AddresseeId == userId && f.Status == 0)
                .Include(f => f.Requester)
                .Select(f => new
                {
                    f.Id,
                    Requester = new
                    {
                        f.Requester.Id,
                        f.Requester.Username,
                        f.Requester.Nickname,
                        f.Requester.AvatarUrl,
                        PreferredStatus = f.Requester.LastActiveAt > threshold ? f.Requester.PreferredStatus : 3
                    },
                    f.CreatedAt
                })
                .ToListAsync();

            return requests;
        }

        // GET: api/Friends
        [HttpGet]
        public async Task<ActionResult<IEnumerable<object>>> GetFriends()
        {
            var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("id")?.Value;
            if (!int.TryParse(userIdStr, out int userId)) return Unauthorized();

            var threshold = DateTime.UtcNow.AddMinutes(-2);

            var friends = await _context.Friendships
                .Where(f => (f.RequesterId == userId || f.AddresseeId == userId) && f.Status == 1)
                .Include(f => f.Requester)
                .Include(f => f.Addressee)
                .Select(f => f.RequesterId == userId ? f.Addressee : f.Requester)
                .Select(u => new
                {
                    u.Id,
                    u.Username,
                    u.Nickname,
                    u.AvatarUrl,
                    PreferredStatus = u.LastActiveAt > threshold ? u.PreferredStatus : 3
                })
                .ToListAsync();

            return friends;
        }
    }
}
