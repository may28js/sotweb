using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using StoryOfTime.Server.Data;
using StoryOfTime.Server.Models;
using StoryOfTime.Server.Services;
using System.Security.Claims;
using System.Collections.Concurrent;
using System.Text.Json;

namespace StoryOfTime.Server.Hubs
{
    [Authorize]
    public class CommunityHub : Hub
    {
        private readonly ApplicationDbContext _context;
        private readonly IOEmbedService _oEmbedService;
        private readonly Microsoft.Extensions.Caching.Memory.IMemoryCache _cache;
        // Map UserId -> Set of ConnectionIds
        private static readonly ConcurrentDictionary<int, HashSet<string>> _onlineUsers = new();

        public CommunityHub(ApplicationDbContext context, IOEmbedService oEmbedService, Microsoft.Extensions.Caching.Memory.IMemoryCache cache)
        {
            _context = context;
            _oEmbedService = oEmbedService;
            _cache = cache;
        }

        public override async Task OnConnectedAsync()
        {
            var userIdStr = Context.UserIdentifier;
            if (!string.IsNullOrEmpty(userIdStr) && int.TryParse(userIdStr, out int userId))
            {
                _onlineUsers.AddOrUpdate(userId, 
                    k => new HashSet<string> { Context.ConnectionId },
                    (k, v) => {
                        lock (v) { v.Add(Context.ConnectionId); }
                        return v;
                    });

                // Check if this is the first connection (effectively online)
                bool isFirstConnection = false;
                if (_onlineUsers.TryGetValue(userId, out var connections))
                {
                    lock (connections)
                    {
                        // If count is 1, it implies it was just added (0 -> 1)
                        // However, AddOrUpdate runs the factory or update delegate.
                        // If factory ran, it's new. If update ran, we check count.
                        // Actually simpler: just check if we need to broadcast.
                        // We can broadcast every time? No, too noisy.
                        // We want to broadcast only when user goes Offline -> Online.
                        if (connections.Count == 1) isFirstConnection = true;
                    }
                }

                if (isFirstConnection)
                {
                    await Clients.All.SendAsync("UserConnected", userId);
                }
            }
            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            var userIdStr = Context.UserIdentifier;
            if (!string.IsNullOrEmpty(userIdStr) && int.TryParse(userIdStr, out int userId))
            {
                if (_onlineUsers.TryGetValue(userId, out var connections))
                {
                    bool isLastConnection = false;
                    lock (connections)
                    {
                        connections.Remove(Context.ConnectionId);
                        if (connections.Count == 0) isLastConnection = true;
                    }

                    if (isLastConnection)
                    {
                        await Clients.All.SendAsync("UserDisconnected", userId);
                        // Optional: Clean up dictionary to prevent memory leak over long time if users never return?
                        // _onlineUsers.TryRemove(userId, out _); 
                        // But keep it simple for now.
                    }
                }
            }
            await base.OnDisconnectedAsync(exception);
        }

        public Task<List<int>> GetOnlineUsers()
        {
            var onlineIds = _onlineUsers
                .Where(kvp => {
                    lock(kvp.Value) { return kvp.Value.Count > 0; }
                })
                .Select(kvp => kvp.Key)
                .ToList();
            return Task.FromResult(onlineIds);
        }

        public async Task JoinChannel(string channelId)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, channelId);
        }

        public async Task LeaveChannel(string channelId)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, channelId);
        }

        public async Task SendMessage(string channelId, string content, int? replyToId = null, string? attachmentUrls = null, int? postId = null)
        {
            var userId = Context.UserIdentifier;
            if (string.IsNullOrEmpty(userId) || !int.TryParse(userId, out int uId))
            {
                // Try getting from claim if UserIdentifier is not set correctly
                var idClaim = Context.User?.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier || c.Type == "id");
                if (idClaim != null && int.TryParse(idClaim.Value, out uId))
                {
                    // Found
                }
                else 
                {
                    return; // Unauthorized
                }
            }

            if (string.IsNullOrWhiteSpace(content) && string.IsNullOrEmpty(attachmentUrls)) return;
            if (!int.TryParse(channelId, out int cId)) return;

            // Defensive: Ensure PostId is null for Chat channels to prevent visibility issues
            var channel = await _context.Channels.FindAsync(cId);
            if (channel == null) return;
            if (string.Equals(channel.Type, "Chat", StringComparison.OrdinalIgnoreCase))
            {
                postId = null;
            }

            // Handle TimeZone cross-platform
            TimeZoneInfo cstZone;
            try { cstZone = TimeZoneInfo.FindSystemTimeZoneById("China Standard Time"); }
            catch { try { cstZone = TimeZoneInfo.FindSystemTimeZoneById("Asia/Shanghai"); } catch { cstZone = TimeZoneInfo.Utc; } }

            // Process Embeds
            string? embedsJson = null;
            List<EmbedData> embedsList = new List<EmbedData>();
            if (!string.IsNullOrWhiteSpace(content))
            {
                try 
                {
                    embedsList = await _oEmbedService.ProcessContentAsync(content);
                    Console.WriteLine($"[CommunityHub] Processed content, found {embedsList.Count} embeds.");
                    if (embedsList.Any())
                    {
                        embedsJson = JsonSerializer.Serialize(embedsList);
                        Console.WriteLine($"[CommunityHub] Serialized embeds: {embedsJson}");
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"[CommunityHub] Error processing embeds: {ex.Message}");
                }
            }

            // Save to DB
            var message = new Message
            {
                ChannelId = cId,
                UserId = uId,
                Content = content ?? string.Empty,
                ReplyToId = replyToId,
                AttachmentUrls = attachmentUrls,
                Embeds = embedsJson,
                PostId = postId,
                CreatedAt = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, cstZone)
            };

            _context.Messages.Add(message);
            
            // Update Post LastActivity
            if (postId.HasValue)
            {
                var post = await _context.Posts.FindAsync(postId.Value);
                if (post != null)
                {
                    post.LastActivityAt = message.CreatedAt;
                }
            }

            // Update Channel LastActivity
            channel.LastActivityAt = message.CreatedAt;

            await _context.SaveChangesAsync();

            // Load user info to send back (e.g. username, avatar)
            var user = await _context.Users
                .Include(u => u.CommunityRoles)
                .FirstOrDefaultAsync(u => u.Id == uId);
            
            // Handle Mentions (Persistent State)
            if (user != null)
            {
                await HandleMentions(cId, uId, content ?? "", user);
            }

            // Calculate Role Color
            string? roleColor = null;
            if (user != null)
            {
                var allRoles = await _cache.GetOrCreateAsync("CommunityRoles", async entry =>
                {
                    entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(10);
                    return await _context.CommunityRoles.OrderByDescending(r => r.SortOrder).ToListAsync();
                });

                var userRoleIds = user.CommunityRoles.Select(ur => ur.CommunityRoleId).ToList();
                
                var effectiveRoles = allRoles
                    .Where(r => userRoleIds.Contains(r.Id) || (r.AccessLevel.HasValue && r.AccessLevel == user.AccessLevel))
                    .OrderByDescending(r => r.SortOrder)
                    .ToList();

                var topRole = effectiveRoles.FirstOrDefault();
                if (topRole != null)
                {
                    roleColor = topRole.Color;
                }
            }

            // Load ReplyTo info
            object? replyToObj = null;
            if (replyToId.HasValue)
            {
                var repliedMsg = await _context.Messages.Include(m => m.User).FirstOrDefaultAsync(m => m.Id == replyToId.Value);
                if (repliedMsg != null)
                {
                    List<string> replyAttachmentUrls = new List<string>();
                    if (!string.IsNullOrEmpty(repliedMsg.AttachmentUrls))
                    {
                        try
                        {
                            if (repliedMsg.AttachmentUrls.TrimStart().StartsWith("["))
                            {
                                replyAttachmentUrls = System.Text.Json.JsonSerializer.Deserialize<List<string>>(repliedMsg.AttachmentUrls) ?? new List<string>();
                            }
                            else
                            {
                                replyAttachmentUrls.Add(repliedMsg.AttachmentUrls);
                            }
                        }
                        catch { }
                    }

                    replyToObj = new
                    {
                        id = repliedMsg.Id,
                        username = repliedMsg.User?.Username ?? "Unknown",
                        content = repliedMsg.Content,
                        userId = repliedMsg.UserId,
                        avatarUrl = repliedMsg.User?.AvatarUrl,
                        accessLevel = repliedMsg.User?.AccessLevel,
                        attachmentUrls = replyAttachmentUrls
                    };
                }
            }
            
            // Broadcast to group
            await Clients.Group(channelId).SendAsync("ReceiveMessage", new 
            {
                id = message.Id,
                channelId = message.ChannelId,
                postId = message.PostId,
                userId = message.UserId,
                user = new 
                {
                    id = message.UserId,
                    username = user?.Username ?? "Unknown",
                    nickname = user?.Nickname,
                    avatarUrl = user?.AvatarUrl,
                    accessLevel = user?.AccessLevel
                },
                roleColor = roleColor,
                content = message.Content,
                attachmentUrls = string.IsNullOrEmpty(message.AttachmentUrls) 
                    ? new List<string>() 
                    : (message.AttachmentUrls.TrimStart().StartsWith("[") 
                        ? JsonSerializer.Deserialize<List<string>>(message.AttachmentUrls) 
                        : new List<string> { message.AttachmentUrls }),
                embeds = embedsList,
                replyTo = replyToObj,
                reactions = new List<object>(),
                createdAt = message.CreatedAt
            });

            // Handle Mentions (Persistent State) - Moved after broadcast for performance
            if (user != null)
            {
                await HandleMentions(cId, uId, content ?? "", user);
            }
        }

        public async Task AddReaction(int messageId, string emoji)
        {
            var userId = Context.UserIdentifier;
            if (string.IsNullOrEmpty(userId) || !int.TryParse(userId, out int uId))
            {
                 var idClaim = Context.User?.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier || c.Type == "id");
                 if (idClaim != null && int.TryParse(idClaim.Value, out uId)) {} else return;
            }

            var message = await _context.Messages.FindAsync(messageId);
            if (message == null) return;

            var existing = await _context.MessageReactions
                .FirstOrDefaultAsync(r => r.MessageId == messageId && r.UserId == uId && r.Emoji == emoji);
            
            if (existing == null)
            {
                var reaction = new MessageReaction { MessageId = messageId, UserId = uId, Emoji = emoji };
                _context.MessageReactions.Add(reaction);
                await _context.SaveChangesAsync();
                
                await Clients.Group(message.ChannelId.ToString()).SendAsync("MessageReactionAdded", new {
                    messageId,
                    userId = uId,
                    emoji
                });
            }
        }

        public async Task RemoveReaction(int messageId, string emoji)
        {
            var userId = Context.UserIdentifier;
            if (string.IsNullOrEmpty(userId) || !int.TryParse(userId, out int uId))
            {
                 var idClaim = Context.User?.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier || c.Type == "id");
                 if (idClaim != null && int.TryParse(idClaim.Value, out uId)) {} else return;
            }

            var message = await _context.Messages.FindAsync(messageId);
            if (message == null) return;

            var existing = await _context.MessageReactions
                .FirstOrDefaultAsync(r => r.MessageId == messageId && r.UserId == uId && r.Emoji == emoji);

            if (existing != null)
            {
                _context.MessageReactions.Remove(existing);
                await _context.SaveChangesAsync();

                await Clients.Group(message.ChannelId.ToString()).SendAsync("MessageReactionRemoved", new {
                    messageId,
                    userId = uId,
                    emoji
                });
            }
        }

        public async Task AddPostReaction(int postId, string emoji)
        {
            var userId = Context.UserIdentifier;
            if (string.IsNullOrEmpty(userId) || !int.TryParse(userId, out int uId))
            {
                 var idClaim = Context.User?.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier || c.Type == "id");
                 if (idClaim != null && int.TryParse(idClaim.Value, out uId)) {} else return;
            }

            var post = await _context.Posts.FindAsync(postId);
            if (post == null) return;

            var existing = await _context.PostReactions
                .FirstOrDefaultAsync(r => r.PostId == postId && r.UserId == uId && r.Emoji == emoji);
            
            if (existing == null)
            {
                var reaction = new PostReaction { PostId = postId, UserId = uId, Emoji = emoji };
                _context.PostReactions.Add(reaction);
                await _context.SaveChangesAsync();
                
                await Clients.Group(post.ChannelId.ToString()).SendAsync("PostReactionAdded", new {
                    postId,
                    userId = uId,
                    emoji
                });
            }
        }

        public async Task RemovePostReaction(int postId, string emoji)
        {
            var userId = Context.UserIdentifier;
            if (string.IsNullOrEmpty(userId) || !int.TryParse(userId, out int uId))
            {
                 var idClaim = Context.User?.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier || c.Type == "id");
                 if (idClaim != null && int.TryParse(idClaim.Value, out uId)) {} else return;
            }

            var post = await _context.Posts.FindAsync(postId);
            if (post == null) return;

            var existing = await _context.PostReactions
                .FirstOrDefaultAsync(r => r.PostId == postId && r.UserId == uId && r.Emoji == emoji);

            if (existing != null)
            {
                _context.PostReactions.Remove(existing);
                await _context.SaveChangesAsync();

                await Clients.Group(post.ChannelId.ToString()).SendAsync("PostReactionRemoved", new {
                    postId,
                    userId = uId,
                    emoji
                });
            }
        }

        public async Task MarkChannelRead(string channelIdStr)
        {
            if (!int.TryParse(channelIdStr, out int channelId)) return;
            
            var userId = Context.UserIdentifier;
            if (string.IsNullOrEmpty(userId) || !int.TryParse(userId, out int uId))
            {
                var idClaim = Context.User?.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier || c.Type == "id");
                if (idClaim != null && int.TryParse(idClaim.Value, out uId)) {} else return;
            }

            var state = await _context.UserChannelStates.FirstOrDefaultAsync(s => s.UserId == uId && s.ChannelId == channelId);
            if (state == null)
            {
                state = new UserChannelState 
                { 
                    UserId = uId, 
                    ChannelId = channelId,
                    UnreadMentionCount = 0
                };
                _context.UserChannelStates.Add(state);
            }

            state.UnreadMentionCount = 0;
            // Use China Standard Time to match Message.CreatedAt
            TimeZoneInfo cstZone;
            try { cstZone = TimeZoneInfo.FindSystemTimeZoneById("China Standard Time"); }
            catch { try { cstZone = TimeZoneInfo.FindSystemTimeZoneById("Asia/Shanghai"); } catch { cstZone = TimeZoneInfo.Utc; } }
            var nowCst = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, cstZone);
            
            // Ensure LastReadAt is at least the channel's LastActivityAt if possible, 
            // but we don't want to query channel here if we can avoid it. 
            // However, to be safe against millisecond diffs, we can just use nowCst.
            // But if nowCst is slightly before LastActivityAt due to race condition?
            // Let's query channel to be safe.
            var channel = await _context.Channels.FindAsync(channelId);
            if (channel != null && channel.LastActivityAt > nowCst)
            {
                state.LastReadAt = channel.LastActivityAt;
            }
            else
            {
                state.LastReadAt = nowCst;
            }
            
            await _context.SaveChangesAsync();
        }

        public async Task MarkPostRead(int postId)
        {
            var userId = Context.UserIdentifier;
            if (string.IsNullOrEmpty(userId) || !int.TryParse(userId, out int uId))
            {
                var idClaim = Context.User?.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier || c.Type == "id");
                if (idClaim != null && int.TryParse(idClaim.Value, out uId)) {} else return;
            }

            var state = await _context.UserPostStates.FirstOrDefaultAsync(s => s.UserId == uId && s.PostId == postId);
            if (state == null)
            {
                state = new UserPostState 
                { 
                    UserId = uId, 
                    PostId = postId 
                };
                _context.UserPostStates.Add(state);
            }

            // Use China Standard Time
            TimeZoneInfo cstZone;
            try { cstZone = TimeZoneInfo.FindSystemTimeZoneById("China Standard Time"); }
            catch { try { cstZone = TimeZoneInfo.FindSystemTimeZoneById("Asia/Shanghai"); } catch { cstZone = TimeZoneInfo.Utc; } }
            var nowCst = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, cstZone);
            
            // Ensure we cover the current activity time
            var post = await _context.Posts.FindAsync(postId);
            if (post != null && post.LastActivityAt > nowCst)
            {
                 state.LastReadAt = post.LastActivityAt;
            }
            else
            {
                 state.LastReadAt = nowCst;
            }
            
            await _context.SaveChangesAsync();
        }

        public async Task DeleteMessage(int messageId)
        {
            Console.WriteLine($"[DeleteMessage] Request to delete message {messageId}");
            var userId = Context.UserIdentifier;
            int uId = 0;
            if (string.IsNullOrEmpty(userId) || !int.TryParse(userId, out uId))
            {
                 var idClaim = Context.User?.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier || c.Type == "id");
                 if (idClaim != null && int.TryParse(idClaim.Value, out uId)) {} 
                 else 
                 {
                     Console.WriteLine("[DeleteMessage] Unauthorized: Cannot determine User ID.");
                     return;
                 }
            }

            var message = await _context.Messages.FirstOrDefaultAsync(m => m.Id == messageId);
            if (message == null) 
            {
                Console.WriteLine($"[DeleteMessage] Message {messageId} not found.");
                return;
            }

            // Check permissions: Owner or Admin (AccessLevel >= 3)
            var user = await _context.Users
                .Include(u => u.CommunityRoles)
                .ThenInclude(ucr => ucr.CommunityRole)
                .FirstOrDefaultAsync(u => u.Id == uId);

            if (user == null) 
            {
                Console.WriteLine($"[DeleteMessage] User {uId} not found.");
                return;
            }

            bool isOwner = message.UserId == uId;
            bool hasPerm = HasPermission(user, 4); // ManageMessages

            if (!isOwner && !hasPerm) 
            {
                Console.WriteLine($"[DeleteMessage] Permission denied. User: {uId}, MsgOwner: {message.UserId}");
                return; // Forbidden
            }

            _context.Messages.Remove(message);
            await _context.SaveChangesAsync();
            Console.WriteLine($"[DeleteMessage] Message {messageId} deleted successfully.");

            await Clients.Group(message.ChannelId.ToString()).SendAsync("MessageDeleted", messageId);
        }

        private async Task HandleMentions(int channelId, int senderId, string content, User sender)
        {
            var mentionedUserIds = new HashSet<int>();

            // 1. Check for @everyone / @here (Admin only) - Case Insensitive
            // Now checking MentionEveryone permission (32)
            if (HasPermission(sender, 32) && 
               (content.Contains("@everyone", StringComparison.OrdinalIgnoreCase) || 
                content.Contains("@here", StringComparison.OrdinalIgnoreCase)))
            {
                // Update Global Notification Time
                var settings = await _context.CommunitySettings.FirstOrDefaultAsync();
                if (settings != null)
                {
                    settings.LastGlobalNotifyAt = DateTime.UtcNow;
                    // Don't save yet, will save at end of method or explicitly here if needed
                    // But HandleMentions calls SaveChanges at the end?
                    // Let's check where SaveChanges is called.
                    // It is called at the end of HandleMentions loop (line 540 in original file).
                    // Wait, HandleMentions iterates and adds to context.
                    // It calls SaveChanges at the end (line 540).
                    // So just modifying the tracked entity 'settings' is enough.
                }

                // Add ALL users except sender
                var allUserIds = await _context.Users
                    .Where(u => u.Id != senderId)
                    .Select(u => u.Id)
                    .ToListAsync();
                
                foreach (var uid in allUserIds) mentionedUserIds.Add(uid);
            }
            
            // 2. Check for @username - Case Insensitive Matching
            // Regex for @username
            var matches = System.Text.RegularExpressions.Regex.Matches(content, @"@(\S+)");
            if (matches.Count > 0)
            {
                var usernames = new List<string>();
                foreach (System.Text.RegularExpressions.Match match in matches)
                {
                    var username = match.Groups[1].Value;
                    if (!string.Equals(username, "everyone", StringComparison.OrdinalIgnoreCase) && 
                        !string.Equals(username, "here", StringComparison.OrdinalIgnoreCase))
                    {
                        usernames.Add(username);
                    }
                }

                if (usernames.Count > 0)
                {
                    // Find users by username (case insensitive if collation allows, but EF Core usually is)
                    // To be safe in memory or standard SQL:
                    var users = await _context.Users
                        .Where(u => usernames.Contains(u.Username)) 
                        .Select(u => new { u.Id, u.Username })
                        .ToListAsync();
                        
                    foreach(var u in users)
                    {
                        if (u.Id != senderId) mentionedUserIds.Add(u.Id);
                    }
                }
            }

            if (mentionedUserIds.Count > 0)
            {
                // Update UserChannelStates
                // Fetch existing states
                var existingStates = await _context.UserChannelStates
                    .Where(ucs => ucs.ChannelId == channelId && mentionedUserIds.Contains(ucs.UserId))
                    .ToListAsync();

                foreach (var uid in mentionedUserIds)
                {
                    var state = existingStates.FirstOrDefault(s => s.UserId == uid);
                    if (state == null)
                    {
                        state = new UserChannelState
                        {
                            UserId = uid,
                            ChannelId = channelId,
                            UnreadMentionCount = 0
                        };
                        _context.UserChannelStates.Add(state);
                    }
                    state.UnreadMentionCount++;
                    
                    // Push Real-time Notification
                    await Clients.User(uid.ToString()).SendAsync("UpdateUnreadCount", channelId, state.UnreadMentionCount);
                }
                await _context.SaveChangesAsync();
            }
        }


        public async Task DeletePost(int postId)
        {
            var userId = Context.UserIdentifier;
            int uId = 0;
            if (string.IsNullOrEmpty(userId) || !int.TryParse(userId, out uId))
            {
                 var idClaim = Context.User?.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier || c.Type == "id");
                 if (idClaim != null && int.TryParse(idClaim.Value, out uId)) {} 
                 else return;
            }

            var post = await _context.Posts.FindAsync(postId);
            if (post == null) return;

            // Check permissions: Owner or Admin
            var user = await _context.Users
                .Include(u => u.CommunityRoles)
                .ThenInclude(ucr => ucr.CommunityRole)
                .FirstOrDefaultAsync(u => u.Id == uId);
            if (user == null) return;

            bool isOwner = post.AuthorId == uId;
            bool hasPerm = HasPermission(user, 4); // ManageMessages (treat posts as messages for now)

            if (!isOwner && !hasPerm) return;

            _context.Posts.Remove(post);
            await _context.SaveChangesAsync();

            await Clients.Group(post.ChannelId.ToString()).SendAsync("PostDeleted", postId);
        }

        public async Task EditPost(int postId, string newTitle, string newContent)
        {
            var userId = Context.UserIdentifier;
            int uId = 0;
            if (string.IsNullOrEmpty(userId) || !int.TryParse(userId, out uId))
            {
                 var idClaim = Context.User?.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier || c.Type == "id");
                 if (idClaim != null && int.TryParse(idClaim.Value, out uId)) {} 
                 else return;
            }

            var post = await _context.Posts.FindAsync(postId);
            if (post == null) return;

            // Check permissions: Owner or Admin
            var user = await _context.Users
                .Include(u => u.CommunityRoles)
                .ThenInclude(ucr => ucr.CommunityRole)
                .FirstOrDefaultAsync(u => u.Id == uId);
            if (user == null) return;

            bool isOwner = post.AuthorId == uId;
            bool hasPerm = HasPermission(user, 4); // ManageMessages

            if (!isOwner && !hasPerm) return;

            post.Title = newTitle;
            post.Content = newContent;
            
            // Process Embeds for updated content
            var embedsList = await _oEmbedService.ProcessContentAsync(newContent);
            post.Embeds = embedsList.Any() ? JsonSerializer.Serialize(embedsList) : null;

            // Optionally update LastActivityAt or add an EditedAt field if schema supported it
            
            await _context.SaveChangesAsync();

            await Clients.Group(post.ChannelId.ToString()).SendAsync("PostUpdated", new {
                id = postId,
                title = newTitle,
                content = newContent,
                embeds = embedsList
            });
        }
        private bool HasPermission(User user, long permissionBit)
        {
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
    }
}
