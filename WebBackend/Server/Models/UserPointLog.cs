using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace StoryOfTime.Server.Models
{
    public class UserPointLog
    {
        public int Id { get; set; }

        public int UserId { get; set; }
        public User? User { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal Amount { get; set; } // Positive for gain, negative for spend

        [MaxLength(50)]
        public string Source { get; set; } = string.Empty; // e.g. "Store Purchase", "Donation", "Vote"

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
