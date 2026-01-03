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

        // Constants for Access Levels
        public const int Level_User = 0;
        public const int Level_Moderator = 1; // News, Support
        public const int Level_Admin = 2;     // Shop, Game Settings
        public const int Level_Partner = 3;   // Financial Stats (Read Only)
        public const int Level_Owner = 4;     // Full Control

        public int AccessLevel { get; set; } = Level_User; 
    }
}