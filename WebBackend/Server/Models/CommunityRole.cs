namespace StoryOfTime.Server.Models
{
    [Flags]
    public enum CommunityPermissions : long
    {
        None = 0,
        ViewChannels = 1 << 0,
        SendMessages = 1 << 1,
        ManageMessages = 1 << 2, // Delete others' messages
        ManageChannels = 1 << 3, // Create/Edit/Delete channels
        ManageRoles = 1 << 4,    // Create/Edit/Delete roles
        MentionEveryone = 1 << 5,
        KickMembers = 1 << 6,
        BanMembers = 1 << 7,
        Administrator = 1 << 8,   // Bypasses all checks
        Connect = 1 << 9          // Connect to Voice Channels (or "Enter" restricted channels)
    }

    public class CommunityRole
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Color { get; set; } = "#99AAB5"; // Default Gray
        public CommunityPermissions Permissions { get; set; } = CommunityPermissions.None;
        
        // Synchronization with Website Access Level
        // 5: Owner, 4: Partner, 3: Admin, 2: Moderator, 1: Intern, 0: User
        // null: Custom Role (not synced)
        public int? AccessLevel { get; set; } 

        public bool IsSystem { get; set; } = false; // If true, cannot be deleted
        public bool IsHoisted { get; set; } = false; // Display separately from online members
        public int SortOrder { get; set; } = 0; // For hierarchy
    }

    public class UserCommunityRole
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public User User { get; set; } = default!;
        public int CommunityRoleId { get; set; }
        public CommunityRole CommunityRole { get; set; } = default!;
    }
}
