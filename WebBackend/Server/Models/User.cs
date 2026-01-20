using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace StoryOfTime.Server.Models
{
    public class User
    {
        public int Id { get; set; }

        [Required]
        [MaxLength(50)]
        public string Username { get; set; } = string.Empty;

        [Required]
        [EmailAddress]
        [MaxLength(100)]
        public string Email { get; set; } = string.Empty;

        [Required]
        public string PasswordHash { get; set; } = string.Empty;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Column(TypeName = "decimal(18,2)")]
        public decimal Points { get; set; } = 0; // Site currency

        public string? AvatarUrl { get; set; } // Custom Avatar URL

        [MaxLength(50)]
        public string? Nickname { get; set; }

        [MaxLength(500)]
        public string? AboutMe { get; set; }

        public int PreferredStatus { get; set; } = 0; // 0: Online, 1: Idle, 2: DoNotDisturb, 3: Invisible
        
        public DateTime LastActiveAt { get; set; } = DateTime.UtcNow;

        // Constants for Access Levels
        public const int Level_User = 0;
        public const int Level_InternModerator = 1; // New
        public const int Level_Moderator = 2; // News, Support
        public const int Level_Admin = 3;     // Shop, Game Settings
        public const int Level_Partner = 4;   // Financial Stats (Read Only)
        public const int Level_Owner = 5;     // Full Control

        public int AccessLevel { get; set; } = Level_User; 
        
        // Navigation property for Roles
        public ICollection<UserCommunityRole> CommunityRoles { get; set; } = new List<UserCommunityRole>();

        public DateTime LastReadGlobalNotifyAt { get; set; } = DateTime.UtcNow;
    }
}
