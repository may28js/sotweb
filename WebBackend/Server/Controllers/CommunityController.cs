using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using StoryOfTime.Server.Data;
using StoryOfTime.Server.Models;
using StoryOfTime.Server.Services;
using Microsoft.Extensions.Caching.Memory;
using System.Text.Json;
using Microsoft.AspNetCore.SignalR;
using StoryOfTime.Server.Hubs;
using StoryOfTime.Server.DTOs;

namespace StoryOfTime.Server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CommunityController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly Microsoft.Extensions.Caching.Memory.IMemoryCache _cache;
        private readonly IOEmbedService _oEmbedService;
        private readonly IHubContext<CommunityHub> _hubContext;

        public CommunityController(ApplicationDbContext context, Microsoft.Extensions.Caching.Memory.IMemoryCache cache, IOEmbedService oEmbedService, IHubContext<CommunityHub> hubContext)
        {
            _context = context;
            _cache = cache;
            _oEmbedService = oEmbedService;
            _hubContext = hubContext;
        }

        // ... [Existing Channel Methods] ...

        [HttpGet("notification-status")]
        [Authorize]
        public async Task<ActionResult<object>> GetNotificationStatus()
        {
            var userIdStr = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value 
                         ?? User.FindFirst("id")?.Value;
            if (!int.TryParse(userIdStr, out int userId)) return Unauthorized();

            var user = await _context.Users.FindAsync(userId);
            if (user == null) return NotFound();

            var settings = await _context.CommunitySettings.FirstOrDefaultAsync();
            if (settings == null) return Ok(new { hasUnreadGlobal = false });

            bool hasUnread = settings.LastGlobalNotifyAt > user.LastReadGlobalNotifyAt;

            return Ok(new { hasUnreadGlobal = hasUnread });
        }

        [HttpPost("mark-global-read")]
        [Authorize]
        public async Task<IActionResult> MarkGlobalRead()
        {
            var userIdStr = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value 
                         ?? User.FindFirst("id")?.Value;
            if (!int.TryParse(userIdStr, out int userId)) return Unauthorized();

            var user = await _context.Users.FindAsync(userId);
            if (user == null) return NotFound();

            user.LastReadGlobalNotifyAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return Ok();
        }

        [HttpGet("channels")]
        public async Task<ActionResult<IEnumerable<Channel>>> GetChannels()
        {
            var channels = await _context.Channels
                .OrderBy(c => c.SortOrder)
                .Include(c => c.PermissionOverrides)
                .ToListAsync();
            
            // If user is logged in, populate unread counts
            var userIdStr = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value 
                         ?? User.FindFirst("id")?.Value;
            
            if (int.TryParse(userIdStr, out int userId))
            {
                var userStates = await _context.UserChannelStates
                    .Where(ucs => ucs.UserId == userId)
                    .ToListAsync();
                
                foreach (var channel in channels)
                {
                    var state = userStates.FirstOrDefault(s => s.ChannelId == channel.Id);
                    if (state != null)
                    {
                        channel.UnreadCount = state.UnreadMentionCount;
                        channel.HasUnread = channel.LastActivityAt > state.LastReadAt;
                    }
                    else
                    {
                        // If no state (never read), and channel has activity (not just created empty)
                        // Assume unread if it has any activity.
                        // But wait, if it is a newly created channel, user hasn't read it.
                        // So HasUnread = true is correct.
                        channel.HasUnread = true;
                    }
                }
            }

            return channels;
        }

        private string GetUserRoleColor(User? user, List<CommunityRole> allRoles)
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

        [HttpGet("channels/{channelId}/messages")]
        public async Task<ActionResult<IEnumerable<object>>> GetMessages(int channelId, int limit = 50)
        {
            var allRoles = await _cache.GetOrCreateAsync("CommunityRoles", async entry =>
            {
                entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(10);
                return await _context.CommunityRoles.OrderByDescending(r => r.SortOrder).ToListAsync();
            }) ?? new List<CommunityRole>();

            var messages = await _context.Messages
                .Where(m => m.ChannelId == channelId && m.PostId == null) // Only chat messages, not post replies
                .OrderByDescending(m => m.CreatedAt)
                .Take(limit)
                .Include(m => m.User)
                .ThenInclude(u => u.CommunityRoles)
                .Include(m => m.ReplyTo).ThenInclude(r => r.User)
                .Include(m => m.Reactions)
                .ToListAsync();

            var result = messages.Select(m => MapMessage(m, allRoles)).OrderBy(m => ((dynamic)m).createdAt).ToList();

            return Ok(result);
        }

        private object MapMessage(Message m, List<CommunityRole> allRoles)
        {
            List<string> attachmentUrls = new List<string>();
            if (!string.IsNullOrEmpty(m.AttachmentUrls))
            {
                try 
                {
                    if (m.AttachmentUrls.TrimStart().StartsWith("["))
                    {
                        attachmentUrls = System.Text.Json.JsonSerializer.Deserialize<List<string>>(m.AttachmentUrls) ?? new List<string>();
                    }
                    else
                    {
                         // Backward compatibility for single URL string
                         attachmentUrls.Add(m.AttachmentUrls);
                    }
                }
                catch 
                {
                    // Fallback if JSON is invalid but string exists
                    attachmentUrls.Add(m.AttachmentUrls);
                }
            }

            var replyToObj = m.ReplyTo != null ? new 
            {
                id = m.ReplyTo.Id,
                username = m.ReplyTo.User?.Username ?? "Unknown",
                nickname = m.ReplyTo.User?.Nickname,
                content = m.ReplyTo.Content,
                userId = m.ReplyTo.UserId,
                avatarUrl = m.ReplyTo.User?.AvatarUrl,
                accessLevel = m.ReplyTo.User?.AccessLevel,
                attachmentUrls = !string.IsNullOrEmpty(m.ReplyTo.AttachmentUrls) ? (
                    m.ReplyTo.AttachmentUrls.TrimStart().StartsWith("[") ? 
                    System.Text.Json.JsonSerializer.Deserialize<List<string>>(m.ReplyTo.AttachmentUrls) : 
                    new List<string> { m.ReplyTo.AttachmentUrls }
                ) : new List<string>()
            } : null;

            // Calculate Role Color
            string? roleColor = GetUserRoleColor(m.User, allRoles);

            return new 
            {
                id = m.Id,
                channelId = m.ChannelId,
                postId = m.PostId,
                userId = m.UserId,
                user = new 
                {
                    id = m.UserId,
                    username = m.User?.Username ?? "Unknown",
                    nickname = m.User?.Nickname,
                    avatarUrl = m.User?.AvatarUrl,
                    accessLevel = m.User?.AccessLevel
                },
                roleColor = roleColor,
                content = m.Content,
                attachmentUrls = attachmentUrls,
                embeds = SafeDeserializeEmbeds(m.Embeds),
                replyTo = replyToObj,
                reactions = m.Reactions?.Select(r => (object)new {
                    messageId = r.MessageId,
                    userId = r.UserId,
                    emoji = r.Emoji
                }).ToList() ?? new List<object>(),
                createdAt = m.CreatedAt
            };
        }

        [HttpGet("channels/{channelId}/posts")]
        public async Task<ActionResult<IEnumerable<object>>> GetPosts(int channelId)
        {
            var userIdStr = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value 
                         ?? User.FindFirst("id")?.Value;
            int.TryParse(userIdStr, out int userId);

            var allRoles = await _cache.GetOrCreateAsync("CommunityRoles", async entry =>
            {
                entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(10);
                return await _context.CommunityRoles.OrderByDescending(r => r.SortOrder).ToListAsync();
            }) ?? new List<CommunityRole>();

             var posts = await _context.Posts
                .Where(p => p.ChannelId == channelId)
                .OrderByDescending(p => p.LastActivityAt)
                .Include(p => p.Author)
                .ThenInclude(u => u.CommunityRoles)
                .ToListAsync();

            var postIds = posts.Select(p => p.Id).ToList();
            var readStates = await _context.UserPostStates
                .Where(ups => ups.UserId == userId && postIds.Contains(ups.PostId))
                .ToListAsync();

            // To fix MessageCount without N+1:
            // We can fetch MessageCounts separately.
            var messageCounts = await _context.Messages
                .Where(m => m.PostId.HasValue && postIds.Contains(m.PostId.Value))
                .GroupBy(m => m.PostId)
                .Select(g => new { PostId = g.Key, Count = g.Count() })
                .ToDictionaryAsync(x => x.PostId!.Value, x => x.Count);
                
            var reactions = await _context.PostReactions
                .Where(r => postIds.Contains(r.PostId))
                .ToListAsync();

            // Re-mapping result with correct counts
            var finalResult = posts.Select(p => {
                List<string> attachmentUrls = new List<string>();
                 if (!string.IsNullOrEmpty(p.AttachmentUrls))
                {
                    try 
                    {
                        if (p.AttachmentUrls.TrimStart().StartsWith("["))
                        {
                            attachmentUrls = System.Text.Json.JsonSerializer.Deserialize<List<string>>(p.AttachmentUrls) ?? new List<string>();
                        }
                        else
                        {
                             attachmentUrls.Add(p.AttachmentUrls);
                        }
                    }
                    catch 
                    {
                        attachmentUrls.Add(p.AttachmentUrls);
                    }
                }
                
                var embeds = SafeDeserializeEmbeds(p.Embeds);
                var state = readStates.FirstOrDefault(s => s.PostId == p.Id);
                var isUnread = state == null || p.LastActivityAt > state.LastReadAt;
                var lastReadAt = state?.LastReadAt ?? DateTime.MinValue;
                string? roleColor = GetUserRoleColor(p.Author, allRoles);
                var msgCount = messageCounts.ContainsKey(p.Id) ? messageCounts[p.Id] : 0;
                var postReactions = reactions.Where(r => r.PostId == p.Id).Select(r => new { r.UserId, r.Emoji }).ToList();

                return new {
                    p.Id,
                    p.Title,
                    p.Content,
                    p.CreatedAt,
                    p.LastActivityAt,
                    Author = new {
                        p.Author.Id,
                        p.Author.Username,
                        p.Author.Nickname,
                        p.Author.AvatarUrl,
                        p.Author.AccessLevel,
                        RoleColor = roleColor
                    },
                    MessageCount = msgCount,
                    AttachmentUrls = attachmentUrls,
                    isUnread,
                    lastReadAt,
                    Reactions = postReactions
                };
            });

            return Ok(finalResult);
        }

        [Authorize]
        [HttpPost("channels/{channelId}/posts")]
        public async Task<ActionResult<object>> CreatePost(int channelId, CreatePostDto request)
        {
            try
            {
                var userIdStr = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value 
                             ?? User.FindFirst("id")?.Value;
                int.TryParse(userIdStr, out int userId);
                
                if (userId == 0) return Unauthorized();

                string? attachmentUrlsJson = null;
                if (request.AttachmentUrls != null && request.AttachmentUrls.Any())
                {
                    attachmentUrlsJson = System.Text.Json.JsonSerializer.Serialize(request.AttachmentUrls);
                }

                // Process Embeds - Handle failures gracefully
                string? embedsJson = null;
                List<EmbedData> embedsList = new List<EmbedData>();
                try 
                {
                    embedsList = await _oEmbedService.ProcessContentAsync(request.Content);
                    if (embedsList.Any())
                    {
                        embedsJson = JsonSerializer.Serialize(embedsList);
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"[CreatePost] Embed processing failed: {ex.Message}");
                    // Continue without embeds
                }

                // Handle TimeZone cross-platform
                TimeZoneInfo cstZone;
                try 
                {
                    cstZone = TimeZoneInfo.FindSystemTimeZoneById("China Standard Time");
                }
                catch (TimeZoneNotFoundException)
                {
                    // Fallback for Linux/Docker
                    try 
                    {
                        cstZone = TimeZoneInfo.FindSystemTimeZoneById("Asia/Shanghai");
                    }
                    catch
                    {
                        cstZone = TimeZoneInfo.Utc;
                    }
                }

                var post = new Post
                {
                    ChannelId = channelId,
                    Title = request.Title,
                    Content = request.Content,
                    AuthorId = userId,
                    CreatedAt = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, cstZone),
                    LastActivityAt = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, cstZone),
                    AttachmentUrls = attachmentUrlsJson,
                    Embeds = embedsJson
                };

                _context.Posts.Add(post);
                
                // Update Channel LastActivity
                var channel = await _context.Channels.FindAsync(channelId);
                if (channel != null)
                {
                    channel.LastActivityAt = post.LastActivityAt;
                }

                await _context.SaveChangesAsync();

                // Load Author info for response
                var author = await _context.Users.FindAsync(userId);

                var response = new 
                {
                    post.Id,
                    post.Title,
                    post.Content,
                    post.CreatedAt,
                    post.LastActivityAt,
                    AttachmentUrls = request.AttachmentUrls ?? new List<string>(),
                    Embeds = embedsList,
                    Author = new {
                        author.Username,
                        author.AvatarUrl
                    },
                    MessageCount = 0
                };

                await _context.SaveChangesAsync();
                
                // Broadcast to channel
                await _hubContext.Clients.Group(channelId.ToString()).SendAsync("PostCreated", response);

                return CreatedAtAction(nameof(GetPosts), new { channelId }, response);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[CreatePost] Critical Error: {ex}");
                return StatusCode(500, new { title = "Internal Server Error", detail = ex.Message, stack = ex.StackTrace });
            }
        }

        [HttpGet("posts/{postId}/messages")]
        public async Task<ActionResult<IEnumerable<object>>> GetPostMessages(int postId)
        {
            var allRoles = await _context.CommunityRoles.ToListAsync();

            var messages = await _context.Messages
                .Where(m => m.PostId == postId)
                .OrderBy(m => m.CreatedAt)
                .Include(m => m.User)
                .ThenInclude(u => u.CommunityRoles)
                .Include(m => m.ReplyTo).ThenInclude(r => r.User)
                .Include(m => m.Reactions)
                .ToListAsync();

            var result = messages.Select(m => MapMessage(m, allRoles)).ToList();

            return Ok(result);
        }

        [Authorize]
        [HttpDelete("messages/{id}")]
        public async Task<IActionResult> DeleteMessage(int id)
        {
            var userIdStr = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value 
                         ?? User.FindFirst("id")?.Value;
            if (!int.TryParse(userIdStr, out int userId)) return Unauthorized();

            var message = await _context.Messages
                .Include(m => m.User)
                .FirstOrDefaultAsync(m => m.Id == id);

            if (message == null) return NotFound();

            // Check permissions
            bool isAuthor = message.UserId == userId;
            bool hasManageMessages = await HasPermissionAsync(userId, 4); // ManageMessages = 4

            if (!isAuthor && !hasManageMessages) return Forbid();

            _context.Messages.Remove(message);
            await _context.SaveChangesAsync();

            // Broadcast deletion
            await _hubContext.Clients.Group(message.ChannelId.ToString()).SendAsync("MessageDeleted", id);

            return NoContent();
        }

        [Authorize]
        [HttpPut("messages/{id}")]
        public async Task<IActionResult> EditMessage(int id, [FromBody] EditMessageDto request)
        {
            var userIdStr = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value 
                         ?? User.FindFirst("id")?.Value;
            if (!int.TryParse(userIdStr, out int userId)) return Unauthorized();

            var message = await _context.Messages.FindAsync(id);
            if (message == null) return NotFound();

            bool isAuthor = message.UserId == userId;
            bool hasManageMessages = await HasPermissionAsync(userId, 4); 

            if (!isAuthor && !hasManageMessages) return Forbid();

            message.Content = request.Content;
            message.UpdatedAt = DateTime.UtcNow;
            
            await _context.SaveChangesAsync();

            // Broadcast update
            await _hubContext.Clients.Group(message.ChannelId.ToString()).SendAsync("MessageUpdated", new {
                id = message.Id,
                content = message.Content,
                updatedAt = message.UpdatedAt
            });

            return Ok();
        }

        [Authorize]
        [HttpDelete("posts/{id}")]
        public async Task<IActionResult> DeletePost(int id)
        {
            var userIdStr = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value 
                         ?? User.FindFirst("id")?.Value;
            if (!int.TryParse(userIdStr, out int userId)) return Unauthorized();

            var post = await _context.Posts.FindAsync(id);
            if (post == null) return NotFound();

            bool isAuthor = post.AuthorId == userId;
            bool hasManageMessages = await HasPermissionAsync(userId, 4); 

            if (!isAuthor && !hasManageMessages) return Forbid();

            _context.Posts.Remove(post);
            await _context.SaveChangesAsync();

            await _hubContext.Clients.Group(post.ChannelId.ToString()).SendAsync("PostDeleted", id);

            return NoContent();
        }

        [Authorize]
        [HttpPut("posts/{id}")]
        public async Task<IActionResult> EditPost(int id, [FromBody] EditPostDto request)
        {
             var userIdStr = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value 
                         ?? User.FindFirst("id")?.Value;
            if (!int.TryParse(userIdStr, out int userId)) return Unauthorized();

            var post = await _context.Posts.FindAsync(id);
            if (post == null) return NotFound();

            bool isAuthor = post.AuthorId == userId;
            bool hasManageMessages = await HasPermissionAsync(userId, 4); 

            if (!isAuthor && !hasManageMessages) return Forbid();

            post.Title = request.Title;
            post.Content = request.Content;
            
            // Process Embeds again if content changed
            try 
            {
                var embedsList = await _oEmbedService.ProcessContentAsync(request.Content);
                if (embedsList.Any())
                {
                    post.Embeds = JsonSerializer.Serialize(embedsList);
                }
                else
                {
                    post.Embeds = null;
                }
            }
            catch {}

            await _context.SaveChangesAsync();

            await _hubContext.Clients.Group(post.ChannelId.ToString()).SendAsync("PostUpdated", new {
                id = post.Id,
                title = post.Title,
                content = post.Content,
                embeds = SafeDeserializeEmbeds(post.Embeds)
            });

            return Ok();
        }





        [Authorize]
        [HttpPost("channels")]
        public async Task<ActionResult<Channel>> CreateChannel(CreateChannelDto request)
        {
            var userIdStr = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value 
                         ?? User.FindFirst("id")?.Value;
            if (!int.TryParse(userIdStr, out int userId)) return Unauthorized();

            if (!await HasPermissionAsync(userId, 8)) return Forbid(); // ManageChannels

            var maxSortOrder = await _context.Channels.MaxAsync(c => (int?)c.SortOrder) ?? 0;

            // Handle TimeZone cross-platform
            TimeZoneInfo cstZone;
            try 
            {
                cstZone = TimeZoneInfo.FindSystemTimeZoneById("China Standard Time");
            }
            catch (TimeZoneNotFoundException)
            {
                try { cstZone = TimeZoneInfo.FindSystemTimeZoneById("Asia/Shanghai"); }
                catch { cstZone = TimeZoneInfo.Utc; }
            }

            var channel = new Channel
            {
                Name = request.Name,
                Description = request.Description,
                Type = request.Type,
                CategoryId = request.CategoryId,
                SortOrder = maxSortOrder + 1,
                CreatedAt = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, cstZone),
                // Initialize LastActivityAt to CreatedAt so it's not MinValue
                LastActivityAt = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, cstZone)
            };

            _context.Channels.Add(channel);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetChannels), new { id = channel.Id }, channel);
        }

        [Authorize]
        [HttpPut("channels/reorder")]
        public async Task<IActionResult> ReorderChannels(List<ReorderChannelDto> requests)
        {
            var userIdStr = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value 
                         ?? User.FindFirst("id")?.Value;
            if (!int.TryParse(userIdStr, out int userId)) return Unauthorized();

            if (!await HasPermissionAsync(userId, 8)) return Forbid(); // ManageChannels

            var ids = requests.Select(r => r.Id).ToList();
            var channels = await _context.Channels.Where(c => ids.Contains(c.Id)).ToListAsync();

            foreach (var req in requests)
            {
                var channel = channels.FirstOrDefault(c => c.Id == req.Id);
                if (channel != null)
                {
                    channel.SortOrder = req.SortOrder;
                    channel.CategoryId = req.CategoryId;
                }
            }

            await _context.SaveChangesAsync();
            return NoContent();
        }

        [Authorize]
        [HttpPut("channels/{id}")]
        public async Task<IActionResult> UpdateChannel(int id, UpdateChannelDto request)
        {
            var userIdStr = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value 
                         ?? User.FindFirst("id")?.Value;
            if (!int.TryParse(userIdStr, out int userId)) return Unauthorized();

            if (!await HasPermissionAsync(userId, 8)) return Forbid(); // ManageChannels

            var channel = await _context.Channels.FindAsync(id);
            if (channel == null) return NotFound();

            channel.Name = request.Name;
            channel.Description = request.Description;
            if (request.CategoryId.HasValue) 
            {
                channel.CategoryId = request.CategoryId;
            }
            
            await _context.SaveChangesAsync();

            return NoContent();
        }

        [Authorize]


        [Authorize]
        [HttpDelete("channels/{id}")]
        public async Task<IActionResult> DeleteChannel(int id)
        {
            var userIdStr = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value 
                         ?? User.FindFirst("id")?.Value;
            if (!int.TryParse(userIdStr, out int userId)) return Unauthorized();

            if (!await HasPermissionAsync(userId, 8)) return Forbid(); // ManageChannels

            var channel = await _context.Channels.FindAsync(id);
            if (channel == null) return NotFound();

            _context.Channels.Remove(channel);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        // === Community Settings & Roles ===

        [HttpGet("settings")]
        public async Task<ActionResult<object>> GetSettings()
        {
            var settings = await _context.CommunitySettings.FirstOrDefaultAsync() 
                           ?? new CommunitySettings();
            
            // New Role Logic: Return all roles, ordered by SortOrder (high to low usually in Discord)
            // But let's do simple SortOrder ascending for now or descending? 
            // Typically higher roles are at the top visually.
            var roles = await _context.CommunityRoles.OrderByDescending(r => r.SortOrder).ToListAsync();
            
            return new {
                settings,
                roles
            };
        }

        [Authorize]
        [HttpPut("settings")]
        public async Task<IActionResult> UpdateSettings([FromBody] CommunitySettings request)
        {
            var userIdStr = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value 
                         ?? User.FindFirst("id")?.Value;
            if (!int.TryParse(userIdStr, out int userId)) return Unauthorized();

            if (!await HasPermissionAsync(userId, 256)) return Forbid(); // Administrator
            
            var settings = await _context.CommunitySettings.FirstOrDefaultAsync();
            if (settings == null)
            {
                settings = new CommunitySettings();
                _context.CommunitySettings.Add(settings);
            }
            
            if (!string.IsNullOrEmpty(request.ServerName))
            {
                settings.ServerName = request.ServerName;
            }

            if (!string.IsNullOrEmpty(request.IconUrl)) settings.IconUrl = request.IconUrl;
            // Allow clearing the theme image if explicit null/empty? 
            // Current logic only updates if not empty.
            // If we want to allow clearing, we need a different approach.
            // But for now, user wants to SET it.
            if (!string.IsNullOrEmpty(request.ThemeImageUrl)) settings.ThemeImageUrl = request.ThemeImageUrl;
            
            // Allow clearing default channel (if sent as 0 or null? JSON usually handles nullable int)
            // If request.DefaultChannelId is null, it means "don't update" or "clear"?
            // Usually partial update needs specific logic.
            // For now, let's assume if it is provided (not null), update it. 
            // If we want to clear it, we might need a special value or just handle it here.
            // But since this endpoint receives the FULL object usually in my frontend logic...
            
            // Actually, frontend sends full object.
            // So we can update everything.
            settings.DefaultChannelId = request.DefaultChannelId;

            await _context.SaveChangesAsync();
            return Ok(settings);
        }

        // === Role Management ===

        [Authorize]
        [HttpGet("roles")]
        public async Task<ActionResult<IEnumerable<CommunityRole>>> GetRoles()
        {
             return await _context.CommunityRoles.OrderByDescending(r => r.SortOrder).ToListAsync();
        }

        [Authorize]
        [HttpPost("roles")]
        public async Task<ActionResult<CommunityRole>> CreateRole(CommunityRole request)
        {
            var userIdStr = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value 
                         ?? User.FindFirst("id")?.Value;
            if (!int.TryParse(userIdStr, out int userId)) return Unauthorized();

            if (!await HasPermissionAsync(userId, 16)) return Forbid(); // ManageRoles

            var maxSort = await _context.CommunityRoles.MaxAsync(r => (int?)r.SortOrder) ?? 0;
            request.SortOrder = maxSort + 1;
            request.IsSystem = false; // Cannot create system roles manually

            _context.CommunityRoles.Add(request);
            await _context.SaveChangesAsync();
            
            _cache.Remove("CommunityRoles");

            return CreatedAtAction(nameof(GetRoles), new { id = request.Id }, request);
        }

        [Authorize]
        [HttpPut("roles/{id}")]
        public async Task<IActionResult> UpdateRole(int id, CommunityRole request)
        {
            var userIdStr = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value 
                         ?? User.FindFirst("id")?.Value;
            if (!int.TryParse(userIdStr, out int userId)) return Unauthorized();

            if (!await HasPermissionAsync(userId, 16)) return Forbid(); // ManageRoles
            
            var role = await _context.CommunityRoles.FindAsync(id);
            if (role == null) return NotFound();
            
            role.Name = request.Name;
            role.Color = request.Color;
            role.Permissions = request.Permissions;
            role.IsHoisted = request.IsHoisted;
            // Allow reordering if passed? For now assume simple updates.
            
            await _context.SaveChangesAsync();
            _cache.Remove("CommunityRoles");
            
            return Ok(role);
        }

        [Authorize]
        [HttpDelete("roles/{id}")]
        public async Task<IActionResult> DeleteRole(int id)
        {
            var userIdStr = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value 
                         ?? User.FindFirst("id")?.Value;
            if (!int.TryParse(userIdStr, out int userId)) return Unauthorized();

            if (!await HasPermissionAsync(userId, 16)) return Forbid(); // ManageRoles

            var role = await _context.CommunityRoles.FindAsync(id);
            if (role == null) return NotFound();
            
            if (role.IsSystem) return BadRequest("Cannot delete system roles.");

            _context.CommunityRoles.Remove(role);
            await _context.SaveChangesAsync();
            _cache.Remove("CommunityRoles");
            
            return NoContent();
        }

        // === Member Role Assignment ===

        [Authorize]
        [HttpGet("members")]
        [ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
        public async Task<ActionResult<IEnumerable<object>>> GetMembers()
        {
            // Allow all authenticated users to see members list
            // if (!HasAdminAccess()) return Forbid();

            var threshold = DateTime.UtcNow.AddMinutes(-2);
            
            var allRoles = await _cache.GetOrCreateAsync("CommunityRoles", async entry =>
            {
                entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(10);
                return await _context.CommunityRoles.OrderByDescending(r => r.SortOrder).ToListAsync();
            }) ?? new List<CommunityRole>();

            var users = await _context.Users
                .Include(u => u.CommunityRoles)
                .ThenInclude(ur => ur.CommunityRole)
                .ToListAsync();

            var result = users.Select(u => new 
                {
                    id = u.Id,
                    username = u.Username,
                    nickname = u.Nickname,
                    aboutMe = u.AboutMe,
                    preferredStatus = u.LastActiveAt > threshold ? u.PreferredStatus : 3,
                    accessLevel = u.AccessLevel,
                    avatarUrl = u.AvatarUrl,
                    roles = allRoles
                        .Where(r => u.CommunityRoles.Any(ur => ur.CommunityRoleId == r.Id) || (r.AccessLevel.HasValue && r.AccessLevel == u.AccessLevel))
                        .Select(r => r.Id)
                        .ToList(),
                    roleColor = GetUserRoleColor(u, allRoles)
                })
                .ToList();

            return Ok(result);
        }

        [Authorize]
        [HttpPost("members/{userId}/roles")]
        public async Task<IActionResult> AssignRole(int userId, [FromBody] int roleId)
        {
            var requesterIdStr = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value 
                         ?? User.FindFirst("id")?.Value;
            if (!int.TryParse(requesterIdStr, out int requesterId)) return Unauthorized();

            if (!await HasPermissionAsync(requesterId, 16)) return Forbid(); // ManageRoles

            var role = await _context.CommunityRoles.FindAsync(roleId);
            if (role == null) return NotFound("Role not found");

            var user = await _context.Users.FindAsync(userId);
            if (user == null) return NotFound("User not found");

            var exists = await _context.UserCommunityRoles
                .AnyAsync(ur => ur.UserId == userId && ur.CommunityRoleId == roleId);

            if (!exists)
            {
                _context.UserCommunityRoles.Add(new UserCommunityRole
                {
                    UserId = userId,
                    CommunityRoleId = roleId
                });

                // Update AccessLevel if the new role has a higher AccessLevel
                if (role.AccessLevel.HasValue && role.AccessLevel.Value > user.AccessLevel)
                {
                    user.AccessLevel = role.AccessLevel.Value;
                }

                await _context.SaveChangesAsync();
            }

            return Ok();
        }

        [Authorize]
        [HttpDelete("members/{userId}/roles/{roleId}")]
        public async Task<IActionResult> RemoveRole(int userId, int roleId)
        {
            var requesterIdStr = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value 
                         ?? User.FindFirst("id")?.Value;
            if (!int.TryParse(requesterIdStr, out int requesterId)) return Unauthorized();

            if (!await HasPermissionAsync(requesterId, 16)) return Forbid(); // ManageRoles

            var user = await _context.Users
                .Include(u => u.CommunityRoles)
                .ThenInclude(ur => ur.CommunityRole)
                .FirstOrDefaultAsync(u => u.Id == userId);

            if (user == null) return NotFound("User not found");

            var roleToRemove = await _context.CommunityRoles.FindAsync(roleId);
            if (roleToRemove == null) return NotFound("Role not found");

            var userRole = user.CommunityRoles.FirstOrDefault(ur => ur.CommunityRoleId == roleId);

            bool changed = false;

            // 1. Remove explicit role if it exists
            if (userRole != null)
            {
                _context.UserCommunityRoles.Remove(userRole);
                changed = true;
            }

            // 2. Check if we need to downgrade AccessLevel
            // This handles cases where:
            // a) We removed the explicit role that provided the level
            // b) The user was in a "stuck" state (no explicit role but high AccessLevel) matching this role
            if (roleToRemove.AccessLevel.HasValue && user.AccessLevel == roleToRemove.AccessLevel.Value)
            {
                // Recalculate level from REMAINING roles
                var remainingRoles = user.CommunityRoles
                    .Where(ur => ur.CommunityRoleId != roleId && ur.CommunityRole != null && ur.CommunityRole.AccessLevel.HasValue)
                    .Select(ur => ur.CommunityRole!)
                    .ToList();

                int newLevel = remainingRoles.Any() 
                    ? remainingRoles.Max(r => r.AccessLevel!.Value) 
                    : 0; // Default to User level (0)

                if (user.AccessLevel != newLevel)
                {
                    user.AccessLevel = newLevel;
                    changed = true;
                }
            }

            if (changed)
            {
                await _context.SaveChangesAsync();
            }

            return NoContent();
        }

        [Authorize]
        [HttpPost("upload")]
        public async Task<IActionResult> UploadFile(IFormFile file)
        {
            if (file == null || file.Length == 0)
                return BadRequest("No file uploaded.");

            var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".gif", ".webp" };
            var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
            if (!allowedExtensions.Contains(extension))
                return BadRequest("Invalid file type.");

            var uploadsFolder = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads");
            if (!Directory.Exists(uploadsFolder))
                Directory.CreateDirectory(uploadsFolder);

            var fileName = Guid.NewGuid().ToString() + extension;
            var filePath = Path.Combine(uploadsFolder, fileName);

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            var url = $"/uploads/{fileName}";
            return Ok(new { url });
        }

        [Authorize]
        [HttpPost("channels/{channelId}/ack")]
        public async Task<IActionResult> MarkChannelRead(int channelId)
        {
            var userIdStr = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value 
                         ?? User.FindFirst("id")?.Value;
            if (!int.TryParse(userIdStr, out int userId)) return Unauthorized();

            var state = await _context.UserChannelStates
                .FirstOrDefaultAsync(ucs => ucs.UserId == userId && ucs.ChannelId == channelId);

            if (state == null)
            {
                state = new UserChannelState
                {
                    UserId = userId,
                    ChannelId = channelId,
                    UnreadMentionCount = 0,
                    LastReadAt = DateTime.UtcNow
                };
                _context.UserChannelStates.Add(state);
            }
            else
            {
                state.UnreadMentionCount = 0;
                state.LastReadAt = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();
            return Ok();
        }

        [Authorize]
        [HttpPost("posts/{postId}/ack")]
        public async Task<IActionResult> MarkPostRead(int postId)
        {
            var userIdStr = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value 
                         ?? User.FindFirst("id")?.Value;
            if (!int.TryParse(userIdStr, out int userId)) return Unauthorized();

            var state = await _context.UserPostStates
                .FirstOrDefaultAsync(ups => ups.UserId == userId && ups.PostId == postId);

            if (state == null)
            {
                state = new UserPostState
                {
                    UserId = userId,
                    PostId = postId,
                    LastReadAt = DateTime.UtcNow
                };
                _context.UserPostStates.Add(state);
            }
            else
            {
                state.LastReadAt = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();
            return Ok();
        }

        [Authorize]
        [HttpPut("channels/{channelId}/permissions")]
        public async Task<IActionResult> UpdateChannelPermissions(int channelId, [FromBody] List<ChannelPermissionOverrideDto> overrides)
        {
            var userIdStr = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value 
                        ?? User.FindFirst("id")?.Value;
            if (!int.TryParse(userIdStr, out int userId)) return Unauthorized();

            // Check ManageChannels (8)
            if (!await HasPermissionAsync(userId, 8)) return Forbid();

            var channel = await _context.Channels
                .Include(c => c.PermissionOverrides)
                .FirstOrDefaultAsync(c => c.Id == channelId);

            if (channel == null) return NotFound();

            // Clear existing overrides
            _context.ChannelPermissionOverrides.RemoveRange(channel.PermissionOverrides);

            // Add new overrides
            foreach (var ov in overrides)
            {
                channel.PermissionOverrides.Add(new ChannelPermissionOverride
                {
                    ChannelId = channelId,
                    RoleId = ov.RoleId,
                    Allow = ov.Allow,
                    Deny = ov.Deny
                });
            }

            await _context.SaveChangesAsync();
            return Ok();
        }

        private async Task<bool> HasPermissionAsync(int userId, long permissionBit)
        {
            var user = await _context.Users
                .Include(u => u.CommunityRoles)
                .ThenInclude(ucr => ucr.CommunityRole)
                .FirstOrDefaultAsync(u => u.Id == userId);
            
            if (user == null) return false;
            if (user.AccessLevel >= 3) return true; // Admin or higher

            long perms = 0;
            if (user.CommunityRoles != null)
            {
                foreach (var ucr in user.CommunityRoles)
                {
                    if (ucr.CommunityRole != null)
                        perms |= (long)ucr.CommunityRole.Permissions;
                }
            }

            if ((perms & 256) == 256) return true; // Administrator

            return (perms & permissionBit) == permissionBit;
        }

        private bool HasAdminAccess()
        {
            var accessLevelClaim = User.FindFirst("AccessLevel");
            if (accessLevelClaim == null || !int.TryParse(accessLevelClaim.Value, out int level)) return false;
            
            // Allow Admin (2), Partner (3), and Owner (4)
            // Note: After previous refactor, Admin might be 3.
            return level >= StoryOfTime.Server.Models.User.Level_Admin;
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
    }

    public class EditMessageDto
    {
        public string Content { get; set; } = string.Empty;
    }

    public class CreateChannelDto
    {
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Type { get; set; } = "Chat";
        public int? CategoryId { get; set; }
    }

    public class UpdateChannelDto
    {
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public int? CategoryId { get; set; }
    }

    public class ReorderChannelDto
    {
        public int Id { get; set; }
        public int SortOrder { get; set; }
        public int? CategoryId { get; set; }
    }

    public class CreatePostDto
    {
        public string Title { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
        public List<string>? AttachmentUrls { get; set; }
    }


}
