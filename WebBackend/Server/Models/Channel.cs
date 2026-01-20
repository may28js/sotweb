using System.ComponentModel.DataAnnotations;

namespace StoryOfTime.Server.Models
{
    public class Channel
    {
        public int Id { get; set; }

        [Required]
        [MaxLength(50)]
        public string Name { get; set; } = string.Empty;

        [MaxLength(200)]
        public string Description { get; set; } = string.Empty;

        public string Type { get; set; } = "Chat"; // "Chat", "Forum", or "Category"

        public int? CategoryId { get; set; }

        public int SortOrder { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime LastActivityAt { get; set; } = DateTime.UtcNow;

        public bool IsSystem { get; set; } = false;

        [System.ComponentModel.DataAnnotations.Schema.NotMapped]
        public int UnreadCount { get; set; }

        [System.ComponentModel.DataAnnotations.Schema.NotMapped]
        public bool HasUnread { get; set; }

        public ICollection<ChannelPermissionOverride> PermissionOverrides { get; set; } = new List<ChannelPermissionOverride>();
    }
}
