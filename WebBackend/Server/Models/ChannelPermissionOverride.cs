using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace StoryOfTime.Server.Models
{
    public class ChannelPermissionOverride
    {
        public int Id { get; set; }

        public int ChannelId { get; set; }
        [ForeignKey("ChannelId")]
        public Channel Channel { get; set; }

        public int RoleId { get; set; }
        [ForeignKey("RoleId")]
        public CommunityRole Role { get; set; }

        // Use long to support more than 32 permissions if needed, matching bitwise operations
        public long Allow { get; set; }
        public long Deny { get; set; }
    }
}
