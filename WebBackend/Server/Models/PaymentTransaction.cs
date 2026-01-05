using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace StoryOfTime.Server.Models
{
    public class PaymentTransaction
    {
        public int Id { get; set; }

        public int UserId { get; set; }
        [ForeignKey("UserId")]
        public User User { get; set; } = default!;

        public string OrderId { get; set; } = string.Empty; // Internal Order ID
        public string ExternalId { get; set; } = string.Empty; // Oxapay Invoice ID
        
        [Column(TypeName = "decimal(18,2)")]
        public decimal Amount { get; set; }
        
        public string Currency { get; set; } = "USDT";
        
        public string Status { get; set; } = "Pending"; // Pending, Completed, Failed, Expired
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? CompletedAt { get; set; }
    }
}
