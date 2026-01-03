namespace StoryOfTime.Server.DTOs
{
    public class PurchaseHistoryDto
    {
        public int Id { get; set; }
        public string ItemName { get; set; } = string.Empty;
        public decimal Cost { get; set; }
        public string CharacterName { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public string Status { get; set; } = string.Empty;
    }
}
