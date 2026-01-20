using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace StoryOfTime.Server.Models
{
    public class MessageReaction
    {
        public int Id { get; set; }

        public int MessageId { get; set; }
        [ForeignKey("MessageId")]
        public Message? Message { get; set; }

        public int UserId { get; set; }
        [ForeignKey("UserId")]
        public User? User { get; set; }

        [Required]
        public string Emoji { get; set; } = string.Empty;
    }
}
