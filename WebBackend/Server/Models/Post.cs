using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace StoryOfTime.Server.Models
{
    public class Post
    {
        public int Id { get; set; }

        public int ChannelId { get; set; }
        [JsonIgnore]
        public Channel? Channel { get; set; }

        [Required]
        [MaxLength(100)]
        public string Title { get; set; } = string.Empty;

        // Initial content preview or just logical content
        public string Content { get; set; } = string.Empty;

        public int AuthorId { get; set; }
        [ForeignKey("AuthorId")]
        public User? Author { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime LastActivityAt { get; set; } = DateTime.UtcNow;

        public string? AttachmentUrls { get; set; }

        public string? Embeds { get; set; }

        // Navigation property for messages in this post
        public ICollection<Message> Messages { get; set; } = new List<Message>();

        public ICollection<PostReaction> Reactions { get; set; } = new List<PostReaction>();
    }
}
