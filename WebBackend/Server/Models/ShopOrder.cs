using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace StoryOfTime.Server.Models
{
    public class ShopOrder
    {
        public int Id { get; set; }

        public int UserId { get; set; }
        public User? User { get; set; }

        public int ShopItemId { get; set; }
        public ShopItem? ShopItem { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal Cost { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [MaxLength(20)]
        public string Status { get; set; } = "Pending"; // Pending, Delivered, Failed

        // To which character was this sent?
        public int CharacterId { get; set; }
        [MaxLength(50)]
        public string CharacterName { get; set; } = string.Empty;
        
        // Log info
        public string IpAddress { get; set; } = string.Empty;
    }
}
