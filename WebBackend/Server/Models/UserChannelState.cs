using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace StoryOfTime.Server.Models
{
    public class UserChannelState
    {
        public int Id { get; set; }

        public int UserId { get; set; }
        [ForeignKey("UserId")]
        public User User { get; set; }

        public int ChannelId { get; set; }
        [ForeignKey("ChannelId")]
        public Channel Channel { get; set; }

        public int UnreadMentionCount { get; set; } = 0;

        public int LastReadMessageId { get; set; } = 0;

        public DateTime LastReadAt { get; set; } = DateTime.MinValue;
    }
}
