using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace StoryOfTime.Server.Models
{
    public class Message
    {
        public int Id { get; set; }

        public int ChannelId { get; set; }
        [JsonIgnore]
        public Channel? Channel { get; set; }

        public int UserId { get; set; }
        [ForeignKey("UserId")]
        public User? User { get; set; }

        [Required]
        public string Content { get; set; } = string.Empty;

        public int? ReplyToId { get; set; }
        [ForeignKey("ReplyToId")]
        public Message? ReplyTo { get; set; }

        public string? AttachmentUrls { get; set; }

        public string? Embeds { get; set; }

        public int? PostId { get; set; }
        [ForeignKey("PostId")]
        [JsonIgnore]
        public Post? Post { get; set; }

        public ICollection<MessageReaction> Reactions { get; set; } = new List<MessageReaction>();

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? UpdatedAt { get; set; }
    }
}
