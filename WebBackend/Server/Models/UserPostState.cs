using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace StoryOfTime.Server.Models
{
    public class UserPostState
    {
        public int Id { get; set; }

        public int UserId { get; set; }
        [ForeignKey("UserId")]
        public User? User { get; set; }

        public int PostId { get; set; }
        [ForeignKey("PostId")]
        public Post? Post { get; set; }

        public DateTime LastReadAt { get; set; } = DateTime.MinValue;
    }
}
