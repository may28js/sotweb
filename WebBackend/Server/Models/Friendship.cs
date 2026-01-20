using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace StoryOfTime.Server.Models
{
    public class Friendship
    {
        public int Id { get; set; }

        public int RequesterId { get; set; }
        [ForeignKey("RequesterId")]
        public User Requester { get; set; }

        public int AddresseeId { get; set; }
        [ForeignKey("AddresseeId")]
        public User Addressee { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public int Status { get; set; } // 0: Pending, 1: Accepted, 2: Declined, 3: Blocked
    }
}
