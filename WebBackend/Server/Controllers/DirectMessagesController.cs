using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using StoryOfTime.Server.Data;
using StoryOfTime.Server.Models;
using StoryOfTime.Server.Services;
using StoryOfTime.Server.Hubs;
using Microsoft.AspNetCore.SignalR;
using System.Security.Claims;
using System.Text.Json;

namespace StoryOfTime.Server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class DirectMessagesController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IOEmbedService _oEmbedService;

        public DirectMessagesController(ApplicationDbContext context, IOEmbedService oEmbedService)
        {
            _context = context;
            _oEmbedService = oEmbedService;
        }

        // GET: api/DirectMessages/{otherUserId}
        [HttpGet("{otherUserId}")]
        public async Task<ActionResult<IEnumerable<object>>> GetMessages(int otherUserId)
        {
            var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("id")?.Value;
            if (!int.TryParse(userIdStr, out int userId)) return Unauthorized();

            var messages = await _context.DirectMessages
                .Where(m => (m.SenderId == userId && m.ReceiverId == otherUserId) ||
                            (m.SenderId == otherUserId && m.ReceiverId == userId))
                .OrderBy(m => m.CreatedAt)
                .ToListAsync();

            var result = messages.Select(m => new
            {
                m.Id,
                m.SenderId,
                m.ReceiverId,
                m.Content,
                m.CreatedAt,
                m.IsRead,
                Embeds = SafeDeserializeEmbeds(m.Embeds)
            });

            return Ok(result);
        }

        private List<EmbedData> SafeDeserializeEmbeds(string? json)
        {
            if (string.IsNullOrEmpty(json)) return new List<EmbedData>();
            try
            {
                return JsonSerializer.Deserialize<List<EmbedData>>(json, (JsonSerializerOptions?)null) ?? new List<EmbedData>();
            }
            catch
            {
                return new List<EmbedData>();
            }
        }

        // GET: api/DirectMessages/conversations
        [HttpGet("conversations")]
        public async Task<ActionResult<IEnumerable<object>>> GetConversations()
        {
            var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("id")?.Value;
            if (!int.TryParse(userIdStr, out int userId)) return Unauthorized();

            // This query might be complex for EF Core translation depending on version, 
            // so we might need to do some client-side grouping if server-side fails, 
            // but let's try a standard approach.
            // We want distinct users we've talked to.

            var sentTo = await _context.DirectMessages
                .Where(m => m.SenderId == userId)
                .Select(m => m.ReceiverId)
                .Distinct()
                .ToListAsync();

            var receivedFrom = await _context.DirectMessages
                .Where(m => m.ReceiverId == userId)
                .Select(m => m.SenderId)
                .Distinct()
                .ToListAsync();

            var userIds = sentTo.Union(receivedFrom).Distinct().ToList();

            var threshold = DateTime.UtcNow.AddMinutes(-2);

            var users = await _context.Users
                .Where(u => userIds.Contains(u.Id))
                .Select(u => new
                {
                    u.Id,
                    u.Username,
                    u.Nickname,
                    u.AvatarUrl,
                    PreferredStatus = u.LastActiveAt > threshold ? u.PreferredStatus : 3,
                    UnreadCount = _context.DirectMessages.Count(m => m.SenderId == u.Id && m.ReceiverId == userId && !m.IsRead)
                })
                .ToListAsync();

            return users;
        }

        // GET: api/DirectMessages/unread-count
        [HttpGet("unread-count")]
        public async Task<ActionResult<object>> GetUnreadCount()
        {
            var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("id")?.Value;
            if (!int.TryParse(userIdStr, out int userId)) return Unauthorized();

            var count = await _context.DirectMessages
                .CountAsync(m => m.ReceiverId == userId && !m.IsRead);

            return new { count };
        }

        // POST: api/DirectMessages/mark-read/{senderId}
        [HttpPost("mark-read/{senderId}")]
        public async Task<IActionResult> MarkMessagesAsRead(int senderId)
        {
            var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("id")?.Value;
            if (!int.TryParse(userIdStr, out int userId)) return Unauthorized();

            var messages = await _context.DirectMessages
                .Where(m => m.SenderId == senderId && m.ReceiverId == userId && !m.IsRead)
                .ToListAsync();

            if (messages.Any())
            {
                foreach (var msg in messages)
                {
                    msg.IsRead = true;
                }
                await _context.SaveChangesAsync();
            }

            return Ok(new { message = "Messages marked as read." });
        }

        // POST: api/DirectMessages
        [HttpPost]
        public async Task<IActionResult> SendMessage([FromBody] CreateDmDto request)
        {
            var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("id")?.Value;
            if (!int.TryParse(userIdStr, out int userId)) return Unauthorized();

            if (userId == request.ReceiverId) return BadRequest("Cannot send message to yourself.");

            string? embedsJson = null;
            if (!string.IsNullOrWhiteSpace(request.Content))
            {
                try 
                {
                    var embedsList = await _oEmbedService.ProcessContentAsync(request.Content);
                    if (embedsList.Any())
                    {
                        embedsJson = JsonSerializer.Serialize(embedsList);
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"[SendMessage] Embed processing failed: {ex.Message}");
                    // Continue without embeds
                }
            }

            var message = new DirectMessage
            {
                SenderId = userId,
                ReceiverId = request.ReceiverId,
                Content = request.Content,
                Embeds = embedsJson
            };

            _context.DirectMessages.Add(message);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Message sent.", data = message });
        }
    }

    public class CreateDmDto
    {
        public int ReceiverId { get; set; }
        public string Content { get; set; } = string.Empty;
    }
}
