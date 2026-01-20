using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace StoryOfTime.Server.Models
{
    public class PostReaction
    {
        public int Id { get; set; }

        public int PostId { get; set; }
        [ForeignKey("PostId")]
        public Post? Post { get; set; }

        public int UserId { get; set; }
        [ForeignKey("UserId")]
        public User? User { get; set; }

        [Required]
        public string Emoji { get; set; } = string.Empty;
    }
}
