using System.ComponentModel.DataAnnotations;

namespace StoryOfTime.Server.Models
{
    public class News
    {
        public int Id { get; set; }

        [Required]
        [MaxLength(200)]
        public string Title { get; set; } = string.Empty;

        [Required]
        public string Content { get; set; } = string.Empty;

        [MaxLength(50)]
        public string Author { get; set; } = string.Empty;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [MaxLength(20)]
        public string Type { get; set; } = "News"; // News, Update, Event, Maintenance

        [MaxLength(255)]
        public string Thumbnail { get; set; } = string.Empty;
    }
}