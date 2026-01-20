using StoryOfTime.Server.Models;
using Microsoft.EntityFrameworkCore;

namespace StoryOfTime.Server.Data
{
    public static class DbSeeder
    {
        public static void SeedCommunity(ApplicationDbContext context)
        {
            // Seed Default Admin User
            if (!context.Users.Any())
            {
                 Console.WriteLine("[DbSeeder] Seeding Default Admin User...");
                 var adminUser = new User
                 {
                     Username = "admin",
                     Email = "admin@storyoftime.com",
                     PasswordHash = BCrypt.Net.BCrypt.HashPassword("admin"),
                     AccessLevel = 5, // Owner
                     Points = 99999,
                     CreatedAt = DateTime.UtcNow
                 };
                 context.Users.Add(adminUser);
                 context.SaveChanges();
                 Console.WriteLine("[DbSeeder] Default Admin User seeded (admin/admin).");
            }

            Console.WriteLine("[DbSeeder] Checking Community Settings...");
            if (!context.CommunitySettings.Any())
            {
                Console.WriteLine("[DbSeeder] Seeding Default Community Settings...");
                context.CommunitySettings.Add(new CommunitySettings
                {
                    ServerName = "时之故事社区"
                });
                context.SaveChanges();
            }

            Console.WriteLine("[DbSeeder] Checking Community Roles...");
            
            // Check if we need to seed initial roles
            // We check if "Owner" (Level 5) exists as a marker
            if (!context.CommunityRoles.Any(r => r.AccessLevel == 5))
            {
                Console.WriteLine("[DbSeeder] Seeding Default Roles...");
                
                var roles = new List<CommunityRole>
                {
                    new CommunityRole 
                    { 
                        Name = "所有者", 
                        Color = "#ED4245", 
                        AccessLevel = 5, 
                        SortOrder = 100,
                        Permissions = CommunityPermissions.Administrator,
                        IsSystem = true
                    },
                    new CommunityRole 
                    { 
                        Name = "合伙人", 
                        Color = "#9B59B6", 
                        AccessLevel = 4, 
                        SortOrder = 90,
                        Permissions = CommunityPermissions.Administrator,
                        IsSystem = true
                    },
                    new CommunityRole 
                    { 
                        Name = "管理员", 
                        Color = "#1ABC9C", 
                        AccessLevel = 3, 
                        SortOrder = 80,
                        Permissions = CommunityPermissions.Administrator,
                        IsSystem = true
                    },
                    new CommunityRole 
                    { 
                        Name = "版主", 
                        Color = "#3498DB", 
                        AccessLevel = 2, 
                        SortOrder = 70,
                        Permissions = CommunityPermissions.ManageMessages | CommunityPermissions.KickMembers | CommunityPermissions.BanMembers | CommunityPermissions.ViewChannels | CommunityPermissions.SendMessages,
                        IsSystem = true
                    },
                    new CommunityRole 
                    { 
                        Name = "实习版主", 
                        Color = "#F1C40F", 
                        AccessLevel = 1, 
                        SortOrder = 60,
                        Permissions = CommunityPermissions.ManageMessages | CommunityPermissions.ViewChannels | CommunityPermissions.SendMessages,
                        IsSystem = true
                    },
                    new CommunityRole 
                    { 
                        Name = "普通用户", 
                        Color = "#99AAB5", 
                        AccessLevel = 0, 
                        SortOrder = 10,
                        Permissions = CommunityPermissions.ViewChannels | CommunityPermissions.SendMessages,
                        IsSystem = true
                    }
                };

                context.CommunityRoles.AddRange(roles);
                context.SaveChanges();
                Console.WriteLine("[DbSeeder] Roles seeded.");
            }
            
            Console.WriteLine("[DbSeeder] Community Roles check completed.");

            // Seed Default Channels if none exist
            if (!context.Channels.Any())
            {
                Console.WriteLine("[DbSeeder] Seeding Default Channels...");
                var defaultChannels = new List<Channel>
                {
                    new Channel
                    {
                        Name = "公告",
                        Description = "社区公告发布",
                        Type = "Chat", // Changed from Post to Chat to match frontend types
                        CategoryId = null,
                        SortOrder = 0,
                        IsSystem = true
                    },
                    new Channel
                    {
                        Name = "综合讨论",
                        Description = "畅所欲言",
                        Type = "Chat",
                        CategoryId = null,
                        SortOrder = 1,
                        IsSystem = true
                    }
                };
                context.Channels.AddRange(defaultChannels);
                context.SaveChanges();
                Console.WriteLine("[DbSeeder] Default Channels seeded.");
            }

            // Fix visibility issue for messages sent in Chat channels but linked to a Post
            // This happens due to a previous frontend bug where postId was not cleared when switching channels
            var chatChannelIds = context.Channels
                .Where(c => c.Type == "Chat")
                .Select(c => c.Id)
                .ToList();

            if (chatChannelIds.Any())
            {
                var brokenMessages = context.Messages
                    .Where(m => chatChannelIds.Contains(m.ChannelId) && m.PostId != null)
                    .ToList();

                if (brokenMessages.Any())
                {
                    Console.WriteLine($"[Fix] Found {brokenMessages.Count} messages with visibility issues. Fixing...");
                    foreach (var msg in brokenMessages)
                    {
                        msg.PostId = null;
                    }
                    context.SaveChanges();
                    Console.WriteLine("[Fix] Messages restored.");
                }
            }
            // === Fix Data Consistency ===
            Console.WriteLine("[DbSeeder] Checking Data Consistency...");
            
            // 1. Fix Messages in Chat channels having PostId (which makes them invisible)
            var chatChannels = context.Channels.Where(c => c.Type == "Chat").Select(c => c.Id).ToList();
            if (chatChannels.Any())
            {
                var dirtyMessages = context.Messages
                    .Where(m => chatChannels.Contains(m.ChannelId) && m.PostId != null)
                    .ToList();

                if (dirtyMessages.Any())
                {
                    Console.WriteLine($"[DbSeeder] Found {dirtyMessages.Count} messages in Chat channels with PostId. Fixing...");
                    foreach (var msg in dirtyMessages)
                    {
                        msg.PostId = null;
                    }
                    context.SaveChanges();
                    Console.WriteLine("[DbSeeder] Fixed dirty messages.");
                }
            }
        }
    }
}
